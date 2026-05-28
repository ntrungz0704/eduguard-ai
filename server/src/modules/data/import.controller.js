const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../utils/logger');
const { performInference } = require('../prediction/services/inference.service');

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

    // Read the Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(sheet);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'File Excel rỗng' });
    }

    const previewData = [];
    const validationErrors = [];
    let hasErrors = false;

    // Fetch existing courses to validate
    const existingCourses = await prisma.course.findMany({ select: { id: true } });
    const courseSet = new Set(existingCourses.map(c => c.id));

    data.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header
      const mssv = row.student_code || row.mssv;
      const course = row.course || row.courseId;
      const calculatedScore = calculateScore(row);
      const semester = row.semester || 'SP26'; // Default if not provided
      
      const errors = [];
      
      if (!mssv) errors.push('Thiếu MSSV');
      if (!course) errors.push('Thiếu Môn học');
      else if (!courseSet.has(course)) errors.push(`Môn học ${course} không tồn tại trong hệ thống`);
      
      if (calculatedScore === null) errors.push('Thiếu dữ liệu điểm');
      else if (isNaN(calculatedScore) || calculatedScore < 0 || calculatedScore > 10) {
        errors.push(`Điểm không hợp lệ: ${calculatedScore}`);
      }

      if (errors.length > 0) hasErrors = true;

      previewData.push({
        _row: rowNum,
        mssv: mssv || 'N/A',
        course: course || 'N/A',
        quiz: row.quiz,
        asm: row.asm,
        final: row.final,
        score: calculatedScore ? parseFloat(calculatedScore.toFixed(2)) : null,
        semester,
        errors,
        isValid: errors.length === 0
      });
    });

    res.json({
      success: true,
      totalRows: data.length,
      validRows: previewData.filter(r => r.isValid).length,
      invalidRows: previewData.filter(r => !r.isValid).length,
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
      const status = row.score >= 5 ? 'PASSED' : 'FAILED';
      
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
            status: status
          }
        });
      } else {
        await prisma.score.create({
          data: {
            mssv: row.mssv,
            courseId: row.course,
            value: row.score,
            attendance: 100, // mock attendance
            semester: row.semester,
            status: status
          }
        });
      }
    }

    // Trigger AI predictions for updated students in background
    setTimeout(async () => {
      try {
        logger.info(`Triggering AI predictions for ${uniqueStudents.size} students after data import`);
        for (const mssv of uniqueStudents) {
          await performInference(mssv);
        }
        logger.info('Completed AI predictions batch from import.');
      } catch (err) {
        logger.error('Error in background AI prediction batch:', err);
      }
    }, 1000); // 1 second delay to return response quickly

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
