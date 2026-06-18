const fs = require('fs');
const path = require('path');
const { prisma } = require('../infrastructure/database/prisma');

// Default configurations based on FPT Polytechnic syllabus styles
const DEFAULT_SCHEMAS = {
  // Web design style: Lab x8 (30%), ASM1 (20%), ASM2 (50%)
  'web_design': [
    ...Array.from({ length: 8 }, (_, i) => ({ componentCode: `LAB${i+1}`, componentName: `Lab ${i+1}`, orderNo: i + 1, count: 8, weight: 0.0375 })),
    { componentCode: 'ASM1', componentName: 'Assignment 1', orderNo: 9, count: 1, weight: 0.20 },
    { componentCode: 'ASM2', componentName: 'Assignment 2', orderNo: 10, count: 1, weight: 0.50 }
  ],
  // IT style: Quiz x4 (10%), Lab x4 (30%), Final x1 (60%)
  'basic_it': [
    ...Array.from({ length: 4 }, (_, i) => ({ componentCode: `QUIZ${i+1}`, componentName: `Quiz ${i+1}`, orderNo: i + 1, count: 4, weight: 0.025 })),
    ...Array.from({ length: 4 }, (_, i) => ({ componentCode: `LAB${i+1}`, componentName: `Lab ${i+1}`, orderNo: i + 5, count: 4, weight: 0.075 })),
    { componentCode: 'FINAL', componentName: 'Final Exam', orderNo: 9, count: 1, weight: 0.60 }
  ],
  // Project style: Defense 1 (30%), Defense 2 (70%)
  'project': [
    { componentCode: 'DEF1', componentName: 'Defense 1', orderNo: 1, count: 1, weight: 0.30 },
    { componentCode: 'DEF2', componentName: 'Defense 2', orderNo: 2, count: 1, weight: 0.70 }
  ],
  // Generic fallback: Quiz x4 (10%), Lab x8 (30%), Assignment (20%), Final (40%)
  'default': [
    ...Array.from({ length: 4 }, (_, i) => ({ componentCode: `QUIZ${i+1}`, componentName: `Quiz ${i+1}`, orderNo: i + 1, count: 4, weight: 0.025 })),
    ...Array.from({ length: 8 }, (_, i) => ({ componentCode: `LAB${i+1}`, componentName: `Lab ${i+1}`, orderNo: i + 5, count: 8, weight: 0.0375 })),
    { componentCode: 'ASSIGNMENT', componentName: 'Assignment', orderNo: 13, count: 1, weight: 0.20 },
    { componentCode: 'FINAL', componentName: 'Final Exam', orderNo: 14, count: 1, weight: 0.40 }
  ]
};

// Map specific courses to their styles
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

/**
 * Resolves the dynamic grading schema for a course from the AssessmentSchema table.
 * If the table is empty, it automatically seeds default configurations.
 * If no schema exists for the course, it creates a default schema dynamically in the DB.
 * 
 * @param {string} courseCode - Canonical course ID
 * @returns {Promise<Array>} List of schema components
 */
async function resolveCourseAssessmentSchema(courseCode) {
  const code = String(courseCode).toUpperCase().trim();
  
  // 1. Try to find the schema in the DB
  let dbSchema = await prisma.assessmentSchema.findMany({
    where: { courseCode: code },
    orderBy: { orderNo: 'asc' }
  });

  if (dbSchema.length > 0) {
    return dbSchema;
  }

  // 2. Auto-seed if database is empty
  const totalCount = await prisma.assessmentSchema.count();
  if (totalCount === 0) {
    console.log('[AssessmentEngine] Seeding default course assessment schemas into database...');
    const seedRecords = [];
    
    for (const [cCode, style] of Object.entries(COURSE_STYLES)) {
      const components = DEFAULT_SCHEMAS[style];
      components.forEach(comp => {
        seedRecords.push({
          courseCode: cCode,
          componentCode: comp.componentCode,
          componentName: comp.componentName,
          orderNo: comp.orderNo,
          count: comp.count,
          weight: comp.weight,
          isRequired: true
        });
      });
    }

    await prisma.$transaction(
      seedRecords.map(data => 
        prisma.assessmentSchema.create({ data })
      )
    );
    console.log(`[AssessmentEngine] Seeded ${seedRecords.length} default schema components.`);

    // Re-query
    dbSchema = await prisma.assessmentSchema.findMany({
      where: { courseCode: code },
      orderBy: { orderNo: 'asc' }
    });
    if (dbSchema.length > 0) return dbSchema;
  }

  // 3. Fallback: Generate dynamic default schema for this specific course and save to DB
  console.log(`[AssessmentEngine] No schema found for course ${code}. Generating default schema...`);
  const style = COURSE_STYLES[code] || 'default';
  const defaultComps = DEFAULT_SCHEMAS[style];
  
  const createdComps = [];
  for (const comp of defaultComps) {
    const record = await prisma.assessmentSchema.create({
      data: {
        courseCode: code,
        componentCode: comp.componentCode,
        componentName: comp.componentName,
        orderNo: comp.orderNo,
        count: comp.count,
        weight: comp.weight,
        isRequired: true
      }
    });
    createdComps.push(record);
  }

  return createdComps;
}

/**
 * Scans Excel headers for columns matching assessment components.
 * 
 * @param {Array<string>} headers - Header columns
 * @returns {Array<string>} List of columns matching components
 */
function detectAssessmentColumns(headers) {
  if (!headers || !Array.isArray(headers)) return [];
  
  const nonComponentKeys = new Set([
    'mssv', 'student_code', 'student_id', 'mã sinh viên', 'mã số sinh viên',
    'name', 'fullname', 'fullname', 'họ tên', 'họ và tên', 'tên sinh viên',
    'semester', 'học kỳ', 'học kỳ', 'classcode', 'mã lớp', 'lớp', 'status', 'trạng thái',
    'score', 'value', 'điểm', 'điểm tổng kết', 'tổng kết', 'thang điểm 10', '_row', 'isvalid', 'errors'
  ]);

  return headers.filter(h => {
    const clean = String(h).trim().toLowerCase();
    if (nonComponentKeys.has(clean)) return false;
    
    // Potential components: lab, quiz, assignment, asm, final, pe, test, defense
    return clean.includes('lab') || 
           clean.includes('quiz') || 
           clean.includes('asm') || 
           clean.includes('assignment') || 
           clean.includes('final') || 
           clean.includes('pe') || 
           clean.includes('test') || 
           clean.includes('defense') ||
           clean.includes('thực hành') ||
           clean.includes('lý thuyết');
  });
}

/**
 * Extracts and parses assessment components from an Excel row object.
 * 
 * @param {object} row - Excel row object
 * @returns {object} Extracted component values (e.g. { lab1: 8.5, asm1: 9 })
 */
function inferComponentsFromExcel(row) {
  if (!row || typeof row !== 'object') return {};
  
  const headers = Object.keys(row);
  const detectedCols = detectAssessmentColumns(headers);
  const result = {};

  detectedCols.forEach(col => {
    const val = row[col];
    if (val === undefined || val === null || val === '') return;
    
    const cleanCol = String(col).trim().replace(/\s+/g, '').toUpperCase();
    const scoreVal = parseFloat(val);
    if (!isNaN(scoreVal)) {
      result[cleanCol] = scoreVal;
    }
  });

  return result;
}

/**
 * Maps Excel columns to schema component codes.
 * 
 * @param {object} inferredComponents - Extracted Excel components
 * @param {Array} courseSchema - Grading schema
 * @returns {Array} List of normalized components with values
 */
function normalizeAssessmentColumns(inferredComponents, courseSchema) {
  if (!inferredComponents || !courseSchema) return [];

  const result = [];
  courseSchema.forEach(schemaComp => {
    const code = schemaComp.componentCode.toUpperCase();
    const name = schemaComp.componentName.toUpperCase().replace(/\s+/g, '');
    
    // Find matching key in inferred components (e.g. LAB1 or LAB 1)
    let matchedVal = null;
    let matchedCol = null;

    for (const [inferredKey, val] of Object.entries(inferredComponents)) {
      const keyUpper = inferredKey.toUpperCase();
      if (keyUpper === code || keyUpper === name || keyUpper.includes(code) || code.includes(keyUpper)) {
        matchedVal = val;
        matchedCol = inferredKey;
        break;
      }
    }

    if (matchedVal !== null) {
      result.push({
        componentCode: schemaComp.componentCode,
        componentName: schemaComp.componentName,
        value: matchedVal,
        weight: schemaComp.weight,
        sourceColumn: matchedCol
      });
    }
  });

  return result;
}

/**
 * Validates if the sum of weights in a schema equals 100% (1.0).
 * 
 * @param {Array} schema - Dynamic course schema
 * @returns {boolean} True if valid
 */
function validateWeights(schema) {
  if (!schema || schema.length === 0) return false;
  const totalWeight = schema.reduce((sum, item) => sum + (item.weight || 0), 0);
  return Math.abs(totalWeight - 1.0) < 0.001; // Allow float precision variations
}

/**
 * Calculates weighted average score from normalized components.
 * 
 * @param {Array} components - Normalized component array
 * @param {Array} schema - Full course schema
 * @returns {number|null} Calculated score or null if insufficient data
 */
function calculateWeightedAverage(components, schema) {
  if (!components || components.length === 0) return null;

  let totalWeightedScore = 0;
  let totalWeightUsed = 0;

  components.forEach(comp => {
    if (comp.value !== null && comp.value !== undefined) {
      totalWeightedScore += (comp.value * (comp.weight || 0));
      totalWeightUsed += (comp.weight || 0);
    }
  });

  if (totalWeightUsed === 0) return null;
  
  // If not all components are graded, normalize the average relative to the weight completed
  const finalScore = totalWeightedScore / totalWeightUsed;
  return parseFloat(finalScore.toFixed(2));
}

/**
 * Calculate final score wrapper.
 */
function calculateFinalScore(components, courseSchema) {
  return calculateWeightedAverage(components, courseSchema);
}

/**
 * Creates database-ready array of components to insert.
 */
function buildAssessmentObjects(normalizedComponents, scoreId) {
  if (!normalizedComponents || !Array.isArray(normalizedComponents)) return [];
  
  return normalizedComponents.map(c => {
    // Extract index from code if applicable (e.g. LAB5 -> 5)
    const match = String(c.componentCode).match(/\d+/);
    const componentIndex = match ? parseInt(match[0]) : 1;

    return {
      scoreId,
      componentCode: c.componentCode,
      componentName: c.componentName,
      componentIndex,
      value: c.value,
      weight: c.weight,
      sourceColumn: c.sourceColumn || c.componentCode
    };
  });
}

/**
 * Saves components into the ScoreComponent database table.
 * 
 * @param {object} tx - Prisma transaction client
 * @param {number} scoreId - Score entry ID
 * @param {Array} dbComponents - Prepared components array
 */
async function saveScoreComponents(tx, scoreId, dbComponents) {
  if (!dbComponents || dbComponents.length === 0) return;
  
  // Wipe any existing components for this score entry to prevent duplicate constraints
  await tx.scoreComponent.deleteMany({
    where: { scoreId }
  });

  for (const comp of dbComponents) {
    await tx.scoreComponent.create({
      data: { ...comp, scoreId }
    });
  }
}

module.exports = {
  resolveCourseAssessmentSchema,
  detectAssessmentColumns,
  inferComponentsFromExcel,
  normalizeAssessmentColumns,
  validateWeights,
  calculateWeightedAverage,
  calculateFinalScore,
  buildAssessmentObjects,
  saveScoreComponents
};
