const xlsx = require('xlsx');
const { prisma } = require('../../infrastructure/database/prisma');
const logger = require('../../infrastructure/logger');
const { resolveBackendCourseCode } = require('../../utils/dataService');

// Helper to calculate final score if quiz/asm/final provided
const calculateScore = (row) => {
  const parseVal = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const s = String(val).trim();
    if (s === '*' || s === 'X' || s === '-' || s === 'F') return null;
    const lower = s.toLowerCase();
    if (lower === 'đạt' || lower === 'passed' || lower === 'miễn') return 1.0;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  if (row.score !== undefined) return parseVal(row.score);
  if (row.value !== undefined) return parseVal(row.value);
  if (row['Tổng kết'] !== undefined) return parseVal(row['Tổng kết']);
  if (row['Điểm tổng kết'] !== undefined) return parseVal(row['Điểm tổng kết']);
  if (row['Thang điểm 10'] !== undefined) return parseVal(row['Thang điểm 10']);
  
  const quiz = parseFloat(row.quiz) || 0;
  const asm = parseFloat(row.asm) || 0;
  const final = parseFloat(row.final) || 0;
  
  if (row.quiz !== undefined && row.asm !== undefined && row.final !== undefined) {
    return (quiz * 0.2) + (asm * 0.3) + (final * 0.5);
  }
  return null;
};

exports.previewData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file Excel' });
    }

    // Support default MSSV if provided by client (FPT portal transcripts often lack MSSV column)
    const defaultMssv = req.body.mssv || null;

    // Read the Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read raw data as array of arrays to smartly find header row (FPT format has 'Bảng điểm | ...' in row 1)
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ error: 'File Excel rỗng' });
    }

    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const rowStrings = rawData[i].map(cell => String(cell).toLowerCase());
      if (rowStrings.includes('mssv') || rowStrings.includes('course') || rowStrings.includes('mã môn') || rowStrings.includes('môn học') || rowStrings.includes('mã sinh viên')) {
        headerRowIndex = i;
        break;
      }
    }

    // Convert to JSON using the detected header row
    const data = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex });
    
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Không tìm thấy dữ liệu hợp lệ trong file' });
    }

    const previewData = [];
    const validationErrors = [];
    let hasErrors = false;

    // Fetch existing courses to validate
    const existingCourses = await prisma.course.findMany({ select: { id: true } });
    const courseSet = new Set(existingCourses.map(c => c.id.toLowerCase()));

    data.forEach((row, index) => {
      const rowNum = index + headerRowIndex + 2; // +1 for 0-index, +1 for header line
      
      // Auto-detect columns for flexibility
      const mssv = row.student_code || row.mssv || row['MSSV'] || row['Mã sinh viên'] || defaultMssv;
      const rawName = row.name || row.fullname || row.student_name || row['Họ Tên'] || row['Họ tên'] || row['Tên sinh viên'] || row['Tên Sinh Viên'];
      const name = rawName ? String(rawName).trim() : null;
      const rawCourse = row['Mã môn'] || row['Mã chuyển đổi'] || row.courseId || row.course || row['Môn học'] || row['Môn'];
      const course = resolveBackendCourseCode(rawCourse);
      const semester = row.semester || row['Học kỳ'] || row['Học Kỳ'] || 'SP26';
      
      let calculatedScore = calculateScore(row);
      
      // Trạng thái parsing
      let rowStatus = null;
      const trangThai = row['Trạng thái'] || row['Trạng Thái'] || row.status;
      if (trangThai) {
        const t = String(trangThai).toLowerCase().trim();
        if (t.includes('studying') || t.includes('đang học')) rowStatus = 'STUDYING';
        else if (t.includes('not started') || t.includes('chưa học')) rowStatus = 'NOT_STARTED';
        else if (t.includes('passed') || t.includes('đạt')) rowStatus = 'PASSED';
        else if (t.includes('failed') || t.includes('trượt')) rowStatus = 'FAILED';
      }

      // FPT format fallback
      if (calculatedScore === null) {
        if (row['Thang điểm 10'] !== undefined && row['Thang điểm 10'] !== '') {
          const rawVal = row['Thang điểm 10'];
          const s = String(rawVal).trim().toLowerCase();
          if (s === 'đạt' || s === 'passed' || s === 'miễn') {
            calculatedScore = 1.0;
            rowStatus = 'PASSED';
          } else {
            calculatedScore = parseFloat(rawVal);
          }
        }
      }

      // If studying or not started, we don't strictly require a score and score should be null
      if (rowStatus === 'STUDYING' || rowStatus === 'NOT_STARTED') {
        calculatedScore = null;
      }
      
      const errors = [];
      
      if (!mssv) errors.push('Thiếu MSSV (bạn có thể nhập tay ở ô MSSV)');
      if (!course) {
        errors.push('Thiếu Mã môn học');
      } else if (!courseSet.has(course.toLowerCase())) {
        errors.push(`Mã môn '${course}' không nằm trong 34 môn học chuẩn của syllabus`);
      }
      
      if (calculatedScore === null && rowStatus !== 'STUDYING' && rowStatus !== 'NOT_STARTED') {
        errors.push('Thiếu dữ liệu điểm');
      } else if (calculatedScore !== null && (isNaN(calculatedScore) || calculatedScore < 0 || calculatedScore > 10)) {
        errors.push(`Điểm không hợp lệ: ${calculatedScore}`);
      }

      if (errors.length > 0) hasErrors = true;

      previewData.push({
        _row: rowNum,
        mssv: mssv ? String(mssv).trim().toUpperCase() : 'N/A',
        name,
        course: course || 'N/A',
        quiz: row.quiz,
        asm: row.asm,
        final: row.final,
        score: calculatedScore !== null && !isNaN(calculatedScore) ? parseFloat(calculatedScore.toFixed(2)) : null,
        semester: String(semester).trim(),
        rowStatus,
        errors,
        isValid: errors.length === 0
      });
    });

    const validRowsCount = previewData.filter(r => r.isValid).length;
    const invalidRowsCount = previewData.filter(r => !r.isValid).length;

    global.latestImportStatus = {
      totalRows: data.length,
      validRows: validRowsCount,
      invalidRows: invalidRowsCount,
      hasErrors,
      timestamp: Date.now(),
      status: 'PREVIEWED'
    };

    res.json({
      success: true,
      totalRows: data.length,
      validRows: validRowsCount,
      invalidRows: invalidRowsCount,
      hasErrors,
      data: previewData
    });

  } catch (error) {
    logger.error('Excel parse error:', error);
    res.status(500).json({ error: 'Lỗi xử lý file Excel', details: error.message });
  }
};

exports.publishData = async (req, res) => {
  try {
    const { data, classCode } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu để publish' });
    }

    // Only process valid rows
    const validData = data.filter(r => r.isValid);
    if (validData.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu hợp lệ để publish' });
    }

    // === PRE-TRANSACTION: Normalize all MSSVs and validate all courses ===
    const normalizedRows = validData.map(row => ({
      ...row,
      mssv: String(row.mssv).trim().toUpperCase(),
      course: row.course,
      semester: String(row.semester).trim()
    }));

    // Pre-validate all referenced courses exist BEFORE opening a transaction
    const uniqueCourseIds = [...new Set(normalizedRows.map(r => r.course))];
    const existingCourses = await prisma.course.findMany({
      where: { id: { in: uniqueCourseIds } },
      select: { id: true }
    });
    const validCourseIds = new Set(existingCourses.map(c => c.id));
    for (const courseId of uniqueCourseIds) {
      if (!validCourseIds.has(courseId)) {
        return res.status(400).json({
          error: `Khóa học '${courseId}' không hợp lệ hoặc không thuộc chương trình 34 môn của syllabus.`
        });
      }
    }

    // === TRANSACTION: All-or-nothing database writes ===
    const uniqueStudents = new Set();
    let scoresInserted = 0;
    let scoresUpdated = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of normalizedRows) {
        const mssv = row.mssv;
        uniqueStudents.add(mssv);

        // Upsert Student
        await tx.student.upsert({
          where: { mssv },
          update: {
            ...(row.name ? { name: row.name } : {}),
            ...(classCode ? { classCode } : {})
          },
          create: {
            mssv,
            name: row.name || `Sinh viên ${mssv}`,
            classCode: classCode || 'UNKNOWN'
          }
        });

        // Determine status and score value
        let status = row.rowStatus;
        let scoreValue = row.score;

        if (status === 'STUDYING' || status === 'NOT_STARTED') {
          // STUDYING/NOT_STARTED: score MUST be null regardless of input
          scoreValue = null;
        } else if (!status) {
          // No explicit status: derive from score
          if (scoreValue === null || scoreValue === undefined) {
            status = 'STUDYING'; // No score and no status → default to STUDYING
            scoreValue = null;
          } else {
            status = (scoreValue >= 5.0 || scoreValue === 1.0) ? 'PASSED' : 'FAILED';
          }
        }
        // else: explicit PASSED/FAILED status — keep scoreValue as-is

        // Check if record already exists for counting inserted vs updated
        const existingScore = await tx.score.findUnique({
          where: {
            mssv_courseId_semester: {
              mssv,
              courseId: row.course,
              semester: row.semester
            }
          },
          select: { id: true }
        });

        if (existingScore) {
          scoresUpdated++;
        } else {
          scoresInserted++;
        }

        // Atomic upsert on @@unique([mssv, courseId, semester])
        await tx.score.upsert({
          where: {
            mssv_courseId_semester: {
              mssv,
              courseId: row.course,
              semester: row.semester
            }
          },
          update: {
            value: scoreValue,
            status,
            quiz: row.quiz !== undefined ? parseFloat(row.quiz) : null,
            asm1: row.asm !== undefined ? parseFloat(row.asm) : null,
            final: row.final !== undefined ? parseFloat(row.final) : null,
            lab: row.lab !== undefined ? parseFloat(row.lab) : null,
            assignment: row.assignment !== undefined ? parseFloat(row.assignment) : null,
            attendance: row.attendance !== undefined ? parseFloat(row.attendance) : undefined
          },
          create: {
            mssv,
            courseId: row.course,
            semester: row.semester,
            value: scoreValue,
            status,
            attendance: row.attendance !== undefined ? parseFloat(row.attendance) : 100,
            quiz: row.quiz !== undefined ? parseFloat(row.quiz) : null,
            asm1: row.asm !== undefined ? parseFloat(row.asm) : null,
            final: row.final !== undefined ? parseFloat(row.final) : null,
            lab: row.lab !== undefined ? parseFloat(row.lab) : null,
            assignment: row.assignment !== undefined ? parseFloat(row.assignment) : null
          }
        });
      }
    }); // If ANY row fails, the entire transaction is rolled back

    // === AUDIT LOG ===
    const auditTimestamp = new Date().toISOString();
    const auditUser = req.user?.email || req.user?.username || 'SYSTEM';
    const auditFilename = req.body.filename || 'unknown';
    logger.info(
      `[IMPORT_AUDIT] ${auditTimestamp} | ${auditUser} | ${auditFilename} | ` +
      `studentsAffected=${uniqueStudents.size} | scoresInserted=${scoresInserted} | scoresUpdated=${scoresUpdated}`
    );
    console.log(
      `[IMPORT_AUDIT] ${auditTimestamp} | ${auditUser} | ${auditFilename} | ` +
      `studentsAffected=${uniqueStudents.size} | scoresInserted=${scoresInserted} | scoresUpdated=${scoresUpdated}`
    );

    // === POST-IMPORT INTEGRITY CHECK ===
    const studentMssvList = [...uniqueStudents];
    const [verifyStudentCount, verifyScoreCount] = await Promise.all([
      prisma.student.count({ where: { mssv: { in: studentMssvList } } }),
      prisma.score.count({ where: { mssv: { in: studentMssvList } } })
    ]);
    if (verifyStudentCount < uniqueStudents.size) {
      logger.error(
        `[IMPORT_INTEGRITY] Expected ${uniqueStudents.size} students but found ${verifyStudentCount} after commit.`
      );
    }
    logger.info(
      `[IMPORT_INTEGRITY] Verified: ${verifyStudentCount} students, ${verifyScoreCount} total scores for imported cohort.`
    );

    // Invalidate entire snapshot cache to force SSOT UI refresh
    try {
      const { clearSnapshotCache } = require('../../services/studentSnapshotService');
      clearSnapshotCache();
      const { clearProgramAnalyticsCache } = require('../../ai/engines/dssReportEngine');
      if (typeof clearProgramAnalyticsCache === 'function') {
        clearProgramAnalyticsCache();
      }
    } catch (cacheErr) {
      logger.warn("Lỗi khi xóa cache hệ thống: " + cacheErr.message);
    }

    // Trigger AI predictions for updated students in background
    setTimeout(() => {
      try {
        logger.info(`Triggering AI predictions for ${uniqueStudents.size} students after data import via script...`);
        const { exec } = require('child_process');
        exec('node server/src/scripts/recalculate_predictions.js', { cwd: require('path').join(__dirname, '../../../..') }, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error executing recalculate script: ${error.message}`);
                return;
            }
            if (stderr) {
                logger.error(`stderr from recalculate script: ${stderr}`);
            }
            logger.info(`Completed AI predictions batch from import: ${stdout}`);
        });
      } catch (err) {
        logger.error('Error starting background AI prediction batch:', err);
      }
    }, 1000);

    if (global.latestImportStatus) {
      global.latestImportStatus.status = 'PUBLISHED';
    } else {
      global.latestImportStatus = {
        totalRows: validData.length,
        validRows: validData.length,
        invalidRows: 0,
        hasErrors: false,
        timestamp: Date.now(),
        status: 'PUBLISHED'
      };
    }

    res.json({
      success: true,
      message: `Đã import thành công ${validData.length} bản ghi (${scoresInserted} mới, ${scoresUpdated} cập nhật). AI đang phân tích dữ liệu...`,
      studentsAffected: uniqueStudents.size,
      scoresInserted,
      scoresUpdated
    });

  } catch (error) {
    logger.error('Publish data error:', error);
    res.status(500).json({ error: 'Lỗi lưu dữ liệu vào hệ thống', details: error.message });
  }
};
