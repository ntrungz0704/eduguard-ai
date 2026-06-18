const { prisma } = require('../server/src/infrastructure/database/prisma');

const DEFAULT_SCHEMAS = {
  // Web design style: Lab x8 (30% total -> 30), ASM1 (20% -> 20), ASM2 (50% -> 50)
  'web_design': [
    ...Array.from({ length: 8 }, (_, i) => ({ componentCode: `LAB${i+1}`, componentName: `Lab ${i+1}`, componentIndex: i + 1, orderNo: i + 1, count: 8, weightPercent: 30 })),
    { componentCode: 'ASM1', componentName: 'Assignment 1', componentIndex: 1, orderNo: 9, count: 1, weightPercent: 20 },
    { componentCode: 'ASM2', componentName: 'Assignment 2', componentIndex: 1, orderNo: 10, count: 1, weightPercent: 50 }
  ],
  // IT style: Quiz x4 (10% total -> 10), Lab x4 (30% total -> 30), Final x1 (60% -> 60)
  'basic_it': [
    ...Array.from({ length: 4 }, (_, i) => ({ componentCode: `QUIZ${i+1}`, componentName: `Quiz ${i+1}`, componentIndex: i + 1, orderNo: i + 1, count: 4, weightPercent: 10 })),
    ...Array.from({ length: 4 }, (_, i) => ({ componentCode: `LAB${i+1}`, componentName: `Lab ${i+1}`, componentIndex: i + 1, orderNo: i + 5, count: 4, weightPercent: 30 })),
    { componentCode: 'FINAL', componentName: 'Final Exam', componentIndex: 1, orderNo: 9, count: 1, weightPercent: 60 }
  ],
  // Project style: Defense 1 (30% -> 30), Defense 2 (70% -> 70)
  'project': [
    { componentCode: 'DEF1', componentName: 'Defense 1', componentIndex: 1, orderNo: 1, count: 1, weightPercent: 30 },
    { componentCode: 'DEF2', componentName: 'Defense 2', componentIndex: 1, orderNo: 2, count: 1, weightPercent: 70 }
  ],
  // Generic fallback: Quiz x4 (10% total -> 10), Lab x8 (30% total -> 30), Assignment (20% -> 20), Final (40% -> 40)
  'default': [
    ...Array.from({ length: 4 }, (_, i) => ({ componentCode: `QUIZ${i+1}`, componentName: `Quiz ${i+1}`, componentIndex: i + 1, orderNo: i + 1, count: 4, weightPercent: 10 })),
    ...Array.from({ length: 8 }, (_, i) => ({ componentCode: `LAB${i+1}`, componentName: `Lab ${i+1}`, componentIndex: i + 1, orderNo: i + 5, count: 8, weightPercent: 30 })),
    { componentCode: 'ASSIGNMENT', componentName: 'Assignment', componentIndex: 1, orderNo: 13, count: 1, weightPercent: 20 },
    { componentCode: 'FINAL', componentName: 'Final Exam', componentIndex: 1, orderNo: 14, count: 1, weightPercent: 40 }
  ]
};

const COURSE_STYLES = {
  'COM108': 'basic_it',
  'COM1071': 'basic_it',
  'COM2012': 'basic_it',
  'WEB1013': 'web_design',
  'WEB1043': 'web_design',
  'WEB2063': 'web_design',
  'WEB2081': 'web_design',
  'WEB2091': 'web_design',
  'WEB3023': 'web_design',
  'WEB501': 'web_design',
  'WEB502': 'web_design',
  'WEB503': 'web_design',
  'PRO1014': 'project',
  'PRO2201': 'project',
  'PRO116': 'project'
};

async function main() {
  console.log('🌱 Seeding AssessmentSchema with weight percents...');
  
  // Wipe existing AssessmentSchemas to prevent conflicts
  await prisma.assessmentSchema.deleteMany();
  console.log('Cleared existing assessment schemas.');

  const seedRecords = [];
  
  for (const [cCode, style] of Object.entries(COURSE_STYLES)) {
    const components = DEFAULT_SCHEMAS[style];
    components.forEach(comp => {
      seedRecords.push({
        courseCode: cCode,
        curriculumVersion: 'K19',
        componentCode: comp.componentCode,
        componentName: comp.componentName,
        componentIndex: comp.componentIndex,
        orderNo: comp.orderNo,
        count: comp.count,
        weightPercent: comp.weightPercent,
        isActive: true
      });
    });
  }

  // Insert records in transaction
  await prisma.$transaction(
    seedRecords.map(data => 
      prisma.assessmentSchema.create({ data })
    )
  );

  console.log(`✅ Seeded ${seedRecords.length} assessment schema records successfully.`);
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
