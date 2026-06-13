const { prisma } = require('./server/src/infrastructure/database/prisma');
const { generateDetailedDSSReport } = require('./server/src/ai/engines/dssReportEngine');

async function main() {
  console.log('Fetching all students from DB...');
  const students = await prisma.student.findMany({
    include: {
      scores: true,
      predictions: true
    }
  });
  console.log(`Found ${students.length} students.`);

  let errorCount = 0;
  let mismatchCount = 0;
  let lowHealthHighRisk = 0;

  for (const student of students) {
    try {
      const report = await generateDetailedDSSReport(student);
      if (!report) {
        console.error(`[ERROR] Report for ${student.mssv} is null`);
        errorCount++;
        continue;
      }

      const healthScore = report.academicHealth.score;
      const riskLevel = report.graduationRisk.level;

      // Check alignment
      // 80-100: Low Risk
      // 60-79: Medium Risk
      // 40-59: High Risk
      // <40: Critical Risk
      let expectedRisk = '';
      if (healthScore >= 80) expectedRisk = 'LOW';
      else if (healthScore >= 60) expectedRisk = 'MEDIUM';
      else if (healthScore >= 40) expectedRisk = 'HIGH';
      else expectedRisk = 'CRITICAL';

      if (riskLevel !== expectedRisk) {
        console.warn(`[MISMATCH] Student ${student.mssv}: Health Score = ${healthScore}, Graduation Risk = ${riskLevel} (Expected: ${expectedRisk})`);
        mismatchCount++;
      }
    } catch (e) {
      console.error(`[EXCEPTION] Student ${student.mssv}:`, e);
      errorCount++;
    }
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`Total students verified: ${students.length}`);
  console.log(`Total errors (exceptions): ${errorCount}`);
  console.log(`Total alignment mismatches: ${mismatchCount}`);

  if (errorCount === 0 && mismatchCount === 0) {
    console.log('✅ ALL STUFF SUCCESSFUL AND PROPERLY ALIGNED!');
  } else {
    console.error('❌ Mismatches or errors detected!');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
