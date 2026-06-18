const fs = require('fs');
const path = require('path');
const { prisma } = require('../infrastructure/database/prisma');

// Default configurations based on FPT Polytechnic syllabus styles (weights stored as integer percentages)
const DEFAULT_SCHEMAS = {
  // Web design style: Lab x8 (30% total), ASM1 (20%), ASM2 (50%)
  'web_design': [
    ...Array.from({ length: 8 }, (_, i) => ({ componentCode: `LAB${i+1}`, componentName: `Lab ${i+1}`, componentIndex: i + 1, orderNo: i + 1, count: 8, weightPercent: 30 })),
    { componentCode: 'ASM1', componentName: 'Assignment 1', componentIndex: 1, orderNo: 9, count: 1, weightPercent: 20 },
    { componentCode: 'ASM2', componentName: 'Assignment 2', componentIndex: 1, orderNo: 10, count: 1, weightPercent: 50 }
  ],
  // IT style: Quiz x4 (10%), Lab x4 (30%), Final x1 (60%)
  'basic_it': [
    ...Array.from({ length: 4 }, (_, i) => ({ componentCode: `QUIZ${i+1}`, componentName: `Quiz ${i+1}`, componentIndex: i + 1, orderNo: i + 1, count: 4, weightPercent: 10 })),
    ...Array.from({ length: 4 }, (_, i) => ({ componentCode: `LAB${i+1}`, componentName: `Lab ${i+1}`, componentIndex: i + 1, orderNo: i + 5, count: 4, weightPercent: 30 })),
    { componentCode: 'FINAL', componentName: 'Final Exam', componentIndex: 1, orderNo: 9, count: 1, weightPercent: 60 }
  ],
  // Project style: Defense 1 (30%), Defense 2 (70%)
  'project': [
    { componentCode: 'DEF1', componentName: 'Defense 1', componentIndex: 1, orderNo: 1, count: 1, weightPercent: 30 },
    { componentCode: 'DEF2', componentName: 'Defense 2', componentIndex: 1, orderNo: 2, count: 1, weightPercent: 70 }
  ],
  // Generic fallback: Quiz x4 (10%), Lab x8 (30%), Assignment (20%), Final (40%)
  'default': [
    ...Array.from({ length: 4 }, (_, i) => ({ componentCode: `QUIZ${i+1}`, componentName: `Quiz ${i+1}`, componentIndex: i + 1, orderNo: i + 1, count: 4, weightPercent: 10 })),
    ...Array.from({ length: 8 }, (_, i) => ({ componentCode: `LAB${i+1}`, componentName: `Lab ${i+1}`, componentIndex: i + 1, orderNo: i + 5, count: 8, weightPercent: 30 })),
    { componentCode: 'ASSIGNMENT', componentName: 'Assignment', componentIndex: 1, orderNo: 13, count: 1, weightPercent: 20 },
    { componentCode: 'FINAL', componentName: 'Final Exam', componentIndex: 1, orderNo: 14, count: 1, weightPercent: 40 }
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
 * Parses a semester string like "Summer 2025" or "Fall 2026" into a comparable integer.
 * Spring -> 1, Summer -> 2, Fall -> 3.
 * Example: "Summer 2025" -> 20252
 */
function parseSemester(sem) {
  if (!sem) return 0;
  const parts = String(sem).trim().split(/\s+/);
  if (parts.length < 2) return 0;
  const term = parts[0].toLowerCase();
  const year = parseInt(parts[1]);
  if (isNaN(year)) return 0;
  let termVal = 0;
  if (term.includes('spring')) termVal = 1;
  else if (term.includes('summer')) termVal = 2;
  else if (term.includes('fall')) termVal = 3;
  return year * 10 + termVal;
}

/**
 * Resolves the dynamic grading schema for a course from the AssessmentSchema table.
 * Does NOT auto-seed the database in runtime.
 * Filters by isActive = true and checks semester range if provided.
 * If no schema exists in the DB, it generates and returns a fallback structure in-memory.
 * 
 * @param {string} courseCode - Canonical course ID
 * @param {string} curriculumVersion - Curriculum version (e.g. K19)
 * @param {string} semester - Optional semester name (e.g. "Summer 2025")
 * @returns {Promise<Array>} List of schema components with mapped float weight
 */
async function resolveCourseAssessmentSchema(courseCode, curriculumVersion = 'K19', semester = null) {
  const code = String(courseCode).toUpperCase().trim();
  
  // 1. Try to find active schemas matching curriculumVersion
  let dbSchema = await prisma.assessmentSchema.findMany({
    where: {
      courseCode: code,
      isActive: true,
      curriculumVersion: curriculumVersion
    },
    orderBy: { orderNo: 'asc' }
  });

  // Fallback to any active schemas for this course if none found for curriculumVersion
  if (dbSchema.length === 0) {
    dbSchema = await prisma.assessmentSchema.findMany({
      where: {
        courseCode: code,
        isActive: true
      },
      orderBy: { orderNo: 'asc' }
    });
  }

  // Filter by semester applicability if semester is provided
  if (semester && dbSchema.length > 0) {
    const targetVal = parseSemester(semester);
    dbSchema = dbSchema.filter(schema => {
      if (schema.effectiveFromSemester) {
        const fromVal = parseSemester(schema.effectiveFromSemester);
        if (targetVal < fromVal) return false;
      }
      if (schema.effectiveToSemester) {
        const toVal = parseSemester(schema.effectiveToSemester);
        if (targetVal > toVal) return false;
      }
      return true;
    });
  }

  // 2. If schemas exist in DB, map weightPercent to float weight (weight = weightPercent / 100 / count)
  if (dbSchema.length > 0) {
    return dbSchema.map(s => ({
      ...s,
      weight: (s.weightPercent / 100) / s.count
    }));
  }

  // 3. Fallback: Generate dynamic default schema in-memory (never save to DB)
  console.log(`[AssessmentEngine] No active schema found in database for course ${code}. Generating fallback in-memory schema...`);
  const style = COURSE_STYLES[code] || 'default';
  const defaultComps = DEFAULT_SCHEMAS[style];
  
  return defaultComps.map(comp => ({
    courseCode: code,
    curriculumVersion: curriculumVersion || 'K19',
    componentCode: comp.componentCode,
    componentName: comp.componentName,
    componentIndex: comp.componentIndex || 1,
    orderNo: comp.orderNo,
    count: comp.count,
    weightPercent: comp.weightPercent,
    weight: (comp.weightPercent / 100) / comp.count,
    isActive: true
  }));
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
        weightPercent: schemaComp.weightPercent,
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
  
  // Normalize the average relative to the weight completed
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
function buildAssessmentObjects(normalizedComponents, scoreId, importSessionId = null, sourceType = 'EXCEL') {
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
      weightPercent: c.weightPercent !== undefined ? c.weightPercent : (c.weight ? Math.round(c.weight * 100) : null),
      sourceColumn: c.sourceColumn || c.componentCode,
      sourceType,
      importSessionId
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
