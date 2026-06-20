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

    const student = await prisma.student.findUnique({
      where: { mssv: String(mssv).toUpperCase() },
      include: {
        scores: { include: { course: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const backendResult = calculateMatchRate(student.scores, careerName);

    if (backendResult.missing_data) {
      return res.json({ missing_data: true });
    }

    const payloadForAI = {
      student_name: student.name,
      mssv: student.mssv,
      career_name: backendResult.career,
      backend_match_rate: backendResult.matchRate,
      required_tech_stack: backendResult.requiredSkills,
      mapped_transcript: backendResult.mapped_transcript,
      skill_scores: backendResult.skillScores,
      coverage: backendResult.coverage,
      confidence: backendResult.confidence,
      strengths: backendResult.strengths,
      weaknesses: backendResult.weaknesses,
      roadmap: backendResult.roadmap
    };

    let aiAnalysis = {};
    if (process.env.GEMINI_API_KEY) {
      try {
        aiAnalysis = await getCareerMatchAI(payloadForAI);
      } catch (aiErr) {
        console.warn('Career AI explanation skipped:', aiErr.message);
      }
    }

    return res.json({
      ...aiAnalysis,
      career: backendResult.career,
      matchRate: backendResult.matchRate,
      match_rate: backendResult.matchRate,
      coverage: backendResult.coverage,
      confidence: backendResult.confidence,
      strengths: backendResult.strengths,
      weaknesses: backendResult.weaknesses,
      skillScores: backendResult.skillScores,
      roadmap: backendResult.roadmap,
      requiredSkills: backendResult.requiredSkills,
      mappedTranscript: backendResult.mapped_transcript,
      backendLocked: true
    });
  } catch (err) {
    console.error('Error in Career Match Engine:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
