const fs = require('fs');
const path = require('path');
const { prisma } = require('../infrastructure/database/prisma');

/**
 * Student Repository Layer
 * Tách biệt mọi thao tác Database khỏi AI Engine.
 */
let _legacyCache = null;
function getLegacyCache() {
  if (!_legacyCache) {
    try {
      _legacyCache = require('../../shared/cache');
    } catch (e) {
      _legacyCache = { trainingData: { students: [] }, uploadedStudents: [] };
    }
  }
  return _legacyCache;
}

function normalizeLegacyStudent(found) {
  return {
    mssv: found.id,
    name: found.name || `Sinh viên ${found.id}`,
    classCode: found.classCode || 'WD18301',
    scores: Object.entries(found.scores || {}).map(([courseId, value]) => ({
      courseId,
      value: value !== null ? parseFloat(value) : null,
      attendance: found.attendance?.[courseId] || null,
      status: value === null ? 'STUDYING' : (parseFloat(value) >= 5 ? 'PASSED' : 'FAILED')
    }))
  };
}

function normalizeCourseKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findCourseInfo(coursesDb, courseId) {
  const normalizedId = normalizeCourseKey(courseId);
  if (!normalizedId) return null;

  return coursesDb.find(c => {
    const code = normalizeCourseKey(c.courseCode);
    const name = normalizeCourseKey(c.courseName);
    return code === normalizedId || name === normalizedId;
  }) || null;
}

function enrichStudentData(student) {
  if (!student) return null;
  
  // 1. Build courseStatus
  const courseStatus = {};
  let totalAttendance = 0;
  let attendanceCount = 0;
  let coursesDb = [];

  try {
    const knowledgeCache = require('../modules/knowledge/cache');
    coursesDb = knowledgeCache.get('courses') || [];
  } catch (e) {
    coursesDb = [];
  }
  if (Array.isArray(student.scores)) {
    // Sort scores deterministically to ensure consistent skill generation order
    const sortedScores = [...student.scores].sort((a, b) => {
      const idA = a.courseId || '';
      const idB = b.courseId || '';
      return idA.localeCompare(idB);
    });
    
    sortedScores.forEach(s => {
      courseStatus[s.courseId] = s.status;
      const courseInfo = findCourseInfo(coursesDb, s.courseId);
      if (courseInfo) {
        courseStatus[courseInfo.courseCode] = s.status;
        courseStatus[courseInfo.courseName] = s.status;
      }
      if (s.attendance !== null && s.attendance !== undefined) {
        let att = parseFloat(s.attendance);
        if (att <= 1.0) att = att * 100;
        totalAttendance += att;
        attendanceCount++;
      }
    });
  } else if (student.courseStatus) {
    Object.assign(courseStatus, student.courseStatus);
  }
  
  // 2. Load mock JSON file if exists
  const mockPath = path.join(__dirname, '..', '..', 'data', 'mock-lms', 'students', `${student.mssv.toUpperCase()}.json`);
  let mockData = {};
  if (fs.existsSync(mockPath)) {
    try {
      mockData = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
    } catch (e) {
      console.error('Error reading mock student file:', e);
    }
  }
  
  // 3. Build skills dynamically based on actual scores
  let skills = student.skills || {};
  if (Object.keys(skills).length === 0) {
    // Generate skills from passed courses using the knowledge cache
    try {
      if (Array.isArray(student.scores)) {
        student.scores.forEach(s => {
          if (s.status === 'PASSED') {
            const courseInfo = findCourseInfo(coursesDb, s.courseId);
            if (courseInfo) {
              const val = s.value || 7.0;
              const skillScore = Math.round(val * 10);
              
              if (Array.isArray(courseInfo.skills)) {
                courseInfo.skills.forEach(skill => {
                  skills[skill] = Math.max(skills[skill] || 0, skillScore);
                });
              }
              if (Array.isArray(courseInfo.technologies)) {
                courseInfo.technologies.forEach(tech => {
                  skills[tech] = Math.max(skills[tech] || 0, skillScore);
                });
              }
            }
          }
        });
      }
    } catch (e) {
      console.error('Error populating dynamic skills:', e);
    }
  }
  
  // 4. Build projects dynamically if not in mock data
  const projects = mockData.projects || student.projects || [];
  if (projects.length === 0) {
    const skillKeys = Object.keys(skills).sort();
    if (skillKeys.length > 0) {
      const techForProject1 = skillKeys.slice(0, 3);
      const techForProject2 = skillKeys.slice(3, 5);
      
      if (techForProject1.length > 0) {
        projects.push({
          name: `${techForProject1.join(' & ')} Application`,
          technologies: techForProject1,
          portfolioEvidence: {
            githubUrl: `https://github.com/student-${student.mssv.toLowerCase()}/project-1`,
            demoUrl: `https://demo-${student.mssv.toLowerCase()}.dev`,
            verified: false
          }
        });
      }
      if (techForProject2.length > 0) {
        projects.push({
          name: `${techForProject2.join(' & ')} Project`,
          technologies: techForProject2,
          portfolioEvidence: {
            githubUrl: `https://github.com/student-${student.mssv.toLowerCase()}/project-2`,
            demoUrl: `https://project-2-${student.mssv.toLowerCase()}.dev`,
            verified: false
          }
        });
      }
    }
  }
  
  // 5. Build behavior dynamically if not in mock data
  const behavior = mockData.behavior || student.behavior || {
    dataSource: "SIMULATED",
    confidence: 0.8,
    attendance: attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount) : 85,
    quizAverage: 7.5,
    labCompletion: 90,
    lateAssignments: 0
  };
  
  return {
    mssv: student.mssv,
    name: student.name || mockData.name || `Sinh viên ${student.mssv}`,
    classCode: student.classCode || mockData.classCode || 'WD18301',
    courseStatus,
    skills,
    projects,
    behavior,
    scores: student.scores
  };
}

async function fetchStudentByMssv(mssv) {
  if (!mssv) return null;
  const upperMssv = mssv.toUpperCase();

  try {
    const dbStudent = await prisma.student.findUnique({
      where: { mssv: upperMssv },
      include: { 
        scores: {
          include: { course: true }
        }
      }
    });
    if (dbStudent) {
      return enrichStudentData(dbStudent);
    }
  } catch (e) {
    // Fallback if Prisma is not connected
  }

  const mockPath = path.join(__dirname, '..', '..', 'data', 'mock-lms', 'students', `${upperMssv}.json`);
  let enriched = null;
  if (fs.existsSync(mockPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
      enriched = enrichStudentData({
        mssv: data.mssv || upperMssv,
        name: data.name || `Sinh viên ${upperMssv}`,
        courseStatus: data.courseStatus || {},
        skills: data.skills || {},
        projects: data.projects || [],
        behavior: data.behavior,
        scores: Object.entries(data.courseStatus || {}).map(([courseId, status]) => {
          const value = status === 'PASSED' ? 8.0 : (status === 'FAILED' ? 4.0 : null);
          return {
            courseId,
            value,
            status,
            attendance: null
          };
        })
      });
    } catch (e) {
      console.error('Error reading mock student', e);
    }
  }

  if (!enriched) {
    const legacy = getLegacyCache();
    const allStudents = [
      ...(legacy.trainingData?.students || []),
      ...(legacy.uploadedStudents || [])
    ];
    
    const found = allStudents.find(s => (s.id || '').toUpperCase() === upperMssv);
    if (found) {
      enriched = enrichStudentData(normalizeLegacyStudent(found));
    }
  }

  // If found in fallback, let's automatically save it to SQLite!
  if (enriched) {
    try {
      const { mssv, name, classCode } = enriched;
      // 1. Upsert Student
      await prisma.student.upsert({
        where: { mssv },
        update: { name, classCode },
        create: { mssv, name, classCode }
      });
      // 2. Upsert Courses and Scores
      if (Array.isArray(enriched.scores)) {
        for (const s of enriched.scores) {
          const courseId = s.courseId;
          const value = s.value;
          const status = s.status || (value === null ? 'STUDYING' : (value >= 5 ? 'PASSED' : 'FAILED'));
          
          // Helper credits
          let credits = 3;
          const lowerId = courseId.toLowerCase();
          if (lowerId.includes('thể chất') || lowerId.includes('vovinam') || lowerId.includes('vie103')) credits = 2;
          else if (lowerId.includes('quốc phòng') || lowerId.includes('gdqp') || lowerId.includes('vie104')) credits = 4;
          else if (lowerId.includes('thực tập') || lowerId.includes('pro115') || lowerId.includes('pro110')) credits = 5;

          await prisma.course.upsert({
            where: { id: courseId },
            update: {},
            create: { id: courseId, name: courseId, credits, prerequisites: '' }
          });

          await prisma.score.upsert({
            where: {
              mssv_courseId_semester: {
                mssv,
                courseId,
                semester: 'Summer 2025'
              }
            },
            update: { value, status },
            create: {
              mssv,
              courseId,
              value,
              status,
              semester: 'Summer 2025'
            }
          });
        }
      }
    } catch (dbErr) {
      console.warn('[DB_SYNC] Failed to auto-persist mock student to SQLite:', dbErr.message);
    }
  }

  return enriched;
}

async function fetchAllStudents() {
  let students = [];
  try {
    const dbStudents = await prisma.student.findMany({ include: { scores: true } });
    if (dbStudents && dbStudents.length > 0) {
      return dbStudents.map(enrichStudentData);
    }
  } catch (e) {}

  if (students.length === 0) {
    const legacy = getLegacyCache();
    students = (legacy.trainingData?.students || []).map(normalizeLegacyStudent);
  }
  return students.map(enrichStudentData);
}

module.exports = {
  fetchStudentByMssv,
  fetchAllStudents
};
