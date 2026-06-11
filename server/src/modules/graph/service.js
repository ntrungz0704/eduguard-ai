const fs = require('fs');
const path = require('path');

const { prisma } = require('../../infrastructure/database/prisma');
const _ = require('lodash');
const cache = require('../../shared/cache');
const { calculateFptGPA } = require('../../utils/dataService');

const DEFAULT_TRAINING_DATA = { students: [], subjects: [], curriculumOrder: [] };
const DEFAULT_CHAIN_EXPLANATION = {
  why: 'No dependency narrative available.',
  impact: 'No blocked progression identified.',
  recovery: 'No recovery plan available.',
  interventions: [],
};

class GraphService {
  async getDependencies() {
    const curriculumData = this.loadCurriculumData();
    const courseIndex = this.buildCourseIndex(curriculumData);
    const { ACADEMIC_PREREQUISITES } = require('../../ai/regression');

    const nodes = [];
    const edges = [];

    // Add nodes from curriculum
    courseIndex.forEach((course) => {
      nodes.push({
        id: course.code,
        label: course.name,
        title: `${course.code}: ${course.name} (Credits: ${course.credits})`,
        group: 'course',
        difficulty: 3, 
        workload: 3,
      });
    });

    // Add edges
    Object.entries(ACADEMIC_PREREQUISITES).forEach(([dependent, prereqs]) => {
      prereqs.forEach(prereq => {
        edges.push({
          from: prereq,
          to: dependent,
          label: 'PREREQUISITE_FOR',
        });
      });
    });

    return { nodes, edges };
  }

  async getRiskAnalysis() {
    const { ACADEMIC_PREREQUISITES } = require('../../ai/regression');
    const curriculumData = this.loadCurriculumData();
    const courseIndex = this.buildCourseIndex(curriculumData);
    const prereqCounts = {};
    
    Object.entries(ACADEMIC_PREREQUISITES).forEach(([dependent, prereqs]) => {
      prereqs.forEach(prereq => {
        prereqCounts[prereq] = (prereqCounts[prereq] || 0) + 1;
      });
    });

    const bottlenecks = Object.entries(prereqCounts)
      .filter(([courseCode, count]) => count > 1)
      .map(([courseCode, count]) => {
        const courseInfo = courseIndex.get(courseCode);
        return {
          courseCode,
          courseName: courseInfo ? courseInfo.name : courseCode,
          dependentCount: count,
        };
      })
      .sort((a, b) => b.dependentCount - a.dependentCount);

    return { bottlenecks };
  }

  async getStudentRiskChain(mssv) {
    const normalizedMssv = String(mssv || '').trim().toUpperCase();
    if (!normalizedMssv) {
      throw new Error('Student ID is required.');
    }

    const trainingData = this.getTrainingData();
    const trainingStudent = (trainingData.students || []).find((student) => student.id === normalizedMssv) || null;
    const databaseStudent = await this.getDatabaseStudent(normalizedMssv);

    if (!trainingStudent && !databaseStudent) {
      throw new Error('Student not found in academic data.');
    }

    const curriculumData = this.loadCurriculumData();
    const courseIndex = this.buildCourseIndex(curriculumData);
    const dependencies = await this.getDependencyRows();

    if (dependencies.length === 0) {
      return {
        student: this.buildStudentOverview({
          mssv: normalizedMssv,
          trainingStudent,
          databaseStudent,
          courseIndex,
          riskChains: [],
        }),
        riskChains: [],
      };
    }

    const scoreLookup = this.buildScoreLookup({
      trainingStudent,
      databaseStudent,
      courseIndex,
      dependencies,
    });

    const riskChains = this.buildRiskChains({
      dependencies,
      courseIndex,
      scoreLookup,
    });

    const student = this.buildStudentOverview({
      mssv: normalizedMssv,
      trainingStudent,
      databaseStudent,
      courseIndex,
      riskChains,
    });

    const fullGraph = this.buildFullGraph({
      curriculumData,
      courseIndex,
      scoreLookup,
      dependencies,
    });

    return { student, riskChains, fullGraph };
  }

  async getDatabaseStudent(mssv) {
    return prisma.student.findUnique({
      where: { mssv },
      include: {
        scores: true,
        predictions: {
          orderBy: { createdAt: 'desc' },
        },
        interventions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getDependencyRows() {
    const { ACADEMIC_PREREQUISITES } = require('../../ai/regression');
    const fallbackRows = [];
    Object.entries(ACADEMIC_PREREQUISITES).forEach(([dependent, prereqs]) => {
      prereqs.forEach(prereq => {
        fallbackRows.push({
          prereqCode: prereq,
          prereqName: prereq,
          dependentCode: dependent,
          dependentName: dependent
        });
      });
    });
    return fallbackRows;
  }

  getTrainingData() {
    if (cache.trainingData?.students?.length) {
      return cache.trainingData;
    }

    const trainingDataPath = path.join(__dirname, '..', '..', 'datasets', 'training_data.json');
    if (!fs.existsSync(trainingDataPath)) {
      return DEFAULT_TRAINING_DATA;
    }

    try {
      return JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));
    } catch (error) {
      console.error('[Graph Service] Failed to read training data:', error.message);
      return DEFAULT_TRAINING_DATA;
    }
  }

  loadCurriculumData() {
    const candidates = [
      path.join(__dirname, '..', '..', '..', '..', 'data', 'curriculum.json'),
      path.join(__dirname, '..', '..', 'datasets', 'curriculum.json'),
    ];

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) {
        continue;
      }

      try {
        return JSON.parse(fs.readFileSync(candidate, 'utf8'));
      } catch (error) {
        console.error('[Graph Service] Failed to read curriculum data:', error.message);
      }
    }

    return null;
  }

  buildCourseIndex(curriculumData) {
    const byCode = new Map();
    const byName = new Map();

    (curriculumData?.semesters || []).forEach((semesterEntry) => {
      (semesterEntry.courses || []).forEach((course) => {
        const meta = {
          canonicalCode: course.code,
          code: course.code,
          name: course.name,
          semester: semesterEntry.semester,
          credits: course.credits,
        };

        this.getCodeAliases(course.code).forEach((alias) => byCode.set(alias, meta));
        byName.set(this.normalizeName(course.name), meta);
      });
    });

    return { byCode, byName };
  }

  buildScoreLookup({ trainingStudent, databaseStudent, courseIndex, dependencies }) {
    const byCode = new Map();
    const byName = new Map();

    const setScore = (codeKey, nameKey, value) => {
      if (nameKey) {
        byName.set(nameKey, value);
      }

      if (codeKey) {
        this.getCodeAliases(codeKey).forEach((alias) => byCode.set(alias, value));
      }
    };

    Object.entries(trainingStudent?.scores || {}).forEach(([courseCode, rawValue]) => {
      const value = this.toNullableNumber(rawValue);
      const meta = this.resolveCourseMeta({ code: courseCode, name: null }, courseIndex);
      setScore(meta?.canonicalCode || courseCode, meta?.name ? this.normalizeName(meta.name) : null, value);
    });

    (databaseStudent?.scores || []).forEach((score) => {
      const value = this.toNullableNumber(score.value);
      const meta = this.resolveCourseMeta({ code: score.courseId, name: score.courseId }, courseIndex)
        || this.resolveCourseMeta({ code: null, name: score.courseId }, courseIndex);
      setScore(meta?.canonicalCode || score.courseId, this.normalizeName(score.courseId), value);
    });

    dependencies.forEach((dependency) => {
      const prereqMeta = this.resolveCourseMeta(
        { code: dependency.prereqCode, name: dependency.prereqName },
        courseIndex
      );
      const dependentMeta = this.resolveCourseMeta(
        { code: dependency.dependentCode, name: dependency.dependentName },
        courseIndex
      );

      if (prereqMeta?.name && !byName.has(this.normalizeName(prereqMeta.name))) {
        const existing = byCode.get(prereqMeta.canonicalCode);
        if (existing !== undefined) {
          byName.set(this.normalizeName(prereqMeta.name), existing);
        }
      }

      if (dependentMeta?.name && !byName.has(this.normalizeName(dependentMeta.name))) {
        const existing = byCode.get(dependentMeta.canonicalCode);
        if (existing !== undefined) {
          byName.set(this.normalizeName(dependentMeta.name), existing);
        }
      }
    });

    return { byCode, byName };
  }

  buildRiskChains({ dependencies, courseIndex, scoreLookup }) {
    const riskyNodes = new Map();
    const riskyAdjacency = new Map();
    const incomingRiskyEdges = new Map();
    const edgeLookup = new Map();

    dependencies.forEach((dependency) => {
      const prereqNode = this.buildNodeSnapshot(
        { code: dependency.prereqCode, name: dependency.prereqName },
        courseIndex,
        scoreLookup
      );
      const dependentNode = this.buildNodeSnapshot(
        { code: dependency.dependentCode, name: dependency.dependentName },
        courseIndex,
        scoreLookup
      );

      const edgeType = this.getEdgeType(prereqNode.status);
      if (!edgeType) {
        return;
      }

      riskyNodes.set(prereqNode.id, prereqNode);
      riskyNodes.set(dependentNode.id, dependentNode);

      if (!riskyAdjacency.has(prereqNode.id)) {
        riskyAdjacency.set(prereqNode.id, []);
      }

      const edge = {
        from: prereqNode.id,
        to: dependentNode.id,
        type: edgeType,
      };

      riskyAdjacency.get(prereqNode.id).push(edge);
      edgeLookup.set(`${edge.from}->${edge.to}`, edge);

      incomingRiskyEdges.set(
        dependentNode.id,
        (incomingRiskyEdges.get(dependentNode.id) || 0) + 1
      );
    });

    if (edgeLookup.size === 0) {
      return [];
    }

    const rootIds = Array.from(riskyAdjacency.keys())
      .filter((nodeId) => !incomingRiskyEdges.has(nodeId))
      .sort((left, right) => this.compareNodes(riskyNodes.get(left), riskyNodes.get(right)));

    const chainPaths = [];
    rootIds.forEach((rootId) => {
      this.collectRiskPaths({
        rootId,
        currentId: rootId,
        adjacency: riskyAdjacency,
        edgeLookup,
        pathNodeIds: [rootId],
        chainPaths,
      });
    });

    const uniquePaths = new Map();
    chainPaths.forEach((pathNodeIds) => {
      const key = pathNodeIds.join('>');
      if (!uniquePaths.has(key)) {
        uniquePaths.set(key, pathNodeIds);
      }
    });

    const chains = Array.from(uniquePaths.values()).map((pathNodeIds, index) => {
      const nodes = pathNodeIds
        .slice(0, 10)
        .map((nodeId) => riskyNodes.get(nodeId))
        .filter(Boolean);
      const keptIds = new Set(nodes.map((node) => node.id));
      const edges = pathNodeIds
        .slice(0, Math.max(nodes.length - 1, 0))
        .map((_, position) => edgeLookup.get(`${pathNodeIds[position]}->${pathNodeIds[position + 1]}`))
        .filter((edge) => edge && keptIds.has(edge.from) && keptIds.has(edge.to));

      const rootNode = nodes[0];
      const leafNode = nodes[nodes.length - 1];
      const affectedCount = Math.max(pathNodeIds.length - 1, 0);
      const blockedPath = nodes.map((node) => node.id).join(' -> ');
      const riskLevel = nodes.some((node) => node.status === 'Failed' || node.status === 'Missing')
        ? 'HIGH'
        : 'MEDIUM';

      return {
        id: `CHAIN_${index + 1}`,
        title: this.buildChainTitle(nodes),
        riskLevel,
        summary: this.buildChainSummary(rootNode, leafNode, affectedCount),
        affectedCount,
        rootCause: rootNode?.id || null,
        blockedPath,
        nodes,
        edges,
        explanation: this.buildChainExplanation({ nodes, leafNode, rootNode, affectedCount }),
      };
    });

    const uniqueChains = _.uniqBy(chains, (chain) => chain.blockedPath);

    return uniqueChains.sort((left, right) => {
      const severityDelta = this.getRiskLevelWeight(left.riskLevel) - this.getRiskLevelWeight(right.riskLevel);
      if (severityDelta !== 0) {
        return severityDelta;
      }

      return right.affectedCount - left.affectedCount;
    });
  }

  buildFullGraph({ curriculumData, courseIndex, scoreLookup, dependencies }) {
    const nodesMap = new Map();
    const edges = [];

    (curriculumData?.semesters || []).forEach((semesterEntry) => {
      (semesterEntry.courses || []).forEach((course) => {
        const node = this.buildNodeSnapshot(course, courseIndex, scoreLookup);
        nodesMap.set(node.id, node);
      });
    });

    dependencies.forEach((dependency) => {
      const prereqNode = this.buildNodeSnapshot(
        { code: dependency.prereqCode, name: dependency.prereqName },
        courseIndex,
        scoreLookup
      );
      const dependentNode = this.buildNodeSnapshot(
        { code: dependency.dependentCode, name: dependency.dependentName },
        courseIndex,
        scoreLookup
      );

      if (!nodesMap.has(prereqNode.id)) nodesMap.set(prereqNode.id, prereqNode);
      if (!nodesMap.has(dependentNode.id)) nodesMap.set(dependentNode.id, dependentNode);

      let edgeType = this.getEdgeType(prereqNode.status);
      if (!edgeType) {
        edgeType = 'normal';
      }

      edges.push({
        from: prereqNode.id,
        to: dependentNode.id,
        type: edgeType,
      });
    });

    return {
      id: 'FULL_GRAPH',
      title: 'Toàn bộ Lộ trình học (34 môn)',
      riskLevel: 'INFO',
      summary: 'Tổng quan toàn bộ môn học trong chương trình đào tạo.',
      affectedCount: Array.from(nodesMap.values()).length,
      blockedPath: 'Toàn bộ chương trình',
      nodes: Array.from(nodesMap.values()),
      edges,
      explanation: {
        why: 'Đây là sơ đồ tổng quan toàn bộ lộ trình học 34 môn của sinh viên.',
        impact: 'Cho phép nhìn thấy toàn cảnh các môn đã học, đang học và chưa học.',
        recovery: 'Sinh viên nên duy trì tiến độ học tập theo đúng lộ trình này.',
        interventions: ['Theo dõi tiến độ tổng thể'],
      }
    };
  }

  collectRiskPaths({ rootId, currentId, adjacency, edgeLookup, pathNodeIds, chainPaths }) {
    const outgoing = adjacency.get(currentId) || [];
    if (outgoing.length === 0) {
      chainPaths.push(pathNodeIds);
      return;
    }

    outgoing.forEach((edge) => {
      if (pathNodeIds.includes(edge.to)) {
        return;
      }

      this.collectRiskPaths({
        rootId,
        currentId: edge.to,
        adjacency,
        edgeLookup,
        pathNodeIds: [...pathNodeIds, edge.to],
        chainPaths,
      });
    });
  }

  buildStudentOverview({ mssv, trainingStudent, databaseStudent, courseIndex, riskChains }) {
    const name = databaseStudent?.name || trainingStudent?.name || `Student ${mssv}`;
    const classCode = databaseStudent?.classCode || trainingStudent?.classCode || null;
    const scores = databaseStudent?.scores?.length
      ? databaseStudent.scores
      : this.convertTrainingScoresToArray(trainingStudent?.scores || {}, courseIndex);
    const gpa = scores.length ? calculateFptGPA(scores).gpa : null;
    const attendanceValues = (databaseStudent?.scores || [])
      .map((score) => this.toNullableNumber(score.attendance))
      .filter((value) => value !== null);
    const attendance = attendanceValues.length
      ? Math.round((attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length) * 10) / 10
      : null;
    const totalFailedSubjects = scores.filter((score) => this.toNullableNumber(score.value) !== null && Number(score.value) < 5).length;
    const currentSemester = this.deriveCurrentSemester(scores, courseIndex);
    const latestPrediction = (databaseStudent?.predictions || [])[0] || null;
    const riskScore = latestPrediction && latestPrediction.predictedScore !== null
      ? Math.round(Number(latestPrediction.predictedScore) * 10) / 10
      : null;
    const riskLevel = riskChains[0]?.riskLevel || latestPrediction?.risk || 'LOW';

    return {
      mssv,
      name,
      classCode,
      gpa,
      attendance,
      totalFailedSubjects,
      currentSemester,
      riskScore,
      riskLevel,
      riskChainCount: riskChains.length,
      interventionCount: databaseStudent?.interventions?.length || 0,
    };
  }

  convertTrainingScoresToArray(scoreMap, courseIndex) {
    return Object.entries(scoreMap || {})
      .filter(([, value]) => this.toNullableNumber(value) !== null)
      .map(([courseId, value]) => {
        const meta = this.resolveCourseMeta({ code: courseId, name: courseId }, courseIndex);
        return {
          courseId: meta?.canonicalCode || courseId,
          value: Number(value),
          course: meta ? { name: meta.name } : null,
        };
      });
  }

  deriveCurrentSemester(scores, courseIndex) {
    const semesters = scores
      .map((score) => this.resolveCourseMeta({ code: score.courseId, name: score.course?.name || score.courseId }, courseIndex))
      .filter(Boolean)
      .map((meta) => meta.semester)
      .filter((semester) => Number.isFinite(semester));

    return semesters.length ? Math.max(...semesters) : null;
  }

  buildNodeSnapshot(course, courseIndex, scoreLookup) {
    const meta = this.resolveCourseMeta(course, courseIndex);
    const id = meta?.canonicalCode || course.code || course.name;
    const name = meta?.name || course.name || course.code;
    const score = this.resolveScore({ code: id, name }, scoreLookup);
    const semester = meta?.semester || null;

    return {
      id,
      code: id,
      name,
      score,
      semester,
      status: this.getNodeStatus(score),
    };
  }

  buildChainTitle(nodes) {
    if (nodes.length >= 2) {
      const root = nodes[0];
      const leaf = nodes[nodes.length - 1];
      return `Chuỗi Rủi ro: ${root.code} ➔ ${leaf.code}`;
    }

    return `Rủi ro môn: ${nodes[0]?.name || 'N/A'}`;
  }

  buildChainSummary(rootNode, leafNode, affectedCount) {
    if (!rootNode || !leafNode) {
      return 'No academic dependency data available.';
    }

    if (leafNode.id === rootNode.id) {
      return `${rootNode.id} has unresolved prerequisite risk.`;
    }

    return `${rootNode.id} blocks progression toward ${leafNode.id} across ${affectedCount} dependent course(s).`;
  }

  buildChainExplanation({ nodes, leafNode, rootNode, affectedCount }) {
    if (!rootNode || !leafNode) {
      return DEFAULT_CHAIN_EXPLANATION;
    }

    const statusLabel = rootNode.status === 'Warning'
      ? 'điểm số môn tiên quyết ở mức nguy cơ'
      : rootNode.status === 'Failed'
        ? 'trượt môn tiên quyết'
        : 'chưa hoàn thành môn tiên quyết';

    return {
      why: `Môn ${rootNode.id} bị cảnh báo do sinh viên ${statusLabel} ở môn ${rootNode.name}.`,
      impact: `${affectedCount} môn học phía sau bị ảnh hưởng trực tiếp trên chuỗi này, dẫn đến nguy cơ kẹt môn ${leafNode.name}.`,
      recovery: `Cần ưu tiên hoàn thành/cải thiện môn ${rootNode.id} trước, sau đó tiếp tục lộ trình qua ${nodes.slice(1).map((node) => node.id).join(' -> ')}.`,
      interventions: [
        `Phân công Mentoring tập trung cho môn ${rootNode.id}.`,
        `Đánh giá lại khả năng tiếp thu trước khi học ${nodes[1]?.id || leafNode.id}.`,
        `Theo dõi sát sao chuỗi môn này ở kỳ tiếp theo.`,
      ],
    };
  }

  resolveCourseMeta(course, courseIndex) {
    if (!course) {
      return null;
    }

    const codeCandidates = this.getCodeAliases(course.code);
    for (const candidate of codeCandidates) {
      if (courseIndex.byCode.has(candidate)) {
        return courseIndex.byCode.get(candidate);
      }
    }

    const normalizedName = this.normalizeName(course.name);
    if (normalizedName && courseIndex.byName.has(normalizedName)) {
      return courseIndex.byName.get(normalizedName);
    }

    return null;
  }

  resolveScore(course, scoreLookup) {
    const codeCandidates = this.getCodeAliases(course.code);
    for (const candidate of codeCandidates) {
      if (scoreLookup.byCode.has(candidate)) {
        return scoreLookup.byCode.get(candidate);
      }
    }

    const normalizedName = this.normalizeName(course.name);
    if (normalizedName && scoreLookup.byName.has(normalizedName)) {
      return scoreLookup.byName.get(normalizedName);
    }

    return null;
  }

  getNodeStatus(score) {
    if (score === null) {
      return 'Not Started';
    }
    if (score < 5) {
      return 'Failed';
    }
    if (score < 6.5) {
      return 'Warning';
    }
    return 'Passed';
  }

  getEdgeType(status) {
    if (status === 'Failed' || status === 'Not Started') {
      return 'critical';
    }
    if (status === 'Warning') {
      return 'warning';
    }
    return null;
  }

  getRiskLevelWeight(level) {
    if (level === 'HIGH') {
      return 0;
    }
    if (level === 'MEDIUM') {
      return 1;
    }
    return 2;
  }

  compareNodes(left, right) {
    return (left?.semester || 99) - (right?.semester || 99);
  }

  getCodeAliases(code) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) {
      return [];
    }

    const aliases = new Set([normalized]);
    const trimmed = normalized.replace(/\s+/g, '');
    aliases.add(trimmed);

    const compactMatch = trimmed.match(/^([A-Z]+\d{3})\d$/);
    if (compactMatch) {
      aliases.add(compactMatch[1]);
    }

    return Array.from(aliases);
  }

  normalizeName(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .toLowerCase();
  }

  toNullableNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}

module.exports = new GraphService();
