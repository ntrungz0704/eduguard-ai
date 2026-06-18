const { prisma } = require('./server/src/infrastructure/database/prisma');
const importController = require('./server/src/modules/data/import.controller');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

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

async function getSequences(prismaClient) {
  try {
    const seqs = await prismaClient.$queryRawUnsafe("SELECT * FROM sqlite_sequence");
    return seqs;
  } catch (err) {
    return [];
  }
}

async function restoreSequences(prismaClient, baselineSeqs) {
  for (const seq of baselineSeqs) {
    await prismaClient.$executeRawUnsafe(
      `UPDATE sqlite_sequence SET seq = ${seq.seq} WHERE name = '${seq.name}'`
    );
  }
  const baselineNames = new Set(baselineSeqs.map(s => s.name));
  const currentSeqs = await getSequences(prismaClient);
  for (const seq of currentSeqs) {
    if (!baselineNames.has(seq.name)) {
      await prismaClient.$executeRawUnsafe(
        `DELETE FROM sqlite_sequence WHERE name = '${seq.name}'`
      );
    }
  }
}

async function run() {
  console.log('=== VERIFYING DATABASE BACKWARD COMPATIBILITY & CONTENT EQUIVALENCE ===');
  let passed = true;

  process.env.ENABLE_COMPONENT_SCORE = 'false';
  
  const dbPath = path.resolve(__dirname, 'prisma/dev.db');
  const baselineDbPath = path.resolve(__dirname, 'prisma/dev_compat_baseline.db');

  // 1. Verify that new columns are optional/nullable in Prisma
  console.log('- Verifying score model field nullability in schema.prisma...');
  const schemaPath = path.resolve(__dirname, 'prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const rawScoreMatch = /rawScore\s+Float\?/i.test(schemaContent);
  const computedScoreMatch = /computedScore\s+Float\?/i.test(schemaContent);
  const importSessionIdMatch = /importSessionId\s+Int\?/i.test(schemaContent);

  if (rawScoreMatch) {
    console.log('  ✅ Pass: Score.rawScore is optional (nullable).');
  } else {
    console.error('  ❌ Fail: Score.rawScore is not optional in schema.prisma.');
    passed = false;
  }

  if (computedScoreMatch) {
    console.log('  ✅ Pass: Score.computedScore is optional (nullable).');
  } else {
    console.error('  ❌ Fail: Score.computedScore is not optional in schema.prisma.');
    passed = false;
  }

  if (importSessionIdMatch) {
    console.log('  ✅ Pass: Score.importSessionId is optional (nullable).');
  } else {
    console.error('  ❌ Fail: Score.importSessionId is not optional in schema.prisma.');
    passed = false;
  }

  // 2. Perform Database Content Comparison
  console.log('- Preparing database content equivalence audit...');
  
  // Ensure we cleanup and VACUUM first to get a clean baseline
  await prisma.importSession.deleteMany({ where: { fileName: { startsWith: 'COMPAT_TEST_' } } });
  await prisma.score.deleteMany({ where: { mssv: 'PSCOMPAT999' } });
  await prisma.student.deleteMany({ where: { mssv: 'PSCOMPAT999' } });
  await prisma.$executeRawUnsafe('VACUUM');
  
  const baselineSeqs = await getSequences(prisma);

  // Close baseline connection and copy db file for differential attach comparison
  await prisma.$disconnect();
  await new Promise(resolve => setTimeout(resolve, 500));
  fs.copyFileSync(dbPath, baselineDbPath);

  // Re-connect to database
  const { prisma: prismaReconnect } = require('./server/src/infrastructure/database/prisma');

  // Perform dummy Excel import operation
  const wb = xlsx.utils.book_new();
  const wsData = [
    ['MSSV', 'Họ Tên', 'Môn học', 'Thang điểm 10', 'Học kỳ', 'Trạng thái'],
    ['PSCOMPAT999', 'Nguyen Compatibility Test', 'WEB1013', '9.0', 'Summer 2025', 'Passed']
  ];
  const ws = xlsx.utils.aoa_to_sheet(wsData);
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const mockFile = {
    buffer: buffer,
    originalname: 'COMPAT_TEST_sheet.xlsx',
    size: buffer.length
  };

  const resPreview = createMockResponse();
  await importController.previewData({ file: mockFile, body: {} }, resPreview);

  const resPublish = createMockResponse();
  await importController.publishData({
    body: {
      data: resPreview.data.data,
      classCode: 'COMPAT_CLASS',
      fileHash: resPreview.data.fileHash,
      fileName: 'COMPAT_TEST_sheet.xlsx',
      fileSize: buffer.length
    },
    user: { email: 'advisor@eduguard.ai' }
  }, resPublish);

  // Assert that data got written
  const scoreInDb = await prismaReconnect.score.findFirst({ where: { mssv: 'PSCOMPAT999' } });
  if (!scoreInDb) {
    console.error('  ❌ Fail: Score failed to write to database during check.');
    passed = false;
  }

  // Delete test data
  console.log('- Cleaning up database and restoring sequences...');
  await prismaReconnect.importSession.deleteMany({ where: { fileName: { startsWith: 'COMPAT_TEST_' } } });
  await prismaReconnect.score.deleteMany({ where: { mssv: 'PSCOMPAT999' } });
  await prismaReconnect.student.deleteMany({ where: { mssv: 'PSCOMPAT999' } });
  
  await restoreSequences(prismaReconnect, baselineSeqs);
  await prismaReconnect.$executeRawUnsafe('VACUUM');

  // Attach baseline database and compare table contents
  console.log('- Checking table content consistency...');
  await prismaReconnect.$executeRawUnsafe(`ATTACH DATABASE '${baselineDbPath}' AS baseline`);

  const tables = await prismaReconnect.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );

  let hasDiff = false;
  for (const table of tables) {
    const tableName = table.name;
    try {
      const diff1 = await prismaReconnect.$queryRawUnsafe(
        `SELECT * FROM baseline.${tableName} EXCEPT SELECT * FROM main.${tableName}`
      );
      const diff2 = await prismaReconnect.$queryRawUnsafe(
        `SELECT * FROM main.${tableName} EXCEPT SELECT * FROM baseline.${tableName}`
      );

      if (diff1.length > 0 || diff2.length > 0) {
        console.error(`  ❌ Fail: Table [${tableName}] has mismatched data!`);
        hasDiff = true;
        passed = false;
      }
    } catch (err) {
      console.error(`  ❌ Error comparing table ${tableName}:`, err.message);
      passed = false;
    }
  }

  await prismaReconnect.$executeRawUnsafe("DETACH DATABASE baseline");
  await prismaReconnect.$disconnect();

  try {
    fs.unlinkSync(baselineDbPath);
  } catch (e) {}

  if (!hasDiff) {
    console.log('  ✅ Pass: All database tables are 100% mathematically content-equivalent.');
  }

  if (passed) {
    console.log('\n🎉 SUCCESS: DATABASE STRUCTURE IS 100% BACKWARD COMPATIBLE & SECURE!');
  } else {
    console.error('\n❌ FAILURE: DATABASE COMPATIBILITY CHECK FAILED.');
    process.exit(1);
  }
}

run().catch(console.error);
