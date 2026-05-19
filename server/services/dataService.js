const XLSX = require('xlsx');

// ============================================================
// PARSE SCORE: handle *, X, empty, number, -
// ============================================================
function parseScore(val) {
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).trim();
  if (s === '*' || s === 'X' || s === '-' || s === 'F' || s === '1.0' || s === '1') return null;
  const n = parseFloat(s);
  if (isNaN(n) || n === 1.0 || n === 1) return null;
  return n;
}

// ============================================================
// SMART SUBJECT NAME MAPPING (Excel -> Pre-trained Subject)
// Handles suffixes like (TKTW), - Vovinam, spacing mismatches in & / and
// ============================================================
function mapToPretrainedSubject(excelSubName, pretrainedSubjects = []) {
  if (!excelSubName) return null;
  const excelClean = excelSubName.trim();
  
  if (pretrainedSubjects.length === 0) return excelClean;

  // 1. Direct exact match
  if (pretrainedSubjects.includes(excelClean)) {
    return excelClean;
  }
  
  // Standardized regex pipeline order for extremely robust fuzzy matching
  const norm = (s) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // 1. Strip accents first
    .replace(/đ/g, 'd')              // 2. Convert đ to d
    .replace(/\(.*?\)/g, '')         // 3. Remove parenthesis details
    .replace(/[&\-_/]/g, ' ')        // 4. Replace special chars with spaces
    .replace(/\s+/g, '')             // 5. Finally strip all whitespace
    .trim();
    
  const excelNorm = norm(excelClean);
  
  // 2. Try fuzzy match in pretrained list
  const fuzzyMatch = pretrainedSubjects.find(ps => {
    const psNorm = norm(ps);
    return psNorm === excelNorm || psNorm.includes(excelNorm) || excelNorm.includes(psNorm);
  });
  
  if (fuzzyMatch) return fuzzyMatch;
  
  // 3. Special Known Handled Fallbacks
  const lowerExcel = excelClean.toLowerCase();
  if (lowerExcel.includes('vovinam') && pretrainedSubjects.includes('Giáo dục thể chất')) {
    return 'Giáo dục thể chất';
  }
  if (lowerExcel.includes('chinh tri') || lowerExcel.includes('chính trị')) {
    if (pretrainedSubjects.includes('Chính trị')) return 'Chính trị';
  }
  
  return excelClean; // Return original if no match found
}

// ============================================================
// DATA CLEANING & VALIDATION PIPELINE
// ============================================================
function validateAndCleanData(parsedRows, headers, fileType, pretrainedSubjects = []) {
  const errors = [];
  const validStudents = [];
  let subjectCols = [];

  // Helper to normalize header names for robust fuzzy detection
  const normHeader = (h) => String(h || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D') // Convert Vietnamese Đ to standard D
    .replace(/\s+/g, '');

  if (fileType === 'transcript') {
    // PERSONAL TRANSCRIPT MODE (1 Student)
    const subjectCol = headers.find(h => {
      const nh = normHeader(h);
      return nh.includes('MON') || nh.includes('SUBJECT');
    });
    
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
      let sub = String(row[subjectCol] || '').trim();
      if (!sub) return;

      // Smart map the subject name to match pre-trained subjects
      sub = mapToPretrainedSubject(sub, pretrainedSubjects);

      let score = parseScore(row[scoreCol]);
      
      // ============================================================
      // CRITICAL FIX: If a score is empty (null/undefined) or exactly 0,
      // we ALWAYS treat it as missing (null) for personal transcripts.
      // This allows instructors to delete any grade to test and verify predictions.
      // ============================================================
      if (score === null || score === undefined || score === 0) {
        score = null;
      } else if (statusCol) {
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

      scores[sub] = score;
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
    rawSubjectCols.forEach(rs => {
      const matched = mapToPretrainedSubject(rs, pretrainedSubjects);
      if (!subjectCols.includes(matched)) {
        subjectCols.push(matched);
      }
    });

    parsedRows.forEach((row, index) => {
      const id = String(row[idCol] || '').trim();
      
      if (!id) {
        errors.push(`Dòng ${index + 2}: Thiếu MSSV`);
        return; 
      }

      const name = nameCol && row[nameCol] ? String(row[nameCol]).trim() : undefined;

      const scores = {};
      rawSubjectCols.forEach(rs => {
        const matchedSub = mapToPretrainedSubject(rs, pretrainedSubjects);
        scores[matchedSub] = parseScore(row[rs]);
      });

      validStudents.push({ id, name, scores });
    });
  }

  return { validStudents, errors, subjectCols, fileType };
}

// ============================================================
// CALCULATE GPA: FPT POLYTECHNIC WEIGHTED FORMULA
// ============================================================
function calculateFptGPA(scores) {
  if (!scores) return 0.0;

  const isConditionalCourse = (courseName, courseId) => {
    const name = (courseName || '').toLowerCase();
    const cid = (courseId || '').toUpperCase();
    return (
      name.includes('thể chất') ||
      name.includes('quốc phòng') ||
      name.includes('thực tập tốt nghiệp') ||
      name.includes('vovinam') ||
      cid.includes('VIE103') ||
      cid.includes('VIE104') ||
      cid.includes('PRO110')
    );
  };

  let totalScoreWeight = 0;
  let totalCredits = 0;

  if (Array.isArray(scores)) {
    const validScores = scores.filter(s => s.value !== null);
    const academicScores = validScores.filter(s => !isConditionalCourse(s.course?.name || s.courseId, s.courseId));

    academicScores.forEach(s => {
      const credits = s.course?.credits || 3;
      totalScoreWeight += (s.value * credits);
      totalCredits += credits;
    });
  } else {
    Object.entries(scores).forEach(([courseId, val]) => {
      if (val === null || val === undefined) return;
      if (isConditionalCourse('', courseId)) return;

      const credits = 3;
      totalScoreWeight += (val * credits);
      totalCredits += credits;
    });
  }

  return totalCredits === 0 ? 0.0 : parseFloat((totalScoreWeight / totalCredits).toFixed(1));
}

module.exports = {
  parseScore,
  mapToPretrainedSubject,
  validateAndCleanData,
  calculateFptGPA
};
