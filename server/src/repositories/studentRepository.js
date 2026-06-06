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

async function fetchStudentByMssv(mssv) {
  if (!mssv) return null;
  const upperMssv = mssv.toUpperCase();

  try {
    const dbStudent = await prisma.student.findUnique({
      where: { mssv: upperMssv },
      include: { scores: true }
    });
    if (dbStudent) return dbStudent;
  } catch (e) {
    // Fallback if Prisma is not connected
  }

  const mockPath = path.join(__dirname, '..', '..', 'data', 'mock-lms', 'students', `${upperMssv}.json`);
  if (fs.existsSync(mockPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
      return {
        mssv: data.mssv || upperMssv,
        name: data.name || `Sinh viên ${upperMssv}`,
        courseStatus: data.courseStatus || (data.scores ? Object.fromEntries(Object.entries(data.scores).map(([k,v]) => [k, v >= 5 ? 'PASSED' : 'FAILED'])) : {}),
        skills: data.skills || {},
        projects: data.projects || [],
        behavior: data.behavior || {
          dataSource: "MOCK",
          confidence: 0.5,
          attendance: data.attendance || 0,
          quizAverage: data.quizAverage || 0,
          labCompletion: data.labCompletion || 0,
          lateAssignments: data.lateAssignments || 0
        }
      };
    } catch (e) {
      console.error('Error reading mock student', e);
    }
  }

  const legacy = getLegacyCache();
  const allStudents = [
    ...(legacy.trainingData?.students || []),
    ...(legacy.uploadedStudents || [])
  ];
  
  const found = allStudents.find(s => (s.id || '').toUpperCase() === upperMssv);
  if (!found) return null;

  return normalizeLegacyStudent(found);
}

async function fetchAllStudents() {
  let students = [];
  try {
    students = await prisma.student.findMany({ include: { scores: true } });
  } catch (e) {}

  if (students.length === 0) {
    const legacy = getLegacyCache();
    students = (legacy.trainingData?.students || []).map(normalizeLegacyStudent);
  }
  return students;
}

module.exports = {
  fetchStudentByMssv,
  fetchAllStudents
};
