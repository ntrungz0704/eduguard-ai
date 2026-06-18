const fs = require('fs');
const path = require('path');
const { calculateFptGPA } = require('./dataService');

/**
 * Runs 9 comprehensive data integrity checks on the database state.
 * Can be run against the main prisma client or a transaction instance (tx).
 * 
 * @param {object} tx - Prisma client or transaction instance
 * @param {boolean} isRollbackOnErrors - If true, throws an error if errors > 0
 * @returns {Promise<{success: boolean, errorsCount: number, warningsCount: number, report: object}>}
 */
async function checkDatabaseIntegrity(tx, isRollbackOnErrors = true) {
  const errors = [];
  const warnings = [];

  try {
    // 1. Fetch all data using the transaction instance to see uncommitted changes
    const students = await tx.student.findMany({
      include: {
        scores: {
          include: {
            course: true
          }
        }
      }
    });

    const courses = await tx.course.findMany({
      select: { id: true }
    });
    const courseIdsSet = new Set(courses.map(c => c.id.toLowerCase()));
    
    // Check 1: Duplicate Student (case-insensitive MSSV)
    const seenMssvs = new Set();
    students.forEach(s => {
      const mssvLower = s.mssv.toLowerCase();
      if (seenMssvs.has(mssvLower)) {
        errors.push(`[DUPLICATE_STUDENT] MSSV '${s.mssv}' bị trùng lặp trong hệ thống.`);
      }
      seenMssvs.add(mssvLower);
    });

    // Check 2: Duplicate Scores within Database
    const seenScoreKeys = new Set();
    students.forEach(st => {
      st.scores.forEach(s => {
        const scoreKey = `${s.mssv.toLowerCase()}_${s.courseId.toLowerCase()}_${String(s.semester || '').toLowerCase()}`;
        if (seenScoreKeys.has(scoreKey)) {
          errors.push(`[DUPLICATE_SCORE] Điểm trùng lặp phát hiện cho sinh viên '${s.mssv}' môn '${s.courseId}' học kỳ '${s.semester || 'N/A'}'.`);
        }
        seenScoreKeys.add(scoreKey);
      });
    });

    // Auditing students and scores
    students.forEach(student => {
      const mssv = student.mssv;
      const scores = student.scores || [];

      // Check 3: Invalid GPA Recalculation
      let gpa = 0;
      try {
        const gpaObj = calculateFptGPA(scores);
        gpa = gpaObj.gpa;
        if (isNaN(gpa) || gpa < 0 || gpa > 10) {
          errors.push(`[INVALID_GPA] Sinh viên '${mssv}' có điểm trung bình (GPA) không hợp lệ hoặc nằm ngoài khoảng [0, 10]: ${gpa}`);
        }
      } catch (err) {
        errors.push(`[INVALID_GPA] Không thể tính toán GPA cho sinh viên '${mssv}': ${err.message}`);
      }

      // Check 4 & 5: Orphan Course & Orphan Student
      scores.forEach(s => {
        // Orphan Course check
        if (!s.courseId) {
          errors.push(`[ORPHAN_COURSE] Điểm ID '${s.id}' của sinh viên '${mssv}' không chứa mã môn học (courseId).`);
        } else if (!courseIdsSet.has(s.courseId.toLowerCase())) {
          errors.push(`[ORPHAN_COURSE] Điểm của sinh viên '${mssv}' chứa mã môn học không tồn tại trong bảng Course: '${s.courseId}'`);
        }

        // Orphan Student check
        if (!s.mssv) {
          errors.push(`[ORPHAN_STUDENT] Điểm ID '${s.id}' không có thông tin MSSV.`);
        } else if (s.mssv.toLowerCase() !== mssv.toLowerCase()) {
          errors.push(`[ORPHAN_STUDENT] Lỗi liên kết: Điểm ID '${s.id}' chứa mssv '${s.mssv}' nhưng thuộc về sinh viên '${mssv}'`);
        }

        // Check 7: Semester Mismatch (empty/null)
        if (!s.semester || String(s.semester).trim() === '') {
          errors.push(`[SEMESTER_MISMATCH] Điểm môn '${s.courseId}' của sinh viên '${mssv}' không có học kỳ (semester).`);
        }

        // Check 8: Null score with PASSED/FAILED status
        if (s.value === null && (s.status === 'PASSED' || s.status === 'FAILED')) {
          errors.push(`[NULL_SCORE] Môn '${s.courseId}' của sinh viên '${mssv}' có trạng thái '${s.status}' nhưng điểm số lại là NULL.`);
        }

        // Check 9: Score > 10 or < 0
        if (s.value !== null && (s.value < 0 || s.value > 10)) {
          errors.push(`[SCORE_OUT_OF_BOUNDS] Môn '${s.courseId}' của sinh viên '${mssv}' có điểm ngoài khoảng [0, 10]: ${s.value}`);
        }
      });

      // Check 6: Credit Mismatch (Sum of credits of passed courses)
      try {
        const gpaObj = calculateFptGPA(scores);
        const calculatedCredits = gpaObj.totalCredits;

        // Verify that passed courses indeed sum to the calculated credits
        let passedCreditsSum = 0;
        scores.forEach(s => {
          if (s.value !== null && (s.value >= 5.0 || s.value === 1.0 || s.status === 'PASSED')) {
            const credits = s.course?.credits || 0;
            passedCreditsSum += credits;
          }
        });

        if (calculatedCredits !== passedCreditsSum) {
          warnings.push(`[CREDIT_MISMATCH] Mismatch credits sum for '${mssv}': FptGPA credit count is ${calculatedCredits}, but manually summed passed courses credit is ${passedCreditsSum}`);
        }
      } catch (err) {
        warnings.push(`[CREDIT_CHECK_FAILED] Không thể kiểm tra credit của sinh viên '${mssv}': ${err.message}`);
      }
    });

  } catch (globalErr) {
    errors.push(`[GLOBAL_AUDIT_ERROR] Lỗi hệ thống khi thực hiện kiểm tra tính toàn vẹn: ${globalErr.message}`);
  }

  const errorsCount = errors.length;
  const warningsCount = warnings.length;
  const success = errorsCount === 0;

  const report = {
    timestamp: new Date().toISOString(),
    status: success ? 'SUCCESS' : 'FAILED',
    errorsCount,
    warningsCount,
    errors,
    warnings
  };

  // Write report.json to project root
  try {
    const reportPath = path.resolve(__dirname, '../../../../integrity_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`[IntegrityVerify] Integrity report written to: ${reportPath}`);
  } catch (fsErr) {
    console.error('[IntegrityVerify] Failed to write integrity report file:', fsErr.message);
  }

  if (errorsCount > 0 && isRollbackOnErrors) {
    throw new Error(`[DATA_INTEGRITY_VIOLATION] Phát hiện ${errorsCount} lỗi toàn vẹn dữ liệu. Giao dịch đã bị rollback để bảo vệ DB. Chi tiết xem file integrity_report.json.`);
  }

  return {
    success,
    errorsCount,
    warningsCount,
    report
  };
}

module.exports = {
  checkDatabaseIntegrity
};
