const XLSX = require('xlsx');
const Decimal = require('decimal.js');
const { prisma } = require('../infrastructure/database/prisma');
const { Prisma } = require('@prisma/client');

// ============================================================
// PARSE SCORE: handle *, X, empty, number, -
// ============================================================
function parseScore(val) {
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).trim();
  if (s === '*' || s === 'X' || s === '-' || s === 'F') return null;
  
  // Xử lý các điểm đặc biệt của FPT Poly
  const lower = s.toLowerCase();
  if (lower === 'đạt' || lower === 'passed' || lower === 'miễn') return 1.0; 
  
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return n;
}

// ============================================================
// SMART SUBJECT NAME MAPPING (Excel -> Pre-trained Subject)
// Handles suffixes like (TKTW), - Vovinam, spacing mismatches in & / and
// ============================================================
function mapToPretrainedSubject(excelSubName, pretrainedSubjects = []) {
  if (!excelSubName) return null;
  const excelClean = excelSubName.trim().toUpperCase();
  
  if (pretrainedSubjects.length === 0) return excelSubName.trim();

  // Strict exact match (case-insensitive)
  const exactMatch = pretrainedSubjects.find(ps => ps.trim().toUpperCase() === excelClean);
  if (exactMatch) {
    return exactMatch;
  }
  
  // If not found strictly, do NOT guess.
  return excelSubName.trim();
}

// ============================================================
// DATA CLEANING & VALIDATION PIPELINE
// ============================================================
async function validateAndCleanData(parsedRows, headers, fileType, pretrainedSubjects = []) {
  const errors = [];
  const validStudents = [];
  let subjectCols = [];

  // 1. Fetch all courses and their aliases dynamically from the DB (Single Source of Truth)
  let dbCourses = [];
  let dbAliases = [];
  try {
    const { prisma } = require('../infrastructure/database/prisma');
    dbCourses = await prisma.course.findMany();
    dbAliases = await prisma.courseAlias.findMany();
  } catch (dbErr) {
    console.error('[validateAndCleanData] Failed to load courses or aliases from DB:', dbErr.message);
  }

  // 2. Build a local lookup map (code/alias/name -> subjectName)
  const lookupMap = new Map();
  dbCourses.forEach(c => {
    if (c && c.id && c.name) {
      // Map course ID/code to its name (e.g. COM1071 -> Tin học)
      lookupMap.set(c.id.toUpperCase(), c.name);
      
      // Also map lowercase/uppercase names to themselves for direct matching
      lookupMap.set(c.name.toLowerCase(), c.name);
      lookupMap.set(c.name.toUpperCase(), c.name);
    }
  });

  dbAliases.forEach(a => {
    if (a && a.aliasCode && a.courseCode) {
      // Find course name for this canonical courseCode
      const course = dbCourses.find(c => c.id.toUpperCase() === a.courseCode.toUpperCase());
      if (course) {
        lookupMap.set(a.aliasCode.toLowerCase(), course.name);
        lookupMap.set(a.aliasCode.toUpperCase(), course.name);
      }
    }
  });

  // Safe static fallback if DB is empty or failed
  if (lookupMap.size === 0) {
    for (const [code, name] of Object.entries(staticCourseCodeToNameMap)) {
      lookupMap.set(code.toUpperCase(), name);
    }
  }

  // Local helper to resolve input to standard subject name
  const resolveToSubjectNameLocal = (rawInput) => {
    if (!rawInput) return null;
    const raw = String(rawInput).trim();
    const upper = raw.toUpperCase();
    const lower = raw.toLowerCase();

    let name = null;
    // 1. Direct lookup by code, alias, or name
    if (lookupMap.has(upper)) {
      name = lookupMap.get(upper);
    } else if (lookupMap.has(lower)) {
      name = lookupMap.get(lower);
    } else {
      name = raw;
    }

    // 2. Map to the standard pretrained subject name (fuzzy & accent correction)
    return mapToPretrainedSubject(name, pretrainedSubjects);
  };

  // Helper to normalize header names for robust fuzzy detection
  const normHeader = (h) => String(h || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D') // Convert Vietnamese Đ to standard D
    .replace(/\s+/g, '');

  if (fileType === 'transcript') {
    // PERSONAL TRANSCRIPT MODE (1 Student)
    
    // Prioritize mapping the Course Code/ID column over the Course Name column
    let subjectCol = headers.find(h => {
      const nh = normHeader(h);
      return nh.includes('MAMON') || nh.includes('MACHUYENDOI') || nh.includes('COURSEID') || nh.includes('COURSECODE');
    });

    if (!subjectCol) {
      subjectCol = headers.find(h => {
        const nh = normHeader(h);
        return nh === 'MON' || nh === 'MONHOC' || nh === 'SUBJECT' || nh === 'COURSE' || nh.includes('MON');
      });
    }
    
    // Prioritize Final Score columns over sub-scores like "Điểm Lab", "Điểm Quiz"
    let scoreCol = headers.find(h => {
      const nh = normHeader(h);
      return nh.includes('THANGDIEM10') || nh.includes('TONGKET') || nh.includes('TRUNGBINH') || nh === 'DIEM' || nh === 'SCORE';
    });
    
    // Fallback if no specific final score column is found
    if (!scoreCol) {
      scoreCol = headers.find(h => {
        const nh = normHeader(h);
        return nh.includes('DIEM') && !nh.includes('CHU'); // Avoid 'Điểm chữ' (A, B, C)
      });
    }

    const statusCol = headers.find(h => {
      const nh = normHeader(h);
      return nh.includes('TRANGTHAI') || nh.includes('STATUS');
    });

    if (!subjectCol || !scoreCol) {
      errors.push("Bảng điểm cá nhân thiếu cột 'Môn' hoặc 'Điểm'");
      return { validStudents, errors, subjectCols };
    }

    const scores = {};
    parsedRows.forEach((row, idx) => {
      let subRaw = String(row[subjectCol] || '').trim();
      if (!subRaw) return;

      let sub = resolveToSubjectNameLocal(subRaw);
      
      const courseCodeNormalized = resolveBackendCourseCode(subRaw);
      const courseFound = !!courseCodeNormalized;
      const curriculumFound = pretrainedSubjects.includes(sub);
      const aliasUsed = courseCodeNormalized && courseCodeNormalized !== subRaw;

      // Temporary diagnostic logs for COM107/COM1071
      if (subRaw.toUpperCase().includes('COM107') || subRaw.toUpperCase().includes('COM1071')) {
        console.log({
          rawCode: subRaw,
          normalizedCode: courseCodeNormalized,
          resolvedCode: sub
        });
      }

      console.log(`[Diagnostic] Row ${idx + 2}:`, {
        rawCode: subRaw,
        resolvedCode: sub,
        courseFound,
        curriculumFound,
        aliasUsed
      });

      // Block invalid subjects
      if (pretrainedSubjects && pretrainedSubjects.length > 0 && !curriculumFound) {
        errors.push(`Môn học không hợp lệ hoặc không có trong khung chương trình: ${subRaw}`);
        return;
      }

      let score = parseScore(row[scoreCol]);
      
      // ============================================================
      // CRITICAL FIX: Retain NOT_STARTED or STUDYING status
      // ============================================================
      let status = 'STUDYING';
      const rawValUpper = String(row[scoreCol] || '').trim().toUpperCase();

      if (rawValUpper === 'NOT_STARTED') {
        score = null;
        status = 'NOT_STARTED';
      } else if (score === null || score === undefined || rawValUpper === '') {
        score = null;
        status = 'STUDYING';
      } else if (score === 0 && rawValUpper !== '0') {
        // Handle cases where parseScore returns 0 but raw is something else
        score = null;
        status = 'STUDYING';
      } else {
        status = (score >= 5.0) ? 'PASSED' : 'FAILED';
      }

      if (statusCol) {
        // Dynamic status checks for both English and Vietnamese keywords
        const statusVal = normHeader(row[statusCol]);
        if (
          statusVal.includes('STUDY') || 
          statusVal.includes('START') || 
          statusVal.includes('DANGHOC') || 
          statusVal.includes('CHUA') ||
          statusVal.includes('FAIL') ||
          statusVal.includes('HOCLAI') ||
          statusVal.includes('ROT')
        ) {
          score = null; // Mark as missing for prediction
        }
      }
      if (statusCol) {
        // Override status if explicitly defined
        const statusVal = normHeader(row[statusCol]);
        if (statusVal.includes('NOT_STARTED')) status = 'NOT_STARTED';
        else if (statusVal.includes('STUDY') || statusVal.includes('DANGHOC')) status = 'STUDYING';
        else if (statusVal.includes('FAIL') || statusVal.includes('ROT')) status = 'FAILED';
        else if (statusVal.includes('PASS') || statusVal.includes('DAT')) status = 'PASSED';
        
        if (status === 'STUDYING' || status === 'NOT_STARTED') {
          score = null;
        }
      }

      scores[sub] = { value: score, status };
      if (!subjectCols.includes(sub)) subjectCols.push(sub);
    });

    if (Object.keys(scores).length === 0) {
      errors.push("Không tìm thấy điểm hợp lệ trong bảng điểm cá nhân.");
    } else {
      validStudents.push({ id: 'CA_NHAN', name: 'Bảng điểm Cá nhân', scores });
    }

  } else {
    // CLASS DATASET MODE (Many Students)
    const idCol = headers.find(h => {
      const v = h.toUpperCase();
      return v === 'MSSV' || v.includes('MÃ SV') || v.includes('MÃ SINH VIÊN') || v === 'ID' || v === 'STUDENT ID';
    });
    
    const nameCol = headers.find(h => {
      const v = h.toUpperCase();
      return v.includes('HỌ TÊN') || v.includes('TÊN') || v.includes('NAME') || v.includes('STUDENT NAME');
    }) || headers[1];

    if (!idCol) {
      errors.push("Không tìm thấy cột Mã sinh viên (MSSV) hợp lệ");
      return { validStudents, errors, subjectCols: [] };
    }

    const rawSubjectCols = headers.filter(h => h !== idCol && h !== nameCol && h && !h.startsWith('__EMPTY_'));
    
    // Map each class dataset subject to pretrained subjects
    const validRawCols = [];
    rawSubjectCols.forEach(rs => {
      let matched = resolveToSubjectNameLocal(rs);
      
      const courseCodeNormalized = resolveBackendCourseCode(rs);
      const courseFound = !!courseCodeNormalized;
      const curriculumFound = pretrainedSubjects.includes(matched);
      const aliasUsed = courseCodeNormalized && courseCodeNormalized !== rs;

      // Temporary diagnostic logs for COM107/COM1071
      if (rs.toUpperCase().includes('COM107') || rs.toUpperCase().includes('COM1071')) {
        console.log({
          rawCode: rs,
          normalizedCode: courseCodeNormalized,
          resolvedCode: matched
        });
      }

      console.log(`[Diagnostic] Column [${rs}]:`, {
        rawCode: rs,
        resolvedCode: matched,
        courseFound,
        curriculumFound,
        aliasUsed
      });

      // Block invalid subjects
      if (pretrainedSubjects && pretrainedSubjects.length > 0 && !curriculumFound) {
        errors.push(`Cột môn học không hợp lệ: ${rs}`);
      } else {
        validRawCols.push({ raw: rs, matched });
        if (!subjectCols.includes(matched)) {
          subjectCols.push(matched);
        }
      }
    });

    // If any invalid columns found, block the entire import to keep DB clean
    if (errors.length > 0) {
      return { validStudents: [], errors, subjectCols: [], fileType };
    }

    parsedRows.forEach((row, index) => {
      const id = String(row[idCol] || '').trim();
      
      if (!id) {
        errors.push(`Dòng ${index + 2}: Thiếu MSSV`);
        return; 
      }

      const name = nameCol && row[nameCol] ? String(row[nameCol]).trim() : undefined;

      const scores = {};
      validRawCols.forEach(({ raw: rs, matched: matchedSub }) => {
        const rawValue = String(row[rs] || '').trim().toUpperCase();
        let scoreVal = parseScore(row[rs]);
        let status = 'STUDYING';

        if (rawValue === 'NOT_STARTED') {
          scoreVal = null;
          status = 'NOT_STARTED';
        } else if (rawValue === '' || scoreVal === null || scoreVal === undefined) {
          scoreVal = null;
          status = 'STUDYING';
        } else {
          if (scoreVal !== null && (scoreVal < 0 || scoreVal > 10)) {
            errors.push(`Dòng ${index + 2}: Điểm môn '${rs}' không hợp lệ (${scoreVal}). Điểm phải từ 0 đến 10.`);
          }
          status = (scoreVal >= 5.0) ? 'PASSED' : 'FAILED';
        }
        
        scores[matchedSub] = { value: scoreVal, status };
      });

      validStudents.push({ id, name, scores });
    });
  }

  return { validStudents, errors, subjectCols, fileType };
}

// ============================================================
// CALCULATE GPA: FPT POLYTECHNIC WEIGHTED FORMULA
// ============================================================
function getCourseCredits(courseNameOrId) {
  const name = String(courseNameOrId || '').trim();
  const lower = name.toLowerCase();
  const code = name.toUpperCase();

  if (lower.includes('thể chất') || lower.includes('vovinam') || code.includes('VIE103')) return 2;
  if (lower.includes('quốc phòng') || lower.includes('gdqp') || code.includes('VIE104') || code.includes('VIE109')) {
    return code.includes('VIE109') ? 3 : 4;
  }
  if (lower.includes('thực tập tốt nghiệp') || code.includes('PRO115') || code.includes('PRO110') || code.includes('PRO116')) return 5;
  if (lower.includes('chính trị') || code.includes('VIE108')) return 5;
  if (lower.includes('dự án tốt nghiệp') || code.includes('PRO2201') || code.includes('PRO220')) return 5;

  if (
    lower.includes('tiếng anh') || lower.includes('tieng anh') || code.includes('ENT')
  ) {
    return 2;
  }

  if (
    lower.includes('kỹ năng học tập') || code.includes('PDP102') ||
    lower.includes('kỹ năng phát triển bản thân') || code.includes('PDP103') ||
    lower.includes('kỹ năng làm việc') || code.includes('PDP104') ||
    lower.includes('pháp luật') || code.includes('VIE1028') || code.includes('VIE1026') || code.includes('VIE102')
  ) {
    return 2;
  }

  return 3;
}

function isConditionalCourse(courseName, courseId) {
  const cid = (courseId || '').toUpperCase().trim();
  const lower = String(courseName || '').toLowerCase();
  
  if (cid.startsWith('VIE103') || cid.startsWith('VIE104') || cid.startsWith('VIE109')) return true;
  if (cid.startsWith('PRO116') || cid.startsWith('PRO110') || cid.startsWith('PRO115')) return true;
  
  if (lower.includes('thể chất') || lower.includes('vovinam')) return true;
  if (lower.includes('quốc phòng') || lower.includes('gdqp')) return true;
  if (lower.includes('thực tập tốt nghiệp')) return true;
  
  return false;
}

function isEnglishCourse(courseName, courseId) {
  // Wait, English courses ARE counted in GPA at FPT Polytechnic!
  // We must return false so they are NOT excluded from GPA calculation.
  // Unless specifically required to filter out English, we return false.
  // Actually, let's keep the function but make it return false, or just ignore it in GPA calculation.
  return false;
}

function calculateOfficialGPA(scores) {
  if (!scores) return { gpa: 0.0, gpa_4: 0.0, totalCredits: 0, validCreditsForGPA: 0 };

  let totalScoreWeight = new Decimal(0);
  let totalScoreWeight4 = new Decimal(0);
  let gpaCredits = new Decimal(0);
  let totalAccumulatedCredits = 0;

  const processScore = (s, courseName, courseId) => {
    const val = (s && s.value !== undefined) ? s.value : s; // handle both object and primitive value
    const status = (s && s.status) ? s.status : 'PASSED';

    if (val === null || val === undefined || val === '') return;
    
    let isCond = isConditionalCourse(courseName, courseId);
    if (s && s.course && typeof s.course.isConditional === 'boolean') {
      isCond = isCond || s.course.isConditional;
    }

    let creditsNum = getCourseCredits(courseName || courseId);
    if (s && s.course && typeof s.course.credits === 'number') {
      creditsNum = s.course.credits;
    }
    
    const scoreNum = parseFloat(val);

    // Accumulated credits count if Passed (>=5.0 or explicitly PASSED/Đạt/Miễn or score is exactly 1.0 meaning Passed)
    if (scoreNum >= 5.0 || status === 'PASSED' || String(val).toLowerCase() === 'đạt' || String(val).toLowerCase() === 'miễn' || scoreNum === 1.0) {
      totalAccumulatedCredits += creditsNum;
    }

    // Only calculate GPA for Passed, Non-Conditional courses with actual numeric scores > 1.0
    // A score of exactly 1.0 usually represents a "Passed" flag rather than a 1/10 score.
    if (!isCond && !isNaN(scoreNum) && scoreNum > 1.0 && status === 'PASSED') {
      const dScore = new Decimal(scoreNum);
      const dCredits = new Decimal(creditsNum);
      
      totalScoreWeight = totalScoreWeight.plus(dScore.times(dCredits));
      
      let score4Num = 0;
      if (scoreNum >= 9.0) score4Num = 4.0;
      else if (scoreNum >= 8.5) score4Num = 3.75;
      else if (scoreNum >= 8.0) score4Num = 3.5;
      else if (scoreNum >= 7.5) score4Num = 3.25;
      else if (scoreNum >= 7.0) score4Num = 3.0;
      else if (scoreNum >= 6.5) score4Num = 2.5;
      else if (scoreNum >= 5.0) score4Num = 2.0;
      else score4Num = 0.0;
      
      const dScore4 = new Decimal(score4Num);
      totalScoreWeight4 = totalScoreWeight4.plus(dScore4.times(dCredits));
      gpaCredits = gpaCredits.plus(dCredits);
    }
  };

  // Group scores by unique courseId to avoid double-counting retakes
  if (Array.isArray(scores)) {
    const groupedScores = {};
    scores.forEach(s => {
      const cid = (s.courseId || s.course?.id || '').toUpperCase();
      if (!cid) return;
      
      const val = parseFloat(s.value);
      const isPassed = s.status === 'PASSED' || val >= 5.0 || String(s.value).toLowerCase() === 'đạt' || String(s.value).toLowerCase() === 'miễn';

      if (!groupedScores[cid]) {
        groupedScores[cid] = s;
      } else {
        const existingVal = parseFloat(groupedScores[cid].value);
        const existingPassed = groupedScores[cid].status === 'PASSED' || existingVal >= 5.0 || String(groupedScores[cid].value).toLowerCase() === 'đạt' || String(groupedScores[cid].value).toLowerCase() === 'miễn';
        
        // Retain the best attempt: Highest score, or PASSED status
        if (!isNaN(val) && (isNaN(existingVal) || val > existingVal)) {
          groupedScores[cid] = s;
        } else if (isPassed && !existingPassed) {
          groupedScores[cid] = s;
        }
      }
    });
    
    Object.values(groupedScores).forEach(s => {
      processScore(s, s.course?.name || s.courseId, s.courseId);
    });
  } else {
    Object.entries(scores).forEach(([courseId, val]) => {
      processScore(val, courseId, courseId);
    });
  }

  let gpa = 0.0;
  let gpa_4 = 0.0;

  if (gpaCredits.gt(0)) {
    // Round to 2 decimal places exactly at the end
    gpa = parseFloat(totalScoreWeight.dividedBy(gpaCredits).toFixed(2));
    gpa_4 = parseFloat(totalScoreWeight4.dividedBy(gpaCredits).toFixed(2));
  }

  return {
    gpa,
    gpa_4,
    totalCredits: totalAccumulatedCredits,
    validCreditsForGPA: gpaCredits.toNumber()
  };
}

function calculateDelayScore(scores, syllabusGraph, courseDependency) {
  const completedScores = scores.filter(s => s.value !== null && (s.status === 'PASSED' || s.status === 'FAILED'));
  const failedCourses = completedScores.filter(s => s.status === 'FAILED' || s.value < 5.0).map(s => s.courseId);
  
  if (failedCourses.length === 0) {
    return {
      delayScore: 0,
      failedCredits: 0,
      blockedCount: 0,
      maxChainDepth: 0,
      bottleneckWeight: 0
    };
  }

  // 1. Calculate failed credits
  const failedCredits = completedScores.filter(s => s.status === 'FAILED').reduce((sum, s) => {
    return sum + getCourseCredits(s.courseId);
  }, 0);

  // 2. Calculate blocked courses
  const blockedCourses = [];
  failedCourses.forEach(fc => {
    const node = syllabusGraph[fc];
    if (node && node.unlocks) {
      node.unlocks.forEach(unlock => {
        if (!blockedCourses.includes(unlock)) {
          blockedCourses.push(unlock);
        }
      });
    }
    const depNode = courseDependency[fc];
    if (depNode && depNode.affects) {
      depNode.affects.forEach(affect => {
        if (!blockedCourses.includes(affect)) {
          blockedCourses.push(affect);
        }
      });
    }
  });
  const blockedCount = blockedCourses.length;

  // 3. Calculate max chain depth & bottleneck weight
  let bottleneckWeight = 0;
  let maxChainDepth = 0;

  failedCourses.forEach(fc => {
    // Bottleneck weight
    const node = syllabusGraph[fc];
    const unlocksCount = node && node.unlocks ? node.unlocks.length : 0;
    const depNode = courseDependency[fc];
    const affectsCount = depNode && depNode.affects ? depNode.affects.length : 0;
    const directBlockedCount = Math.max(unlocksCount, affectsCount);

    if (directBlockedCount >= 3) {
      bottleneckWeight += 15;
    } else if (directBlockedCount > 0) {
      bottleneckWeight += 8;
    }

    // Max chain depth
    let depth = 0;
    let current = fc;
    while (depth < 6) { // safety limit
      const nextNode = Object.entries(syllabusGraph).find(([key, val]) => val.prerequisites && val.prerequisites.includes(current));
      if (nextNode) {
        depth++;
        current = nextNode[0];
      } else {
        break;
      }
    }
    maxChainDepth = Math.max(maxChainDepth, depth);
  });

  const delayScore = failedCredits + (blockedCount * 3) + (maxChainDepth * 5) + bottleneckWeight;

  return {
    delayScore,
    failedCredits,
    blockedCount,
    maxChainDepth,
    bottleneckWeight
  };
}

const courseCodeNormalizationMap = {
  'COM107': 'COM1071',
  'COM1071': 'COM1071',
  'VIE103': 'VIE103',
  'PDP102': 'PDP102',
  'COM108': 'COM108',
  'ITI101': 'ITI101',
  'VIE104': 'VIE104',
  'VIE109': 'VIE104',
  'ENT112': 'ENT1128',
  'ENT1128': 'ENT1128',
  'COM201': 'COM2012',
  'COM2012': 'COM2012',
  'WEB101': 'WEB1013',
  'WEB1013': 'WEB1013',
  'ENT12': 'ENT1227',
  'ENT123': 'ENT1227',
  'ENT1227': 'ENT1227',
  'WEB104': 'WEB1043',
  'WEB1043': 'WEB1043',
  'WEB108': 'WEB108',
  'ENT21': 'ENT2127',
  'ENT213': 'ENT2127',
  'ENT2127': 'ENT2127',
  'VIE108': 'VIE1016',
  'VIE1016': 'VIE1016',
  'WEB302': 'WEB3023',
  'WEB3023': 'WEB3023',
  'WEB201': 'WEB2014',
  'WEB2014': 'WEB2014',
  'VIE102': 'VIE1026',
  'VIE1026': 'VIE1026',
  'PDP103': 'PDP103',
  'WEB105': 'WEB105',
  'WEB204': 'WEB2041',
  'WEB2041': 'WEB2041',
  'ENT22': 'ENT2227',
  'ENT223': 'ENT2227',
  'ENT2227': 'ENT2227',
  'WEB102': 'WEB1023',
  'WEB1023': 'WEB1023',
  'WEB205': 'WEB2053',
  'WEB2055': 'WEB2053',
  'WEB2053': 'WEB2053',
  'WEB501': 'WEB501',
  'WEB206': 'WEB2064',
  'WEB2063': 'WEB2064',
  'WEB2064': 'WEB2064',
  'PRO101': 'PRO1014',
  'PRO1014': 'PRO1014',
  'WEB503': 'WEB503',
  'WEB502': 'WEB502',
  'PDP104': 'PDP104',
  'SYB301': 'SYB3013',
  'SYB3013': 'SYB3013',
  'WEB208': 'WEB2081',
  'WEB2081': 'WEB2081',
  'WEB209': 'WEB2091',
  'WEB2091': 'WEB2091',
  'PRO11': 'PRO116',
  'PRO116': 'PRO116',
  'PRO22': 'PRO220',
  'PRO220': 'PRO220',
  'PRO2201': 'PRO220',
  'ENT111': 'ENT1128',
  'ENT11': 'ENT1128'
};

const staticCourseCodeToNameMap = {
  'COM1071': 'Tin học',
  'VIE103': 'Giáo dục thể chất',
  'PDP102': 'Kỹ năng học tập',
  'COM108': 'Nhập môn lập trình',
  'ITI101': 'Nhập môn Công nghệ thông tin',
  'VIE104': 'Giáo dục quốc phòng',
  'ENT1128': 'Tiếng Anh 1.1',
  'COM2012': 'Cơ sở dữ liệu',
  'WEB1013': 'Xây dựng trang Web',
  'ENT1227': 'Tiếng Anh 1.2',
  'WEB1043': 'Lập trình cơ sở với JavaScript',
  'WEB108': 'Lập trình PHP cơ bản',
  'ENT2127': 'Tiếng Anh 2.1',
  'VIE1016': 'Chính trị',
  'WEB3023': 'Thiết kế Web với HTML5 & CSS3',
  'WEB2014': 'Lập trình PHP 1',
  'VIE1026': 'Pháp luật',
  'PDP103': 'Kỹ năng phát triển bản thân',
  'WEB105': 'Thiết kế UI/UX',
  'WEB2041': 'Dự án mẫu',
  'ENT2227': 'Tiếng Anh 2.2',
  'WEB1023': 'Quản trị website',
  'WEB2053': 'Marketing trên Internet',
  'WEB501': 'Lập trình ECMAScript',
  'WEB2064': 'Lập trình Javascript nâng cao',
  'PRO1014': 'Dự án 1',
  'WEB503': 'NodeJS & Restful Web Service',
  'WEB502': 'Lập trình TypeScript',
  'PDP104': 'Kỹ năng làm việc',
  'SYB3013': 'Khởi sự doanh nghiệp',
  'WEB2081': 'Lập trình Front-End Framework 1',
  'WEB2091': 'Lập trình Front-End Framework 2',
  'PRO116': 'Thực tập tốt nghiệp',
  'PRO220': 'Dự án tốt nghiệp'
};

const courseNameToCodeMap = {
  'tin học': 'COM1071',
  'nhập môn lập trình': 'COM108',
  'tiếng anh 1.1': 'ENT1128',
  'nhập môn công nghệ thông tin': 'ITI101',
  'nhập môn cntt': 'ITI101',
  'kỹ năng học tập': 'PDP102',
  'giáo dục thể chất': 'VIE103',
  'giáo dục thể chất - vovinam': 'VIE103',
  'vovinam': 'VIE103',
  'cơ sở dữ liệu': 'COM2012',
  'csdl': 'COM2012',
  'tiếng anh 1.2': 'ENT1227',
  'giáo dục chính trị': 'VIE1016',
  'chính trị': 'VIE1016',
  'xây dựng trang web': 'WEB1013',
  'lập trình cơ sở với javascript': 'WEB1043',
  'lập trình cơ sở với js': 'WEB1043',
  'lập trình php cơ bản': 'WEB108',
  'tiếng anh 2.1': 'ENT2127',
  'kỹ năng phát triển bản thân': 'PDP103',
  'thiết kế ui/ux': 'WEB105',
  'lập trình php 1': 'WEB2014',
  'dự án mẫu': 'WEB2041',
  'dự án mẫu (tktw)': 'WEB2041',
  'thiết kế web với html5 & css3': 'WEB3023',
  'thiết kế web với html5&css3': 'WEB3023',
  'tiếng anh 2.2': 'ENT2227',
  'dự án 1': 'PRO1014',
  'dự án 1 (tktw)': 'PRO1014',
  'quản trị website': 'WEB1023',
  'marketing trên internet': 'WEB2053',
  'lập trình javascript nâng cao': 'WEB2064',
  'lập trình js nâng cao': 'WEB2064',
  'lập trình ecmascript': 'WEB501',
  'kỹ năng làm việc': 'PDP104',
  'khởi sự doanh nghiệp': 'SYB3013',
  'lập trình front-end framework 1': 'WEB2081',
  'lập trình front-end framework 2': 'WEB2091',
  'lập trình typescript': 'WEB502',
  'nodejs & restful web service': 'WEB503',
  'thực tập tốt nghiệp': 'PRO116',
  'thực tập tốt nghiệp (tktw)': 'PRO116',
  'dự án tốt nghiệp': 'PRO220',
  'dự án tốt nghiệp (tktw-single page application)': 'PRO220',
  'pháp luật': 'VIE1026',
  'giáo dục quốc phòng': 'VIE104',
  'gdqp': 'VIE104'
};

// In-memory cache for course aliases
let courseAliasesMap = new Map();
let courseCodeToNameMap = new Map();

function resolveToSubjectName(input, pretrainedSubjects = []) {
  if (!input) return null;
  const raw = String(input).trim();
  
  // 1. Resolve standard backend code (e.g. COM107 -> COM1071)
  const code = resolveBackendCourseCode(raw);
  
  // 2. Look up in the dynamic courseCodeToNameMap loaded from DB
  let name = null;
  if (code) {
    const codeUpper = code.toUpperCase();
    if (courseCodeToNameMap.has(codeUpper)) {
      name = courseCodeToNameMap.get(codeUpper);
    } else {
      // Static fallback if cache not loaded yet (e.g. during test scripts)
      name = staticCourseCodeToNameMap[codeUpper] || null;
    }
  }
  
  if (name) {
    return mapToPretrainedSubject(name, pretrainedSubjects);
  }
  
  // 4. Otherwise, fallback to smart name fuzzy mapping
  return mapToPretrainedSubject(raw, pretrainedSubjects);
}

async function initCourseAliases() {
  const { prisma } = require('../infrastructure/database/prisma');
  try {
    console.log('[CourseAlias] Synchronizing default course aliases to database...');
    const defaultAliases = [];
    
    // Seed from courseNameToCodeMap
    for (const [name, code] of Object.entries(courseNameToCodeMap)) {
      defaultAliases.push({
        aliasCode: name.toLowerCase(),
        courseCode: code,
        source: 'SYSTEM'
      });
    }
    
    // Seed from courseCodeNormalizationMap
    for (const [code, canonical] of Object.entries(courseCodeNormalizationMap)) {
      defaultAliases.push({
        aliasCode: code.toLowerCase(),
        courseCode: canonical,
        source: 'SYSTEM'
      });
    }
    
    // Seed using a transaction of upserts for cross-version compatibility
    await prisma.$transaction(
      defaultAliases.map(item => 
        prisma.courseAlias.upsert({
          where: { aliasCode: item.aliasCode },
          update: {},
          create: item
        })
      )
    );
    console.log(`[CourseAlias] Synchronized ${defaultAliases.length} aliases.`);
    
    // Load from DB
    await refreshCourseAliases();
  } catch (err) {
    console.error('[CourseAlias] Error initializing aliases:', err.message);
  }
}

async function refreshCourseAliases() {
  try {
    const dbAliases = await prisma.courseAlias.findMany();
    courseAliasesMap.clear();
    dbAliases.forEach(a => {
      courseAliasesMap.set(a.aliasCode.toLowerCase(), a.courseCode);
    });
    console.log(`[CourseAlias] Loaded ${courseAliasesMap.size} aliases from database.`);

    // Load courses dynamically to build code-to-name mapping from Course table (SSOT)
    const dbCourses = await prisma.course.findMany();
    courseCodeToNameMap.clear();
    dbCourses.forEach(c => {
      courseCodeToNameMap.set(c.id.toUpperCase(), c.name);
    });
    console.log(`[CourseAlias] Loaded ${courseCodeToNameMap.size} course names dynamically from database.`);
  } catch (err) {
    console.error('[CourseAlias] Error refreshing aliases:', err.message);
  }
}

function resolveBackendCourseCode(input) {
  if (!input) return null;
  const raw = String(input).trim();
  const rawUpper = raw.toUpperCase();
  const rawLower = raw.toLowerCase();

  // 1. Check static map exact match
  if (courseNameToCodeMap[rawLower]) {
    return courseNameToCodeMap[rawLower];
  }

  // 2. Check static map by iterating for exact case-insensitive match
  for (const [name, code] of Object.entries(courseNameToCodeMap)) {
    if (name.toLowerCase() === rawLower) {
      return code;
    }
  }

  // 3. Check dynamic courseAliasesMap for exact match
  for (const [alias, code] of courseAliasesMap.entries()) {
    if (alias.toLowerCase() === rawLower) {
      return code;
    }
  }

  // 4. Check dynamic courseCodeToNameMap for exact name match
  for (const [code, name] of courseCodeToNameMap.entries()) {
    if (name.toLowerCase() === rawLower) {
      return code;
    }
  }

  return rawUpper;
}

module.exports = {
  parseScore,
  mapToPretrainedSubject,
  validateAndCleanData,
  getCourseCredits,
  calculateOfficialGPA,
  calculateDelayScore,
  resolveBackendCourseCode,
  resolveToSubjectName,
  initCourseAliases,
  refreshCourseAliases,
  isConditionalCourse,
  isEnglishCourse
};

