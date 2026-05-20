const { PrismaClient } = require('../generated/prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const totalStudents = await prisma.student.count();
    console.log('Total students:', totalStudents);

    const scoreCount = await prisma.score.count();
    console.log('Total scores:', scoreCount);
    
    const coursesList = await prisma.course.findMany();
    const courseNameMap = {};
    coursesList.forEach(c => {
      courseNameMap[c.id] = c.name;
    });

    const scoreStats = await prisma.score.groupBy({
      by: ['courseId', 'status'],
      _count: { id: true }
    });

    const courseMap = {};
    scoreStats.forEach(item => {
      const cId = item.courseId;
      if (!courseMap[cId]) {
        courseMap[cId] = { total: 0, passed: 0, failed: 0, studying: 0 };
      }
      const count = item._count.id;
      courseMap[cId].total += count;
      if (item.status === 'FAILED') {
        courseMap[cId].failed += count;
      } else if (item.status === 'PASSED') {
        courseMap[cId].passed += count;
      } else if (item.status === 'STUDYING') {
        courseMap[cId].studying += count;
      }
    });

    const scoreAvgs = await prisma.score.groupBy({
      by: ['courseId'],
      _avg: { value: true }
    });
    scoreAvgs.forEach(item => {
      const cId = item.courseId;
      if (courseMap[cId] && item._avg.value !== null) {
        courseMap[cId].avgValue = item._avg.value;
      }
    });

    const worstCoursesList = Object.entries(courseMap)
      .map(([id, info]) => {
        const completed = info.passed + info.failed;
        const failRate = completed > 0 ? (info.failed / completed) * 100 : 0;
        return {
          id,
          name: courseNameMap[id] || id,
          total: info.total,
          passed: info.passed,
          failed: info.failed,
          failRate,
          avg: info.avgValue || 0
        };
      })
      .filter(c => c.total >= 5)
      .sort((a, b) => b.failRate - a.failRate);

    console.log('Worst courses length:', worstCoursesList.length);
    console.log('Top 5 worst courses:', worstCoursesList.slice(0, 5));

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
