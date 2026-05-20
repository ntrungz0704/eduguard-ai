const { PrismaClient } = require('../generated/prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

function getCourseCredits(courseNameOrId) {
  const name = String(courseNameOrId || '').trim();
  const lower = name.toLowerCase();
  const code = name.toUpperCase();

  if (lower.includes('thể chất') || lower.includes('vovinam') || code.includes('VIE103')) return 2;
  if (lower.includes('quốc phòng') || lower.includes('gdqp') || code.includes('VIE104')) return 4;
  if (lower.includes('thực tập tốt nghiệp') || code.includes('PRO115') || code.includes('PRO110') || code.includes('PRO116')) return 5;
  if (lower.includes('chính trị') || code.includes('VIE108')) return 5;
  if (lower.includes('dự án tốt nghiệp') || code.includes('PRO2201') || code.includes('PRO220')) return 5;

  if (
    lower.includes('tiếng anh 1.1') || code.includes('ENT112') || code.includes('ENT111') ||
    lower.includes('tiếng anh 1.2') || code.includes('ENT123') ||
    lower.includes('tiếng anh 2.1') || code.includes('ENT213') ||
    lower.includes('tiếng anh 2.2') || code.includes('ENT223') ||
    lower.includes('kỹ năng học tập') || code.includes('PDP102') ||
    lower.includes('kỹ năng phát triển bản thân') || code.includes('PDP103') ||
    lower.includes('kỹ năng làm việc') || code.includes('PDP104') ||
    lower.includes('pháp luật') || code.includes('VIE1028') || code.includes('VIE102')
  ) {
    return 2;
  }

  return 3;
}

const isConditionalCourse = (courseName, courseId) => {
  const name = (courseName || '').toLowerCase();
  const cid = (courseId || '').toUpperCase();
  return (
    name.includes('thể chất') ||
    name.includes('quốc phòng') ||
    name.includes('thực tập tốt nghiệp') ||
    name.includes('vovinam') ||
    name.includes('gdqp') ||
    cid.includes('VIE103') ||
    cid.includes('VIE104') ||
    cid.includes('PRO110') ||
    cid.includes('PRO115') ||
    cid.includes('PRO116')
  );
};

const get40Scale = (val) => {
  if (val === null || val === undefined) return 0.0;
  if (val >= 9.0) return 4.0;
  if (val >= 8.5) return 3.75;
  if (val >= 8.0) return 3.5;
  if (val >= 7.5) return 3.25;
  if (val >= 7.0) return 3.0;
  if (val >= 6.5) return 2.75;
  if (val >= 6.0) return 2.5;
  if (val >= 5.5) return 2.0;
  if (val >= 5.0) return 1.5;
  if (val >= 4.0) return 1.0;
  return 0.0;
};

async function main() {
  const scores = await prisma.score.findMany({
    where: { mssv: 'PS47261' },
    include: { course: true }
  });

  const academicScores = scores.filter(s => !isConditionalCourse(s.course?.name || s.courseId, s.courseId));

  let totalWeight10 = 0;
  let totalWeight4 = 0;
  let totalCredits = 0;

  console.log('--- Academic Scores Calculation ---');
  academicScores.forEach(s => {
    const cred = getCourseCredits(s.course?.name || s.courseId);
    const scoreVal = s.value;
    const score4Val = get40Scale(scoreVal);
    totalWeight10 += scoreVal * cred;
    totalWeight4 += score4Val * cred;
    totalCredits += cred;
    console.log(`${s.courseId}: Grade10=${scoreVal}, Credits=${cred}, Grade4=${score4Val}, Weight10=${scoreVal * cred}, Weight4=${score4Val * cred}`);
  });

  const gpa10 = totalCredits === 0 ? 0.0 : (totalWeight10 / totalCredits);
  const gpa4 = totalCredits === 0 ? 0.0 : (totalWeight4 / totalCredits);

  console.log(`\nGPA 10 (unrounded): ${gpa10}`);
  console.log(`GPA 10 (rounded to 1 decimal): ${gpa10.toFixed(1)}`);
  console.log(`GPA 10 (rounded to 2 decimals): ${gpa10.toFixed(2)}`);
  console.log(`GPA 4 (unrounded): ${gpa4}`);
  console.log(`GPA 4 (rounded to 2 decimals): ${gpa4.toFixed(2)}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
