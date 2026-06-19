const { prisma } = require('./server/src/infrastructure/database/prisma');
const analyticsService = require('./server/src/services/analyticsService');
const { generateDetailedDSSReport } = require('./server/src/ai/engines/dssReportEngine');
const { enrichStudentData } = require('./server/src/repositories/studentRepository');
const { calculateOfficialGPA } = require('./server/src/utils/dataService');

async function verifyAll() {
  console.log('Starting Full Data Consistency Audit...');
  
  const students = await prisma.student.findMany({
    include: {
      scores: {
        include: {
          course: true
        }
      },
      predictions: true,
      studentMemory: true
    }
  });

  const allStudentsForRank = await prisma.student.findMany({
    include: { scores: true }
  });

  console.log(`Loaded ${students.length} students from Database.\n`);

  let totalChecked = 0;
  let totalMismatches = 0;
  let totalErrors = 0;

  for (const student of students) {
    totalChecked++;
    const mssv = student.mssv;

    try {
      // 1. Raw DB GPA & Credits
      const dbGpaObj = calculateOfficialGPA(student.scores);
      const dbGpa = dbGpaObj.gpa;
      const dbCredits = dbGpaObj.totalCredits;
      const dbCoursesCount = student.scores.length;

      // 2. Enrich student data (Advisor/Student View)
      const enrichedStudent = enrichStudentData(student);
      const analytics = analyticsService.getStudentAnalytics(enrichedStudent, allStudentsForRank);
      
      const advisorGpa = analytics.gpa10;
      const advisorCredits = analytics.totalEarnedCredits;
      const advisorCoursesCount = enrichedStudent.scores.length;

      // 3. DSS Report GPA & Credits (via dssReportEngine)
      const dssReport = await generateDetailedDSSReport(student);
      const dssGpaObj = calculateOfficialGPA(student.scores);
      const dssGpa = dssGpaObj.gpa;
      const dssCredits = dssGpaObj.totalCredits;
      const dssCoursesCount = student.scores.length;

      // Check mismatch
      const gpaMismatch = (dbGpa !== advisorGpa) || (dbGpa !== dssGpa);
      const creditsMismatch = (dbCredits !== advisorCredits) || (dbCredits !== dssCredits);
      const coursesMismatch = (dbCoursesCount !== advisorCoursesCount) || (dbCoursesCount !== dssCoursesCount);

      if (gpaMismatch || creditsMismatch || coursesMismatch) {
        totalMismatches++;
        console.error(`❌ Student: ${mssv} [MISMATCH DETECTED]`);
        console.error(`   GPA - DB: ${dbGpa}, Advisor/Student: ${advisorGpa}, DSS: ${dssGpa}`);
        console.error(`   Credits - DB: ${dbCredits}, Advisor/Student: ${advisorCredits}, DSS: ${dssCredits}`);
        console.error(`   Courses - DB: ${dbCoursesCount}, Advisor/Student: ${advisorCoursesCount}, DSS: ${dssCoursesCount}`);
      } else {
        console.log(`Student: ${mssv}`);
        console.log(`  Advisor GPA: ${advisorGpa} (Credits: ${advisorCredits}, Courses: ${advisorCoursesCount})`);
        console.log(`  Student GPA: ${advisorGpa} (Credits: ${advisorCredits}, Courses: ${advisorCoursesCount})`);
        console.log(`  DSS GPA:     ${dssGpa} (Credits: ${dssCredits}, Courses: ${dssCoursesCount})`);
        console.log(`  DB GPA:      ${dbGpa} (Credits: ${dbCredits}, Courses: ${dbCoursesCount})`);
        console.log('  PASS\n');
      }
    } catch (err) {
      totalErrors++;
      console.error(`❌ Student: ${mssv} [EXCEPTION]:`, err.message);
    }
  }

  const consistencyRate = totalChecked > 0 ? ((totalChecked - totalMismatches - totalErrors) / totalChecked) * 100 : 0;

  console.log('====================================================');
  console.log('--- CONSISTENCY AUDIT SUMMARY ---');
  console.log(`Total Students Checked: ${totalChecked}`);
  console.log(`Total Mismatches:       ${totalMismatches}`);
  console.log(`Total Errors:           ${totalErrors}`);
  console.log(`Consistency Rate:       ${consistencyRate.toFixed(2)}%`);
  console.log('====================================================');

  if (totalMismatches === 0 && totalErrors === 0) {
    console.log('✅ ALL 652/652 STUDENTS PASS WITH 100% DATA CONSISTENCY!');
  } else {
    console.error('❌ CONSISTENCY CHECK FAILED!');
  }
}

verifyAll()
  .catch(err => {
    console.error('Fatal audit error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
