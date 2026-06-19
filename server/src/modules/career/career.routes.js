const express = require('express');
const router = express.Router();
const { prisma } = require('../../infrastructure/database/prisma');
const { calculateMatchRate } = require('../../ai/engines/careerMatchingEngine');
const { getCareerMatchAI } = require('../../ai/engines/careerPrompt');

router.post('/match', async (req, res) => {
  try {
    const { mssv, careerName } = req.body;

    if (!mssv || !careerName) {
      return res.status(400).json({ error: 'Missing mssv or careerName' });
    }

    // Lấy thông tin sinh viên và điểm số
    const student = await prisma.student.findUnique({
      where: { id: mssv },
      include: {
        scores: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Chuyển đổi format scores: { "WEB1043": 9.5 }
    const studentScores = {};
    student.scores.forEach(s => {
      if (s.value !== null && s.value !== undefined) {
        studentScores[s.courseId] = s.value;
      }
    });

    // Gọi Backend Match Engine
    const backendResult = calculateMatchRate(studentScores, careerName);

    if (backendResult.missing_data) {
      return res.json({ missing_data: true });
    }

    // Chuẩn bị dữ liệu gửi cho AI
    const payloadForAI = {
      student_name: student.name,
      mssv: student.id,
      major: student.major,
      career_name: backendResult.career_name,
      backend_match_rate: backendResult.backend_match_rate,
      required_tech_stack: backendResult.required_tech_stack,
      mapped_transcript: backendResult.mapped_transcript
    };

    // Gọi AI (Gemini) để sinh phân tích JSON
    const aiAnalysis = await getCareerMatchAI(payloadForAI);

    // AI bắt buộc trả về đúng match_rate của backend, ta có thể ghi đè lại để phòng hờ hallucination
    aiAnalysis.match_rate = backendResult.backend_match_rate;
    aiAnalysis.career = backendResult.career_name;

    return res.json(aiAnalysis);

  } catch (err) {
    console.error('Error in Career Match Engine:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
