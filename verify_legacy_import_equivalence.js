const { prisma } = require('./server/src/infrastructure/database/prisma');
const importController = require('./server/src/modules/data/import.controller');
const xlsx = require('xlsx');

function createMockResponse() {
  return {
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
}

async function run() {
  console.log('=== VERIFYING LEGACY IMPORT EQUIVALENCE ===');
  let passed = true;

  process.env.ENABLE_COMPONENT_SCORE = 'false';

  // Cleanup
  await prisma.importSession.deleteMany({ where: { fileName: { startsWith: 'EQUIV_TEST_' } } });
  await prisma.score.deleteMany({ where: { mssv: 'PSEQUIV999' } });
  await prisma.student.deleteMany({ where: { mssv: 'PSEQUIV999' } });

  // Prepare legacy Excel
  const wb = xlsx.utils.book_new();
  const wsData = [
    ['MSSV', 'Họ Tên', 'Môn học', 'Thang điểm 10', 'Học kỳ', 'Trạng thái'],
    ['PSEQUIV999', 'Nguyen Equivalence Test', 'WEB1013', '8.0', 'Summer 2025', 'Passed']
  ];
  const ws = xlsx.utils.aoa_to_sheet(wsData);
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const mockFile = {
    buffer: buffer,
    originalname: 'EQUIV_TEST_sheet.xlsx',
    size: buffer.length
  };

  // Run Preview
  const resPreview = createMockResponse();
  await importController.previewData({ file: mockFile, body: {} }, resPreview);

  const previewItem = resPreview.data.data[0];
  if (previewItem.score === 8.0 && previewItem.components === undefined) {
    console.log('  ✅ Pass: Preview score resolves correctly to legacy value (8.0), no components mapped.');
  } else {
    console.error('  ❌ Fail: Preview item differs from legacy format:', previewItem);
    passed = false;
  }

  // Run Publish
  const resPublish = createMockResponse();
  await importController.publishData({
    body: {
      data: resPreview.data.data,
      classCode: 'EQUIV_CLASS',
      fileHash: resPreview.data.fileHash,
      fileName: 'EQUIV_TEST_sheet.xlsx',
      fileSize: buffer.length
    },
    user: { email: 'advisor@eduguard.ai' }
  }, resPublish);

  // Assert DB record properties
  const dbScore = await prisma.score.findFirst({
    where: { mssv: 'PSEQUIV999' },
    include: { components: true }
  });

  if (!dbScore) {
    console.error('  ❌ Fail: Score record not found in database.');
    passed = false;
  } else {
    // Legacy fields check
    const mssvMatch = dbScore.mssv === 'PSEQUIV999';
    const valueMatch = dbScore.value === 8.0;
    const courseMatch = dbScore.courseId === 'WEB1013';
    const statusMatch = dbScore.status === 'PASSED';

    // Future fields check (should be null or empty)
    const rawScoreNull = dbScore.rawScore === null;
    const computedScoreNull = dbScore.computedScore === null;
    const noComponents = dbScore.components.length === 0;

    if (mssvMatch && valueMatch && courseMatch && statusMatch && rawScoreNull && computedScoreNull && noComponents) {
      console.log('  ✅ Pass: Committed database fields match legacy data equivalence.');
    } else {
      console.error('  ❌ Fail: Committed fields differ from legacy expectations:', {
        mssv: dbScore.mssv,
        value: dbScore.value,
        courseId: dbScore.courseId,
        status: dbScore.status,
        rawScore: dbScore.rawScore,
        computedScore: dbScore.computedScore,
        componentsCount: dbScore.components.length
      });
      passed = false;
    }
  }

  // Cleanup
  await prisma.importSession.deleteMany({ where: { fileName: { startsWith: 'EQUIV_TEST_' } } });
  await prisma.score.deleteMany({ where: { mssv: 'PSEQUIV999' } });
  await prisma.student.deleteMany({ where: { mssv: 'PSEQUIV999' } });

  if (passed) {
    console.log('\n🎉 SUCCESS: IMPORT EQUIVALENCE CONFIRMED!');
  } else {
    console.error('\n❌ FAILURE: IMPORT EQUIVALENCE CHECK FAILED.');
    process.exit(1);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
