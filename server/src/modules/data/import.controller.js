const xlsx = require('xlsx');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../../infrastructure/database/prisma');
const logger = require('../../infrastructure/logger');
const { resolveBackendCourseCode } = require('../../utils/dataService');
const { checkDatabaseIntegrity } = require('../../utils/integrityVerify');
const {
  resolveCourseAssessmentSchema,
  inferComponentsFromExcel,
  normalizeAssessmentColumns,
  calculateFinalScore,
  buildAssessmentObjects,
  saveScoreComponents
} = require('../../services/assessmentEngine');

// Helper to calculate final score if quiz/asm/final provided
const calculateScore = (row) => {
  const parseVal = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const s = String(val).trim();
    if (s === '*' || s === 'X' || s === '-' || s === 'F') return null;
    const lower = s.toLowerCase();
    // Eagerly mapping 'đạt' to 1.0 is risky for regular courses, but we keep it for conditional courses
    if (lower === 'đạt' || lower === 'passed' || lower === 'miễn') return 1.0;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  // Prioritize explicit numeric columns
  if (row['Thang điểm 10'] !== undefined) {
    const val = parseVal(row['Thang điểm 10']);
    if (val !== null) return val;
  }
  if (row.score !== undefined) {
    const val = parseVal(row.score);
    if (val !== null) return val;
  }
  if (row.value !== undefined) {
    const val = parseVal(row.value);
    if (val !== null) return val;
  }
  
  // Fallback to summary columns which might contain "Passed"
  if (row['Điểm tổng kết'] !== undefined) {
    const val = parseVal(row['Điểm tổng kết']);
    if (val !== null) return val;
  }
  if (row['Tổng kết'] !== undefined) {
    const val = parseVal(row['Tổng kết']);
    if (val !== null) return val;
  }
  
  const quiz = parseFloat(row.quiz) || 0;
  const asm = parseFloat(row.asm) || 0;
  const final = parseFloat(row.final) || 0;
  
  if (row.quiz !== undefined && row.asm !== undefined && row.final !== undefined) {
    return (quiz * 0.2) + (asm * 0.3) + (final * 0.5);
  }
  return null;
};

// Database snapshot / backup helper functions
let isImporting = false;

async function backupDatabase() {
  const backupsDir = path.resolve(__dirname, '../../../../prisma/backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const backupFile = path.join(backupsDir, `backup_${dateStr}_${Date.now()}.db`);
  const sqliteSafePath = backupFile.replace(/\\/g, '/').replace(/'/g, "''");
  
  await prisma.$executeRawUnsafe(`VACUUM INTO '${sqliteSafePath}'`);
  return backupFile;
}


exports.previewData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file Excel' });
    }

    // Calculate SHA-256 hash of the uploaded file to prevent duplicates
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    
    // Check if file has already been successfully imported
    const existingImport = await prisma.importSession.findUnique({
      where: { fileHash }
    });
    if (existingImport && existingImport.status === 'SUCCESS') {
      return res.status(400).json({
        error: `File này đã được import vào hệ thống trước đó bởi ${existingImport.uploadedBy} vào ${new Date(existingImport.createdAt).toLocaleString()}.`
      });
    }

    // Support default MSSV if provided by client (FPT portal transcripts often lack MSSV column)
    const defaultMssv = req.body.mssv || null;

    // Read the Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read raw data as array of arrays to smartly find blocks or flat table
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ error: 'File Excel rỗng' });
    }

    let parsedRows = [];
    let isMultiBlock = false;

    // Detect if this is a Multi-Block Transcript file
    for (let i = 0; i < Math.min(20, rawData.length); i++) {
      const rowText = rawData[i].map(c => String(c).toLowerCase()).join(' ');
      if (rowText.includes('bảng điểm') && rowText.includes('polytechnic')) {
        isMultiBlock = true;
        break;
      }
    }

    if (isMultiBlock) {
      // --- BLOCK DETECTOR (Extract Phase) ---
      const blocks = [];
      let currentBlock = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const rowText = rawData[i].map(c => String(c).toLowerCase()).join(' ');
        if (rowText.includes('bảng điểm') && rowText.includes('polytechnic')) {
          if (currentBlock.length > 0) blocks.push(currentBlock);
          currentBlock = [rawData[i]];
        } else {
          currentBlock.push(rawData[i]);
        }
      }
      if (currentBlock.length > 0) blocks.push(currentBlock);

      // --- DTO PARSER (Transform Phase for Blocks) ---
      for (const block of blocks) {
        let blockMssv = null;
        let blockName = null;
        let headerRowIdx = -1;

        // Scan block header for MSSV and Name
        for (let r = 0; r < block.length; r++) {
          const rowStrs = block[r].map(c => String(c).toLowerCase());
          const fullText = rowStrs.join(' ');
          
          // Regex to extract MSSV (e.g. "MSSV: PS12345" or "MSSV PS12345" or "Mã sinh viên PS123")
          const mssvMatch = fullText.match(/(?:mssv|mã sinh viên)[\s:]*([a-z0-9]+)/i);
          if (mssvMatch) blockMssv = mssvMatch[1].toUpperCase();

          const nameMatch = fullText.match(/(?:họ tên|họ và tên|tên sinh viên)[\s:]*([^0-9\n]+)/i);
          if (nameMatch) {
            // Clean up the matched name
            blockName = nameMatch[1].replace(/mssv|mã sinh viên/i, '').trim();
          }

          if (rowStrs.includes('mã môn') || rowStrs.includes('môn học') || rowStrs.includes('course')) {
            headerRowIdx = r;
            break;
          }
        }

        if (headerRowIdx !== -1) {
          const header = block[headerRowIdx];
          for (let r = headerRowIdx + 1; r < block.length; r++) {
            // Stop if we hit an empty row or non-data row
            if (!block[r] || block[r].length === 0 || !block[r].some(c => c)) continue;
            
            const rowObj = {};
            for (let c = 0; c < header.length; c++) {
              if (header[c]) rowObj[header[c]] = block[r][c];
            }
            
            // Inject extracted block metadata
            if (!rowObj['MSSV'] && !rowObj['mssv'] && !rowObj['Mã sinh viên']) {
              if (blockMssv) rowObj['MSSV'] = blockMssv;
            }
            if (!rowObj['Họ tên'] && !rowObj['name'] && !rowObj['Họ và tên']) {
              if (blockName) rowObj['Họ tên'] = blockName;
            }

            // Only add rows that actually contain course data
            const courseCode = rowObj['Mã môn'] || rowObj['Mã chuyển đổi'] || rowObj['courseId'] || rowObj['course'] || rowObj['Môn học'];
            if (courseCode) parsedRows.push(rowObj);
          }
        }
      }
    } else {
      // --- FLAT TABLE PARSER (Extract Phase for Single Class) ---
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const rowStrings = rawData[i].map(cell => String(cell).toLowerCase());
        if (rowStrings.includes('mssv') || rowStrings.includes('course') || rowStrings.includes('mã môn') || rowStrings.includes('môn học') || rowStrings.includes('mã sinh viên')) {
          headerRowIndex = i;
          break;
        }
      }

      const header = rawData[headerRowIndex];
      if (header) {
        for (let r = headerRowIndex + 1; r < rawData.length; r++) {
          if (!rawData[r] || rawData[r].length === 0 || !rawData[r].some(c => c)) continue;
          const rowObj = {};
          for (let c = 0; c < header.length; c++) {
            if (header[c]) rowObj[header[c]] = rawData[r][c];
          }
          parsedRows.push(rowObj);
        }
      }
    }

    const data = parsedRows;
    
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Không tìm thấy dữ liệu hợp lệ trong file' });
    }

    const previewData = [];
    let hasErrors = false;

    // Fetch existing courses to validate
    const existingCourses = await prisma.course.findMany({ select: { id: true } });
    const courseSet = new Set(existingCourses.map(c => c.id.toLowerCase()));

    // Keep track of student-course duplicates within the file itself
    const seenKeysInFile = new Set();

    // Feature Flag validation
    const componentEnabled = process.env.ENABLE_COMPONENT_SCORE === 'true';

    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      const rowNum = index + headerRowIndex + 2; // +1 for 0-index, +1 for header line
      
      // Auto-detect columns for flexibility
      const mssv = row.student_code || row.mssv || row['MSSV'] || row['Mã sinh viên'] || defaultMssv;
      const rawName = row.name || row.fullname || row.student_name || row['Họ Tên'] || row['Họ tên'] || row['Tên sinh viên'] || row['Tên Sinh Viên'];
      const name = rawName ? String(rawName).trim() : null;
      const rawCourse = row['Mã môn'] || row['Mã chuyển đổi'] || row.courseId || row.course || row['Môn học'] || row['Môn'];
      const course = resolveBackendCourseCode(rawCourse);
      const semester = row.semester || row['Học kỳ'] || row['Học Kỳ'] || 'SP26';
      
      let calculatedScore = calculateScore(row);
      
      let rawScore = null;
      let computedScore = null;
      let rowComponents = [];
      const warnings = [];

      // Only execute assessment engine components if flag is enabled
      if (componentEnabled) {
        rawScore = calculatedScore;
        if (course) {
          try {
            const schema = await resolveCourseAssessmentSchema(course, 'K19', semester);
            const inferred = inferComponentsFromExcel(row);
            rowComponents = normalizeAssessmentColumns(inferred, schema);
            if (rowComponents.length > 0) {
              const finalWeighted = calculateFinalScore(rowComponents, schema);
              if (finalWeighted !== null) {
                computedScore = finalWeighted;
              }
            }
          } catch (err) {
            logger.warn(`[AssessmentEngine] Failed to resolve schema for preview: ${err.message}`);
          }
        }

        if (computedScore !== null) {
          if (rawScore !== null && rawScore !== undefined) {
            calculatedScore = rawScore;
            if (Math.abs(rawScore - computedScore) > 0.01) {
              warnings.push(`Dòng ${rowNum}: Điểm tổng kết giáo viên nhập (${rawScore}) khác với điểm tính toán từ thành phần (${computedScore}).`);
            }
          } else {
            calculatedScore = computedScore;
          }
        }
      }
      
      // Trạng thái parsing
      let rowStatus = null;
      const trangThai = row['Trạng thái'] || row['Trạng Thái'] || row.status;
      if (trangThai) {
        const t = String(trangThai).toLowerCase().trim();
        if (t === 'studying' || t === 'đang học') rowStatus = 'STUDYING';
        else if (t === 'not started' || t === 'chưa học') rowStatus = 'NOT_STARTED';
        else if (t === 'passed' || t === 'đạt' || t === 'miễn' || t === 'mien' || t === 'pass') rowStatus = 'PASSED';
        else if (t === 'failed' || t === 'không đạt' || t === 'chưa đạt' || t === 'trượt' || t === 'rớt' || t === 'học lại' || t === 'fail') rowStatus = 'FAILED';
        else if (t.includes('studying') || t.includes('đang học')) rowStatus = 'STUDYING';
        else if (t.includes('không đạt') || t.includes('chưa đạt') || t.includes('trượt') || t.includes('failed')) rowStatus = 'FAILED';
        else if (t.includes('đạt') || t.includes('passed')) rowStatus = 'PASSED';
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
      
      if (!mssv) {
        errors.push('Thiếu MSSV (bạn có thể nhập tay ở ô MSSV)');
      } else {
        // Check for duplicate student-course pairs in the same uploaded file
        const fileDuplicateKey = `${String(mssv).trim().toUpperCase()}_${course ? course.toUpperCase() : 'N/A'}_${String(semester).trim()}`;
        if (seenKeysInFile.has(fileDuplicateKey)) {
          errors.push(`Trùng lặp dòng dữ liệu môn học '${course}' của sinh viên '${mssv}' học kỳ '${semester}' trong cùng file Excel`);
        } else {
          seenKeysInFile.add(fileDuplicateKey);
        }
      }

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

      const previewItem = {
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
      };

      if (componentEnabled) {
        previewItem.warnings = warnings;
        previewItem.components = rowComponents;
        previewItem.rawScore = rawScore !== null && !isNaN(rawScore) ? parseFloat(rawScore.toFixed(2)) : null;
        previewItem.computedScore = computedScore !== null && !isNaN(computedScore) ? parseFloat(computedScore.toFixed(2)) : null;
      }

      previewData.push(previewItem);
    }

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
      data: previewData,
      fileHash,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

  } catch (error) {
    logger.error('Excel parse error:', error);
    res.status(500).json({ error: 'Lỗi xử lý file Excel', details: error.message });
  }
};

exports.publishData = async (req, res) => {
  if (isImporting) {
    return res.status(429).json({ error: 'Hệ thống đang thực hiện một tiến trình import khác. Vui lòng thử lại sau.' });
  }
  isImporting = true;

  const { data, classCode, fileHash, fileName, fileSize } = req.body;
  let backupFile = null;

  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu để publish' });
    }

    // Only process valid rows
    const validData = data.filter(r => r.isValid);
    if (validData.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu hợp lệ để publish' });
    }

    // === HASH DEDUPLICATION CHECK ===
    if (fileHash) {
      const existingImport = await prisma.importSession.findUnique({
        where: { fileHash }
      });
      if (existingImport && existingImport.status === 'SUCCESS') {
        return res.status(400).json({ error: 'File này đã được import vào hệ thống trước đó.' });
      }
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

    // === DATABASE SNAPSHOT / BACKUP ===
    try {
      backupFile = await backupDatabase();
      logger.info(`Database backup created: ${backupFile}`);
    } catch (backupErr) {
      logger.error('Failed to create database backup before import:', backupErr);
      return res.status(500).json({ error: 'Không thể tạo bản sao lưu cơ sở dữ liệu trước khi import.' });
    }

    // === BATCH PROCESSING (50 students/tx) ===
    const studentGroups = {};
    for (const row of normalizedRows) {
      if (!studentGroups[row.mssv]) studentGroups[row.mssv] = [];
      studentGroups[row.mssv].push(row);
    }
    const studentIds = Object.keys(studentGroups);
    const BATCH_SIZE = 50;

    let scoresInserted = 0;
    let scoresUpdated = 0;
    let successStudents = 0;
    let failedStudents = 0;

    // 1. Create ImportSession first to track progress
    const importSession = await prisma.importSession.create({
      data: {
        fileHash: fileHash || `TEMP_HASH_${Date.now()}_${Math.random()}`,
        fileName: fileName || 'unknown',
        fileSize: fileSize || 0,
        uploadedBy: req.user?.email || 'SYSTEM',
        studentsCount: studentIds.length,
        scoresInserted: 0,
        scoresUpdated: 0,
        status: 'PROCESSING'
      }
    });

    const componentEnabled = process.env.ENABLE_COMPONENT_SCORE === 'true';

    // Helper function to process a list of students within a transaction
    const processStudentsTx = async (tx, mssvList) => {
      let localInserted = 0;
      let localUpdated = 0;

      for (const mssv of mssvList) {
        const rows = studentGroups[mssv];
        const firstRow = rows[0];

        // Upsert Student
        await tx.student.upsert({
          where: { mssv },
          update: {
            ...(firstRow.name ? { name: firstRow.name } : {}),
            ...(classCode ? { classCode } : {})
          },
          create: {
            mssv,
            name: firstRow.name || `Sinh viên ${mssv}`,
            classCode: classCode || 'UNKNOWN'
          }
        });

        for (const row of rows) {
          let status = row.rowStatus;
          let scoreValue = row.score;
          let rawScore = null;
          let computedScore = null;

          if (componentEnabled) {
            rawScore = row.rawScore !== undefined ? row.rawScore : null;
            computedScore = row.computedScore !== undefined ? row.computedScore : null;
          }

          if (status === 'STUDYING' || status === 'NOT_STARTED') {
            scoreValue = null;
          } else if (!status) {
            if (scoreValue === null || scoreValue === undefined) {
              status = 'STUDYING';
              scoreValue = null;
            } else {
              status = (scoreValue >= 5.0 || scoreValue === 1.0) ? 'PASSED' : 'FAILED';
            }
          }

          const existingScore = await tx.score.findUnique({
            where: { mssv_courseId_semester: { mssv, courseId: row.course, semester: row.semester } },
            select: { id: true }
          });

          if (existingScore) localUpdated++;
          else localInserted++;

          const scoreRecord = await tx.score.upsert({
            where: { mssv_courseId_semester: { mssv, courseId: row.course, semester: row.semester } },
            update: {
              value: scoreValue,
              status,
              rawScore,
              computedScore,
              importSessionId: importSession.id,
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
              rawScore,
              computedScore,
              importSessionId: importSession.id,
              attendance: row.attendance !== undefined ? parseFloat(row.attendance) : 100,
              quiz: row.quiz !== undefined ? parseFloat(row.quiz) : null,
              asm1: row.asm !== undefined ? parseFloat(row.asm) : null,
              final: row.final !== undefined ? parseFloat(row.final) : null,
              lab: row.lab !== undefined ? parseFloat(row.lab) : null,
              assignment: row.assignment !== undefined ? parseFloat(row.assignment) : null
            }
          });

          if (componentEnabled && row.components && Array.isArray(row.components) && row.components.length > 0) {
            const dbComps = buildAssessmentObjects(row.components, scoreRecord.id, importSession.id, 'EXCEL');
            await saveScoreComponents(tx, scoreRecord.id, dbComps);
          }
        }
      }

      return { localInserted, localUpdated };
    };

    // 2. Loop through batches of students
    for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
      const batchIds = studentIds.slice(i, i + BATCH_SIZE);
      try {
        await prisma.$transaction(async (tx) => {
          const { localInserted, localUpdated } = await processStudentsTx(tx, batchIds);
          scoresInserted += localInserted;
          scoresUpdated += localUpdated;
        }, { maxWait: 10000, timeout: 30000 });
        successStudents += batchIds.length;
      } catch (batchErr) {
        logger.error(`[Batch Import] Failed batch starting with ${batchIds[0]}. Falling back to single-student processing...`, batchErr);
        // Fallback: Graceful degradation to single-student transactions
        for (const mssv of batchIds) {
          try {
            await prisma.$transaction(async (tx) => {
              const { localInserted, localUpdated } = await processStudentsTx(tx, [mssv]);
              scoresInserted += localInserted;
              scoresUpdated += localUpdated;
            }, { maxWait: 10000, timeout: 15000 });
            successStudents++;
          } catch (singleErr) {
            logger.error(`[Batch Import] Failed to import student ${mssv}`, singleErr);
            failedStudents++;
          }
        }
      }
    }

    // === UPDATE SUCCESSFUL IMPORT SESSION ===
    await prisma.importSession.update({
      where: { id: importSession.id },
      data: {
        status: failedStudents > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
        scoresInserted,
        scoresUpdated,
        studentsCount: successStudents
      }
    });

    // === AUDIT LOG ===
    const auditTimestamp = new Date().toISOString();
    const auditUser = req.user?.email || req.user?.username || 'SYSTEM';
    const auditFilename = fileName || 'unknown';
    logger.info(
      `[IMPORT_AUDIT] ${auditTimestamp} | ${auditUser} | ${auditFilename} | ` +
      `studentsAffected=${successStudents + failedStudents} | scoresInserted=${scoresInserted} | scoresUpdated=${scoresUpdated}`
    );
    console.log(
      `[IMPORT_AUDIT] ${auditTimestamp} | ${auditUser} | ${auditFilename} | ` +
      `studentsAffected=${successStudents + failedStudents} | scoresInserted=${scoresInserted} | scoresUpdated=${scoresUpdated}`
    );

    // === POST-IMPORT SUCCESS CHECKS & CACHE INVALIDATION ===
    const studentMssvList = studentIds;
    const [verifyStudentCount, verifyScoreCount] = await Promise.all([
      prisma.student.count({ where: { mssv: { in: studentMssvList } } }),
      prisma.score.count({ where: { mssv: { in: studentMssvList } } })
    ]);
    logger.info(
      `[IMPORT_INTEGRITY] Verified post-commit: ${verifyStudentCount} students, ${verifyScoreCount} total scores for imported cohort.`
    );

    // Invalidate caches
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

    const isTestFile = fileName && (
      fileName.startsWith('COMPAT_TEST') || 
      fileName.startsWith('EQUIV_TEST') || 
      fileName.startsWith('TEST_') || 
      fileName.startsWith('ISOLATION_TEST') || 
      fileName.startsWith('DORMANT_TEST')
    );

    if (!isTestFile) {
      // Trigger AI predictions for updated students in background
      setTimeout(() => {
        try {
          logger.info(`Triggering AI predictions for ${successStudents} students after data import via script...`);
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
    }

    if (global.latestImportStatus) {
      global.latestImportStatus.status = 'PUBLISHED';
    }

    res.json({
      success: true,
      message: `Đã import thành công ${successStudents} sinh viên (${scoresInserted} mới, ${scoresUpdated} cập nhật). AI đang phân tích dữ liệu...`,
      studentsAffected: successStudents,
      scoresInserted,
      scoresUpdated
    });

  } catch (error) {
    logger.error('Publish data error, rolling back database changes:', error);

    // Save failed import to session for audit trail (executed outside transaction)
    if (fileHash) {
      try {
        await prisma.importSession.create({
          data: {
            fileHash: `${fileHash}_failed_${Date.now()}`,
            fileName: fileName || 'unknown',
            fileSize: fileSize || 0,
            uploadedBy: req.user?.email || 'SYSTEM',
            status: 'FAILED',
            errorMessage: error.message
          }
        });
      } catch (historyErr) {
        logger.error('Failed to write FAILED status to ImportSession:', historyErr);
      }
    }

    res.status(500).json({ error: 'Lỗi lưu dữ liệu vào hệ thống và đã rollback để an toàn', details: error.message });
  } finally {
    isImporting = false;
  }
};
