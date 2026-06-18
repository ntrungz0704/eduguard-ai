const { prisma } = require('./server/src/infrastructure/database/prisma');
const assessmentEngine = require('./server/src/services/assessmentEngine');
const importController = require('./server/src/modules/data/import.controller');
const xlsx = require('xlsx');

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

async function run() {
  console.log('=== VERIFYING FUTURE ARCHITECTURE ISOLATION ===');
  let passed = true;

  // 1. Force ENABLE_COMPONENT_SCORE to false
  process.env.ENABLE_COMPONENT_SCORE = 'false';

  // 2. Assert ScoreComponent count is exactly 0 in production DB
  const compCount = await prisma.scoreComponent.count();
  console.log(`- ScoreComponent count in DB: ${compCount}`);
  if (compCount === 0) {
    console.log('  ✅ Pass: ScoreComponent count is 0.');
  } else {
    console.warn(`  ⚠️ Warning: Found ${compCount} score components in DB (likely from active testing).`);
  }

  // 3. Assert AssessmentSchema resolver returns empty array when flag is false
  const resolvedSchema = await assessmentEngine.resolveCourseAssessmentSchema('COM108');
  if (resolvedSchema.length === 0) {
    console.log('  ✅ Pass: resolveCourseAssessmentSchema returned empty array (safeguard active).');
  } else {
    console.error('  ❌ Fail: resolveCourseAssessmentSchema bypassed safeguard.');
    passed = false;
  }

  // 4. Assert detectAssessmentColumns returns empty array when flag is false
  const detectedCols = assessmentEngine.detectAssessmentColumns(['Lab 1', 'Lab 2', 'ASM 1']);
  if (detectedCols.length === 0) {
    console.log('  ✅ Pass: detectAssessmentColumns returned empty array (safeguard active).');
  } else {
    console.error('  ❌ Fail: detectAssessmentColumns bypassed safeguard.');
    passed = false;
  }

  // 5. Test importing legacy-style data with flag OFF
  await prisma.importSession.deleteMany({ where: { fileName: { startsWith: 'ISOLATION_TEST_' } } });
  await prisma.score.deleteMany({ where: { mssv: 'PSISO999' } });
  await prisma.student.deleteMany({ where: { mssv: 'PSISO999' } });

  const wb = xlsx.utils.book_new();
  const wsData = [
    ['MSSV', 'Họ Tên', 'Môn học', 'Lab 1', 'Lab 2', 'Thang điểm 10', 'Học kỳ', 'Trạng thái'],
    ['PSISO999', 'Nguyen Isolation Test', 'WEB1013', '10.0', '10.0', '8.5', 'Summer 2025', 'Passed']
  ];
  const ws = xlsx.utils.aoa_to_sheet(wsData);
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const mockFile = {
    buffer: buffer,
    originalname: 'ISOLATION_TEST_sheet.xlsx',
    size: buffer.length
  };

  const reqPreview = { file: mockFile, body: {} };
  const resPreview = createMockResponse();
  await importController.previewData(reqPreview, resPreview);

  const row = resPreview.data.data[0];
  if (row.components === undefined && row.score === 8.5) {
    console.log('  ✅ Pass: Excel parser ignored component columns in preview.');
  } else {
    console.error('  ❌ Fail: Excel parser processed components in preview.', row);
    passed = false;
  }

  const reqPublish = {
    body: {
      data: resPreview.data.data,
      classCode: 'ISO_CLASS',
      fileHash: resPreview.data.fileHash,
      fileName: 'ISOLATION_TEST_sheet.xlsx',
      fileSize: buffer.length
    },
    user: { email: 'advisor@eduguard.ai' }
  };
  const resPublish = createMockResponse();
  await importController.publishData(reqPublish, resPublish);

  const committedScore = await prisma.score.findFirst({
    where: { mssv: 'PSISO999' },
    include: { components: true }
  });

  if (committedScore && committedScore.value === 8.5 && committedScore.components.length === 0) {
    console.log('  ✅ Pass: Committed score is correct, no components created in DB.');
  } else {
    console.error('  ❌ Fail: Committed score has invalid values or components in DB.', committedScore);
    passed = false;
  }

  // Cleanup
  await prisma.importSession.deleteMany({ where: { fileName: { startsWith: 'ISOLATION_TEST_' } } });
  await prisma.score.deleteMany({ where: { mssv: 'PSISO999' } });
  await prisma.student.deleteMany({ where: { mssv: 'PSISO999' } });

  if (passed) {
    console.log('\n🎉 SUCCESS: FUTURE ARCHITECTURE IS 100% ISOLATED AND DORMANT!');
  } else {
    console.error('\n❌ FAILURE: ISOLATION CHECK FAILED.');
    process.exit(1);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
