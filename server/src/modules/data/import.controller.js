const xlsx = require('xlsx');
const prisma = require('../../infrastructure/database/prisma');
const logger = require('../../infrastructure/logger');

// Helper to calculate final score if quiz/asm/final provided
const calculateScore = (row) => {
  if (row.score !== undefined) return parseFloat(row.score);
  if (row.value !== undefined) return parseFloat(row.value);
  
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
      const rawCourse = row.course || row.courseId || row['Mã môn'] || row['Mã chuyển đổi'] || row['Môn học'];
      const course = typeof rawCourse === 'string' ? rawCourse.trim().toUpperCase() : rawCourse;
      const semester = row.semester || row['Học kỳ'] || row['Học Kỳ'] || 'SP26';
      
      let calculatedScore = calculateScore(row);
      // FPT format fallback
      if (calculatedScore === null) {
        if (row['Thang điểm 10'] !== undefined && row['Thang điểm 10'] !== '') {
          calculatedScore = parseFloat(row['Thang điểm 10']);
        }
      }

      // Trạng thái parsing
      let rowStatus = null;
      const trangThai = row['Trạng thái'] || row['Trạng Thái'] || row.status;
      if (trangThai) {
        const t = String(trangThai).toLowerCase().trim();
        if (t === 'studying' || t === 'đang học') rowStatus = 'STUDYING';
        else if (t === 'not started' || t === 'chưa học') rowStatus = 'NOT_STARTED';
        else if (t === 'passed' || t === 'đạt') rowStatus = 'PASSED';
        else if (t === 'failed' || t === 'trượt') rowStatus = 'FAILED';
      }

      // If studying or not started, we don't strictly require a score and score should be null
      if (rowStatus === 'STUDYING' || rowStatus === 'NOT_STARTED') {
        calculatedScore = null;
      }
      
      const errors = [];
      
      if (!mssv) errors.push('Thiếu MSSV (bạn có thể nhập tay ở ô MSSV)');
      if (!course) errors.push('Thiếu Mã môn học');
      else if (!courseSet.has(course.toLowerCase())) errors.push(`Môn học ${course} không tồn tại trong hệ thống`);
      
      if (calculatedScore === null && rowStatus !== 'STUDYING' && rowStatus !== 'NOT_STARTED') {
        errors.push('Thiếu dữ liệu điểm');
      } else if (calculatedScore !== null && (isNaN(calculatedScore) || calculatedScore < 0 || calculatedScore > 10)) {
        errors.push(`Điểm không hợp lệ: ${calculatedScore}`);
      }

      if (errors.length > 0) hasErrors = true;

      previewData.push({
        _row: rowNum,
        mssv: mssv ? String(mssv).toUpperCase() : 'N/A',
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
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu để publish' });
    }

    // Only process valid rows
    const validData = data.filter(r => r.isValid);
    if (validData.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu hợp lệ để publish' });
    }

    const uniqueStudents = new Set();
    
    // Wrap in a transaction or process sequentially
    for (const row of validData) {
      uniqueStudents.add(row.mssv);
      
      // Upsert Student (assuming basic name if not exists)
      await prisma.student.upsert({
        where: { mssv: row.mssv },
        update: {},
        create: {
          mssv: row.mssv,
          name: `Sinh viên ${row.mssv}`,
          classCode: 'UNKNOWN'
        }
      });

      // Insert/Update Score
      let status = row.rowStatus;
      if (!status) {
        status = row.score >= 5 ? 'PASSED' : 'FAILED';
      }
      
      // Since MSSV, CourseId, Semester is unique constraint in DB
      const existingScore = await prisma.score.findFirst({
        where: {
          mssv: row.mssv,
          courseId: row.course,
          semester: row.semester
        }
      });

      if (existingScore) {
        await prisma.score.update({
          where: { id: existingScore.id },
          data: {
            value: row.score,
            status: status,
            quiz: row.quiz !== undefined ? parseFloat(row.quiz) : null,
            asm1: row.asm !== undefined ? parseFloat(row.asm) : null,
            final: row.final !== undefined ? parseFloat(row.final) : null,
            lab: row.lab !== undefined ? parseFloat(row.lab) : null,
            assignment: row.assignment !== undefined ? parseFloat(row.assignment) : null,
            attendance: row.attendance !== undefined ? parseFloat(row.attendance) : (existingScore.attendance || 100)
          }
        });
      } else {
        await prisma.score.create({
          data: {
            mssv: row.mssv,
            courseId: row.course,
            value: row.score,
            attendance: row.attendance !== undefined ? parseFloat(row.attendance) : 100,
            quiz: row.quiz !== undefined ? parseFloat(row.quiz) : null,
            asm1: row.asm !== undefined ? parseFloat(row.asm) : null,
            final: row.final !== undefined ? parseFloat(row.final) : null,
            lab: row.lab !== undefined ? parseFloat(row.lab) : null,
            assignment: row.assignment !== undefined ? parseFloat(row.assignment) : null,
            semester: row.semester,
            status: status
          }
        });
      }
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
      message: `Đã import thành công ${validData.length} bản ghi. AI đang phân tích dữ liệu...`,
      studentsAffected: uniqueStudents.size
    });

  } catch (error) {
    logger.error('Publish data error:', error);
    res.status(500).json({ error: 'Lỗi lưu dữ liệu vào hệ thống', details: error.message });
  }
};
