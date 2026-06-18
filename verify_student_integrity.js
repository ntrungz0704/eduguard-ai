const fs = require('fs');
const { PrismaClient } = require('./server/generated/prisma');
const prisma = new PrismaClient();

async function verifyAllStudents() {
  console.log('Bắt đầu kiểm tra tính toàn vẹn dữ liệu sinh viên...');
  const students = await prisma.student.findMany({
    include: {
      scores: {
        include: { course: true }
      },
      predictions: true
    }
  });

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  let report = `# Student Data Integrity Report\n\n`;
  report += `Total Students Checked: ${students.length}\n\n`;

  const issues = [];

  for (const student of students) {
    const mssv = student.mssv;
    let studentIssues = [];

    // 1. Missing scores or NULL scores
    const missingSubjects = student.scores.filter(s => !s.courseId || !s.course);
    if (missingSubjects.length > 0) {
      studentIssues.push({ level: 'High', msg: `Missing course relation for ${missingSubjects.length} scores.` });
      highCount++;
    }

    const nullScores = student.scores.filter(s => s.value === null && s.status !== 'STUDYING');
    if (nullScores.length > 0) {
      studentIssues.push({ level: 'Medium', msg: `${nullScores.length} scores have NULL value but are not marked as STUDYING.` });
      mediumCount++;
    }

    // 2. Duplicate scores
    const courseCounts = {};
    for (const s of student.scores) {
      if (courseCounts[s.courseId]) {
        courseCounts[s.courseId]++;
      } else {
        courseCounts[s.courseId] = 1;
      }
    }
    const duplicates = Object.keys(courseCounts).filter(id => courseCounts[id] > 1);
    if (duplicates.length > 0) {
      studentIssues.push({ level: 'Critical', msg: `Duplicate scores found for courses: ${duplicates.join(', ')}.` });
      criticalCount++;
    }

    // 3. Invalid course codes
    const invalidCourses = student.scores.filter(s => !s.courseId || s.courseId.startsWith('WEB999'));
    if (invalidCourses.length > 0) {
      studentIssues.push({ level: 'High', msg: `Invalid course codes found (e.g., WEB999).` });
      highCount++;
    }

    // 4. Missing predictions
    if (student.predictions.length === 0) {
      studentIssues.push({ level: 'Low', msg: `No AI predictions generated for this student.` });
      lowCount++;
    }

    // 5. Test Snapshot generation
    try {
      const { buildAcademicSnapshot } = require('./server/src/services/studentSnapshotService');
      const snapshot = buildAcademicSnapshot(student);
      if (!snapshot) {
        studentIssues.push({ level: 'Critical', msg: `buildAcademicSnapshot returned null.` });
        criticalCount++;
      } else if (snapshot.gpa10 === undefined || snapshot.gpa10 === null || isNaN(snapshot.gpa10)) {
        studentIssues.push({ level: 'High', msg: `Snapshot generated invalid GPA: ${snapshot.gpa10}` });
        highCount++;
      } else if (snapshot.failedCoursesCount === undefined && snapshot.failedCourses === undefined) {
        studentIssues.push({ level: 'Medium', msg: `Snapshot missing failed courses mapping.` });
        mediumCount++;
      }
    } catch (e) {
      studentIssues.push({ level: 'Critical', msg: `Snapshot service crashed: ${e.message}` });
      criticalCount++;
    }

    if (studentIssues.length > 0) {
      issues.push({ mssv, name: student.name, issues: studentIssues });
    }
  }

  report += `## Summary\n`;
  report += `- **Critical**: ${criticalCount}\n`;
  report += `- **High**: ${highCount}\n`;
  report += `- **Medium**: ${mediumCount}\n`;
  report += `- **Low**: ${lowCount}\n\n`;

  report += `## Detailed Findings\n\n`;
  if (issues.length === 0) {
    report += `✅ All students passed integrity checks.\n`;
  } else {
    for (const issue of issues) {
      report += `### ${issue.mssv} - ${issue.name}\n`;
      for (const i of issue.issues) {
        report += `- [${i.level}] ${i.msg}\n`;
      }
      report += `\n`;
    }
  }

  fs.writeFileSync('student_integrity_report.md', report);
  console.log(`Kiểm tra hoàn tất. Báo cáo đã được lưu vào student_integrity_report.md`);
  console.log(`Critical: ${criticalCount}, High: ${highCount}, Medium: ${mediumCount}, Low: ${lowCount}`);
  
  await prisma.$disconnect();
}

verifyAllStudents().catch(e => {
  console.error(e);
  process.exit(1);
});
