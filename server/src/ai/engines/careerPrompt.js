const axios = require('axios');

// Using direct axios call or we can install the package. Since we use axios, we'll use the REST API approach for Gemini to avoid missing package issues.
async function getCareerMatchAI(studentData) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY");
    }

    const systemPrompt = `
Bạn là AI Career Intelligence Expert.
Nhiệm vụ của bạn là phân tích điểm chuẩn từ hệ thống Backend (Match Rate) và tạo Báo cáo Định hướng nghề nghiệp.

NGUYÊN TẮC BẮT BUỘC:
1. KHÔNG tự tính toán lại Match Rate. Bạn CHỈ được phép lấy \`backend_match_rate\` làm kết quả cuối cùng.
2. NGUYÊN TẮC ANTI-HALLUCINATION: Nếu một skill chưa xuất hiện trong \`mapped_transcript\`, xem như CHƯA HỌC. Không được tự thêm. Không giả định.
3. Nếu \`backend_match_rate\` là 0 hoặc dữ liệu trống, báo cáo missing_data.

ĐỊNH DẠNG OUTPUT (BẮT BUỘC TRẢ VỀ JSON HỢP LỆ VÀ KHÔNG KÈM MARKDOWN KHÁC):
{
  "career": "Tên nghề",
  "match_rate": <backend_match_rate>,
  "strengths": ["Top 3 skill điểm cao nhất >= 8"],
  "gaps": ["Top 3 skill điểm < 6 hoặc chưa học"],
  "root_cause": "Nguyên nhân ngắn gọn tại sao điểm thấp / thiếu",
  "analysis": "Phân tích ngắn gọn tình hình",
  "recommendation": "Gợi ý khắc phục",
  "roadmap": ["Bước 1", "Bước 2", "Bước 3... Roadmap học tập"]
}
`;

    const prompt = `
Dữ liệu sinh viên:
${JSON.stringify(studentData, null, 2)}
`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    response_mime_type: "application/json",
                    temperature: 0.2
                }
            }
        );

        const text = response.data.candidates[0].content.parts[0].text;
        return JSON.parse(text);
    } catch (err) {
        console.error("Gemini API Error:", err.response ? err.response.data : err.message);
        throw err;
    }
}

module.exports = {
    getCareerMatchAI
};
