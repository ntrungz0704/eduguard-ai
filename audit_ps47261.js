const { PrismaClient } = require('./server/generated/prisma');
const prisma = new PrismaClient();

async function auditPS47261() {
  const mssv = 'PS47261';
  console.log(`\n=== AUDIT REPORT FOR ${mssv} ===\n`);

  try {
    // 1. Check Student Table
    const student = await prisma.student.findUnique({
      where: { mssv },
      include: {
        scores: {
          include: {
            course: true
          }
        },
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!student) {
      console.log(`❌ Student ${mssv} NOT FOUND in database.`);
      return;
    }

    console.log(`✅ Student found: ${student.name} (${student.classCode})`);
    
    // 2. Check Scores
    console.log(`\n--- SCORES ---`);
    console.log(`Total scores: ${student.scores.length}`);
    
    const missingSubjects = student.scores.filter(s => !s.courseId || !s.course);
    if (missingSubjects.length > 0) {
      console.log(`❌ Missing subjects in scores: ${missingSubjects.length}`);
    }

    const nullValues = student.scores.filter(s => s.value === null);
    if (nullValues.length > 0) {
      console.log(`⚠️ Null score values (STUDYING): ${nullValues.length}`);
    }

    // Check duplicates
    const courseCounts = {};
    const duplicateScores = [];
    for (const s of student.scores) {
      if (courseCounts[s.courseId]) {
        duplicateScores.push(s.courseId);
      } else {
        courseCounts[s.courseId] = 1;
      }
    }
    if (duplicateScores.length > 0) {
      console.log(`❌ Duplicate course scores found: ${duplicateScores.join(', ')}`);
    } else {
      console.log(`✅ No duplicate course scores.`);
    }

    // 3. academicSnapshot & Analytics Service
    const { buildAcademicSnapshot } = require('./server/src/services/studentSnapshotService');
    const snapshot = buildAcademicSnapshot(student);
    console.log(`\n--- ACADEMIC SNAPSHOT ---`);
    console.log(`GPA 10: ${snapshot.gpa10}`);
    console.log(`Failed Courses: ${snapshot.failedCoursesCount}`);
    console.log(`Total Credits: ${snapshot.totalCredits}`);
    console.log(`Total Scores Count: ${snapshot.totalScoresCount}`);
    console.log(`Root Cause Courses: ${snapshot.rootCauseCourses ? snapshot.rootCauseCourses.join(',') : 'None'}`);

    // 4. Prediction Engine
    console.log(`\n--- PREDICTION ENGINE ---`);
    if (student.predictions.length > 0) {
      const pred = student.predictions[0];
      console.log(`Latest Prediction (Risk Level): ${pred.risk}`);
      console.log(`Predicted Score: ${pred.predictedScore}`);
      console.log(`Explanation: ${pred.explanation}`);
    } else {
      console.log(`❌ No prediction found for this student.`);
    }

    // Print all scores for manual inspection
    console.log(`\n--- SCORE DUMP ---`);
    for (const s of student.scores) {
      console.log(`- ${s.courseId} (${s.course?.name}): Value=${s.value}, Status=${s.status}, Semester=${s.semester}`);
    }

  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

auditPS47261();
