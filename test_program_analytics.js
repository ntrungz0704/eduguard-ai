const { PrismaClient } = require('./server/generated/prisma');
const prisma = new PrismaClient();
const { computeProgramAnalytics } = require('./server/src/ai/engines/dssReportEngine');

async function test() {
  try {
    const result = await computeProgramAnalytics();
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("ERROR CAUGHT:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
