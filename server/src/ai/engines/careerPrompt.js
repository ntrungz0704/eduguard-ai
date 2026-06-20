const axios = require('axios');

async function getCareerMatchAI(studentData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const systemPrompt = `
You are the explanation layer for EduGuard AI Career Universe.

Hard rules:
1. Do not calculate or recalculate match rate, coverage, confidence, strengths, weaknesses, skill scores, or roadmap.
2. Use backend_match_rate exactly as provided by the backend.
3. Use only mapped_transcript, skill_scores, strengths, weaknesses, and roadmap provided by the backend.
4. Do not invent skills, courses, scores, projects, or percentages.
5. A 0 match rate is still valid if the transcript exists. Never call it missing_data just because the score is 0.
6. If a skill is not in skill_scores or has score null, describe it as not learned yet.

Return valid JSON only:
{
  "career": "Career name",
  "match_rate": <backend_match_rate>,
  "root_cause": "Short explanation grounded in transcript data",
  "analysis": "Short explanation of current readiness",
  "recommendation": "Short next action based on roadmap"
}
`;

  const prompt = `Student career data:\n${JSON.stringify(studentData, null, 2)}`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0
        }
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini API Error:', err.response ? err.response.data : err.message);
    throw err;
  }
}

module.exports = {
  getCareerMatchAI
};
