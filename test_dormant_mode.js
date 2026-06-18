const path = require('path');
const xlsx = require('xlsx');

// Initialize Prisma Client
const { prisma } = require('./server/src/infrastructure/database/prisma');
const importController = require('./server/src/modules/data/import.controller');

// Helper to create mock req and res
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(obj) {
      this.data = obj;
      return this;
    }
  };
  return res;
}

async function runDormantModeDiagnostic() {
  console.log('=== STARTING DORMANT MODE ISOLATION DIAGNOSTIC ===\n');

  let passed = true;

  // Force flag to false
  process.env.ENABLE_COMPONENT_SCORE = 'false';

  // 1. Clean up previous test entries
  await prisma.importSession.deleteMany({ where: { fileName: { startsWith: 'DORMANT_TEST_' } } });
  await prisma.score.deleteMany({ where: { mssv: 'PSDORMANT999' } });
  await prisma.student.deleteMany({ where: { mssv: 'PSDORMANT999' } });

  // 2. Prepare mock Excel worksheet containing legacy fields and extra component columns
  // We include Lab 1-8 and ASM 1-2 columns to verify they are completely ignored!
  const wb = xlsx.utils.book_new();
  const wsData = [
    ['MSSV', 'Họ Tên', 'Môn học', 'Lab 1', 'Lab 2', 'Lab 3', 'Lab 4', 'Lab 5', 'Lab 6', 'Lab 7', 'Lab 8', 'ASM 1', 'ASM 2', 'Thang điểm 10', 'Học kỳ', 'Trạng thái'],
    ['PSDORMANT999', 'Nguyen Dormant Test', 'WEB1013', '10.0', '10.0', '10.0', '10.0', '10.0', '10.0', '10.0', '10.0', '8.0', '9.0', '7.5', 'Summer 2025', 'Passed']
  ];
  const ws = xlsx.utils.aoa_to_sheet(wsData);
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const mockFile = {
    buffer: buffer,
    originalname: 'DORMANT_TEST_sheet.xlsx',
    size: buffer.length
  };

  // 3. Test Preview
  console.log('Step 1: Running previewData in dormant mode...');
  const reqPreview = { file: mockFile, body: {} };
  const resPreview = createMockResponse();
  await importController.previewData(reqPreview, resPreview);

  if (resPreview.statusCode !== 200 || !resPreview.data.success) {
    console.error('❌ Preview failed:', resPreview.data);
    passed = false;
  } else {
    const row = resPreview.data.data[0];
    
    // Assert component properties are missing
    const hasComponents = row.components !== undefined;
    const hasRawScore = row.rawScore !== undefined;
    const hasComputedScore = row.computedScore !== undefined;
    const hasWarnings = row.warnings !== undefined;

    if (!hasComponents && !hasRawScore && !hasComputedScore && !hasWarnings && row.score === 7.5) {
      console.log('✅ Success: Component data, raw/computed score properties, and warnings are NOT populated in preview.');
    } else {
      console.error('❌ Failure: Component data or warnings leaked into preview response under dormant mode.', {
        components: row.components,
        rawScore: row.rawScore,
        computedScore: row.computedScore,
        warnings: row.warnings,
        score: row.score
      });
      passed = false;
    }
  }

  const hash = resPreview.data.fileHash;

  // 4. Test Publish
  console.log('\nStep 2: Running publishData in dormant mode...');
  const reqPublish = {
    body: {
      data: resPreview.data.data,
      classCode: 'DORMANT_CLASS',
      fileHash: hash,
      fileName: 'DORMANT_TEST_sheet.xlsx',
      fileSize: buffer.length
    },
    user: { email: 'advisor@eduguard.ai' }
  };
  const resPublish = createMockResponse();
  await importController.publishData(reqPublish, resPublish);

  if (resPublish.statusCode !== 200 || !resPublish.data.success) {
    console.error('❌ Publish failed:', resPublish.data);
    passed = false;
  } else {
    // 5. Verify database records
    console.log('\nStep 3: Verifying database entries...');
    const dbScore = await prisma.score.findFirst({
      where: { mssv: 'PSDORMANT999' },
      include: { components: true }
    });

    if (!dbScore) {
      console.error('❌ Failure: Score record not found in database.');
      passed = false;
    } else {
      const isValueCorrect = dbScore.value === 7.5;
      const isRawScoreNull = dbScore.rawScore === null;
      const isComputedScoreNull = dbScore.computedScore === null;
      const hasNoComponents = dbScore.components.length === 0;

      if (isValueCorrect && isRawScoreNull && isComputedScoreNull && hasNoComponents) {
        console.log('✅ Success: Score value matches legacy total score (7.5).');
        console.log('✅ Success: rawScore and computedScore are null.');
        console.log('✅ Success: No component records created in ScoreComponent table.');
      } else {
        console.error('❌ Failure: Leaked or incorrect data committed to DB in dormant mode:', {
          value: dbScore.value,
          rawScore: dbScore.rawScore,
          computedScore: dbScore.computedScore,
          componentsCount: dbScore.components.length
        });
        passed = false;
      }
    }
  }

  // 6. Cleanup
  console.log('\nCleaning up verification database entries...');
  await prisma.importSession.deleteMany({ where: { fileName: { startsWith: 'DORMANT_TEST_' } } });
  await prisma.score.deleteMany({ where: { mssv: 'PSDORMANT999' } });
  await prisma.student.deleteMany({ where: { mssv: 'PSDORMANT999' } });

  if (passed) {
    console.log('\n🎉 ALL DORMANT MODE DIAGNOSTIC TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ DIAGNOSTIC TEST FAILED.');
    process.exit(1);
  }
}

runDormantModeDiagnostic()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
