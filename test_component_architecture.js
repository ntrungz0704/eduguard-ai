const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Initialize Prisma
const { prisma } = require('./server/src/infrastructure/database/prisma');
const importController = require('./server/src/modules/data/import.controller');
const assessmentEngine = require('./server/src/services/assessmentEngine');

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

async function runTests() {
  console.log('=== STARTING FUTURE ASSESSMENT COMPONENTS ARCHITECTURE AUDIT ===\n');

  let passed = true;
  
  // Set flag to true for active component unit tests
  process.env.ENABLE_COMPONENT_SCORE = 'true';

  // 1. Verify Assessment Engine loads successfully
  console.log('1. Checking Assessment Engine loading...');
  if (assessmentEngine && typeof assessmentEngine.resolveCourseAssessmentSchema === 'function') {
    console.log('✅ Assessment engine loaded successfully with resolveCourseAssessmentSchema!');
  } else {
    console.error('❌ Assessment engine failed to load properly.');
    passed = false;
  }

  // 2. Verify Assessment Schema can support different course structures
  console.log('\n2. Verifying Course Grading Schema Resolution...');
  try {
    const webSchema = await assessmentEngine.resolveCourseAssessmentSchema('WEB1013');
    const itSchema = await assessmentEngine.resolveCourseAssessmentSchema('COM108');
    const projSchema = await assessmentEngine.resolveCourseAssessmentSchema('PRO2201');

    const hasLab8 = webSchema.some(s => s.componentCode === 'LAB8' && Math.abs(s.weight - 0.0375) < 0.001);
    const hasQuiz4 = itSchema.some(s => s.componentCode === 'QUIZ4' && Math.abs(s.weight - 0.025) < 0.001);
    const hasDef2 = projSchema.some(s => s.componentCode === 'DEF2' && Math.abs(s.weight - 0.70) < 0.001);

    if (hasLab8 && hasQuiz4 && hasDef2) {
      console.log('✅ Dynamic schema structures for different courses loaded correctly from database!');
      console.log(`   - WEB1013 Components Count: ${webSchema.length} (contains Lab 1-8, ASM 1-2)`);
      console.log(`   - COM108 Components Count: ${itSchema.length} (contains Quiz 1-4, Lab 1-4, Final)`);
      console.log(`   - PRO2201 Components Count: ${projSchema.length} (contains Defense 1-2)`);
    } else {
      console.error('❌ Schema components resolution or weighting was incorrect.', { hasLab8, hasQuiz4, hasDef2 });
      passed = false;
    }
  } catch (err) {
    console.error('❌ Schema resolution crashed:', err.message);
    passed = false;
  }

  // 3. Verify future component columns are recognized
  console.log('\n3. Verifying Excel Component Column Detection...');
  const testHeaders = ['MSSV', 'Họ tên', 'Trạng thái', 'Học kỳ', 'Lab 1', 'Lab 2', 'ASM 1', 'ASM 2', 'Tổng kết'];
  const detectedCols = assessmentEngine.detectAssessmentColumns(testHeaders);
  const expectedCols = ['Lab 1', 'Lab 2', 'ASM 1', 'ASM 2'];
  const colsMatch = detectedCols.length === expectedCols.length && detectedCols.every(c => expectedCols.includes(c));

  if (colsMatch) {
    console.log('✅ Columns correctly identified: ', detectedCols);
  } else {
    console.error('❌ Column detection failed. Found:', detectedCols, 'Expected:', expectedCols);
    passed = false;
  }

  // 4. Verify weighted score calculation
  console.log('\n4. Verifying Weighted Score Calculation...');
  const schema = await assessmentEngine.resolveCourseAssessmentSchema('WEB1013');
  const mockInferred = {
    'LAB1': 10, 'LAB2': 10, 'LAB3': 10, 'LAB4': 10,
    'LAB5': 10, 'LAB6': 10, 'LAB7': 10, 'LAB8': 10, // Lab sum: 10 * 30% = 3.0
    'ASM1': 8.0, // 8.0 * 20% = 1.6
    'ASM2': 9.0  // 9.0 * 50% = 4.5
  };
  const normalized = assessmentEngine.normalizeAssessmentColumns(mockInferred, schema);
  const calculated = assessmentEngine.calculateWeightedAverage(normalized, schema);
  const expectedAverage = 9.1; // 3.0 + 1.6 + 4.5 = 9.1

  if (Math.abs(calculated - expectedAverage) < 0.001) {
    console.log(`✅ Weighted score calculation matches: ${calculated} (Expected: ${expectedAverage})`);
  } else {
    console.error(`❌ Weighted score calculation mismatch: ${calculated} (Expected: ${expectedAverage})`);
    passed = false;
  }

  // 5. Clean up previous test entries
  await prisma.importSession.deleteMany({ where: { fileName: { startsWith: 'COMP_TEST_' } } });
  await prisma.score.deleteMany({ where: { mssv: 'PSCOMP999' } });
  await prisma.student.deleteMany({ where: { mssv: 'PSCOMP999' } });

  // Create test Excel with both total score AND component scores
  const wb = xlsx.utils.book_new();
  const wsData = [
    ['MSSV', 'Họ Tên', 'Môn học', 'Lab 1', 'Lab 2', 'Lab 3', 'Lab 4', 'Lab 5', 'Lab 6', 'Lab 7', 'Lab 8', 'ASM 1', 'ASM 2', 'Thang điểm 10', 'Học kỳ', 'Trạng thái'],
    ['PSCOMP999', 'Nguyen Component Test', 'WEB1013', '10.0', '10.0', '10.0', '10.0', '10.0', '10.0', '10.0', '10.0', '8.0', '9.0', '7.0', 'Summer 2025', 'Passed']
  ];
  const ws = xlsx.utils.aoa_to_sheet(wsData);
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const mockFile = {
    buffer: buffer,
    originalname: 'COMP_TEST_sheet.xlsx',
    size: buffer.length
  };

  // 6. Test Preview & Publish in DORMANT MODE (ENABLE_COMPONENT_SCORE = false)
  console.log('\n5. Verifying Component Mode remains DORMANT when feature flag is OFF...');
  process.env.ENABLE_COMPONENT_SCORE = 'false';

  const reqPreview = { file: mockFile, body: {} };
  const resPreview = createMockResponse();
  await importController.previewData(reqPreview, resPreview);

  const parsedRow = resPreview.data.data[0];
  const hash = resPreview.data.fileHash;

  if ((parsedRow.components === undefined || parsedRow.components.length === 0) && parsedRow.score === 7.0) {
    console.log('✅ In Dormant Mode, Excel components are ignored. Preview uses the provided total score (7.0).');
  } else {
    console.error('❌ Component extraction was NOT bypassed in dormant mode.', parsedRow);
    passed = false;
  }

  // Publish dormant data
  const reqPublish = {
    body: {
      data: resPreview.data.data,
      classCode: 'COMP_CLASS',
      fileHash: hash,
      fileName: 'COMP_TEST_sheet.xlsx',
      fileSize: buffer.length
    },
    user: { email: 'advisor@eduguard.ai' }
  };
  const resPublish = createMockResponse();
  await importController.publishData(reqPublish, resPublish);

  const dbScoreDormant = await prisma.score.findFirst({
    where: { mssv: 'PSCOMP999' },
    include: { components: true }
  });

  if (dbScoreDormant && dbScoreDormant.components.length === 0 && dbScoreDormant.value === 7.0) {
    console.log('✅ Database safety verified: No records created in ScoreComponent. Score value remains standard.');
  } else {
    console.error('❌ Bypassed dynamic components check failed during database commit.', dbScoreDormant);
    passed = false;
  }

  // 7. Test Active Mode (ENABLE_COMPONENT_SCORE = true)
  console.log('\n6. Testing ACTIVE Component Score Mode (ENABLE_COMPONENT_SCORE = true)...');
  process.env.ENABLE_COMPONENT_SCORE = 'true';
  
  // Clear the import session hash so we can re-upload
  await prisma.importSession.deleteMany({ where: { fileHash: hash } });

  const resPreviewActive = createMockResponse();
  await importController.previewData(reqPreview, resPreviewActive);
  
  const parsedRowActive = resPreviewActive.data.data[0];
  
  if (
    parsedRowActive.components.length > 0 && 
    parsedRowActive.score === 7.0 && 
    parsedRowActive.rawScore === 7.0 &&
    parsedRowActive.computedScore === 9.1 &&
    parsedRowActive.warnings.length > 0
  ) {
    console.log('✅ Component scores extracted in active mode!');
    console.log(`   - Extracted Components count: ${parsedRowActive.components.length}`);
    console.log(`   - Raw Score: ${parsedRowActive.rawScore} (does not overwrite, value stays 7.0)`);
    console.log(`   - Computed Score: ${parsedRowActive.computedScore}`);
    console.log(`   - Warnings issued: "${parsedRowActive.warnings[0]}"`);
  } else {
    console.error('❌ Active component preview parse failed.', parsedRowActive);
    passed = false;
  }

  // Publish active data
  const resPublishActive = createMockResponse();
  await importController.publishData({
    body: {
      data: resPreviewActive.data.data,
      classCode: 'COMP_CLASS',
      fileHash: hash,
      fileName: 'COMP_TEST_sheet.xlsx',
      fileSize: buffer.length
    },
    user: { email: 'advisor@eduguard.ai' }
  }, resPublishActive);

  const dbScoreActive = await prisma.score.findFirst({
    where: { mssv: 'PSCOMP999' },
    include: { components: true }
  });

  if (
    dbScoreActive && 
    dbScoreActive.value === 7.0 && 
    dbScoreActive.rawScore === 7.0 && 
    dbScoreActive.computedScore === 9.1 && 
    dbScoreActive.components.length === 10
  ) {
    const allAuditFieldsSet = dbScoreActive.components.every(c => c.importSessionId && c.sourceType === 'EXCEL');
    if (allAuditFieldsSet) {
      console.log('✅ Active commit succeeded! Teacher raw score preserved, computed score stored, and ScoreComponents linked with audit trail.');
    } else {
      console.error('❌ ScoreComponent audit trail fields missing:', dbScoreActive.components);
      passed = false;
    }
  } else {
    console.error('❌ Active db commit validation failed:', dbScoreActive);
    passed = false;
  }

  // Cleanup test data
  console.log('\nCleaning up verification database entries...');
  await prisma.importSession.deleteMany({ where: { fileName: { startsWith: 'COMP_TEST_' } } });
  await prisma.score.deleteMany({ where: { mssv: 'PSCOMP999' } });
  await prisma.student.deleteMany({ where: { mssv: 'PSCOMP999' } });

  if (passed) {
    console.log('\n🎉 ALL ASSESSMENT ARCHITECTURE TESTS PASSED SUCCESSFULY!');
  } else {
    console.error('\n❌ SOME ARCHITECTURE TESTS FAILED.');
    process.exit(1);
  }
}

// Reset flag to false after run
runTests()
  .catch(console.error)
  .finally(() => {
    process.env.ENABLE_COMPONENT_SCORE = 'false';
    prisma.$disconnect();
  });
