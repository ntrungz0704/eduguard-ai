const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prisma } = require('../../src/infrastructure/database/prisma');

// Initialize API clients
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Groq tools declaration for native function calling (Step 2)
const groqTools = [{
  type: "function",
  function: {
    name: "queryStudentAcademicRecord",
    description: "Truy vấn điểm số chi tiết, kết quả học tập thực tế và dự báo rủi ro trượt môn của sinh viên từ cơ sở dữ liệu dựa trên mã số sinh viên (MSSV)",
    parameters: {
      type: "object",
      properties: {
        mssv: {
          type: "string",
          description: "Mã số sinh viên cần tra cứu học bạ (Ví dụ: PS23116 hoặc PS27463)"
        }
      },
      required: ["mssv"]
    }
  }
}];

// Helper: Query student details from database (Step 2)
async function getStudentDataForAI(mssv) {
  if (!mssv) return null;
  try {
    let cleanMssv = mssv.toUpperCase().trim();
    if (/^\d{5}$/.test(cleanMssv)) {
      cleanMssv = `PS${cleanMssv}`;
    }
    const record = await prisma.student.findUnique({
      where: { mssv: cleanMssv },
      include: {
        scores: { include: { course: true } },
        predictions: { include: { course: true } }
      }
    });

    if (!record) return null;

    return {
      name: record.name,
      mssv: record.mssv,
      classCode: record.classCode,
      scores: record.scores.map(s => ({ course: s.courseId, name: s.course.name, val: s.value, status: s.status })),
      predictions: record.predictions.map(p => ({ course: p.courseId, pred: p.predictedScore, risk: p.risk, reasons: p.reasons }))
    };
  } catch (err) {
    console.error(`[Prisma AI Tool] Lỗi truy vấn MSSV ${mssv}:`, err);
    return null;
  }
}

async function askGroq({ system, history = [], user, disableTools = false }) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY in environment");
  }

  const model = process.env.GROQ_MODEL || "qwen/qwen3-32b";
  console.log(`[aiService - Groq] Đang gọi model: ${model}...`);
  
  const requestPayload = {
    model: model,
    messages: [
      { role: "system", content: system },
      ...history,
      { role: "user", content: user }
    ],
    temperature: 0.1, // Hyperparameter Tuning (Step 4)
    top_p: 0.95,
    max_tokens: 2048
  };

  if (!disableTools) {
    requestPayload.tools = groqTools;
    requestPayload.tool_choice = "auto";
  }

  const completion = await groq.chat.completions.create(requestPayload);

  const assistantMessage = completion.choices?.[0]?.message;
  if (!assistantMessage) {
    throw new Error("Empty response from Groq");
  }

  // Handle native tool call callback (Step 2)
  if (!disableTools && assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    const toolCall = assistantMessage.tool_calls[0];
    if (toolCall.function.name === "queryStudentAcademicRecord") {
      const args = JSON.parse(toolCall.function.arguments);
      const targetMssv = args.mssv;
      console.log(`[aiService - Groq Tool Call] AI yêu cầu gọi queryStudentAcademicRecord cho MSSV: ${targetMssv}`);
      
      const recordData = await getStudentDataForAI(targetMssv);

      const secondCompletion = await groq.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: user },
          assistantMessage,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            name: "queryStudentAcademicRecord",
            content: JSON.stringify({ record: recordData })
          }
        ],
        temperature: 0.1, // Hyperparameter Tuning (Step 4)
        top_p: 0.95
      });

      return secondCompletion.choices?.[0]?.message?.content || "";
    }
  }

  return assistantMessage.content || "";
}

// Ask Gemini caller service with tool support (Step 4 & 2)
async function askGemini({ system, history = [], user, disableTools = false }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in environment");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  console.log(`[aiService - Gemini] Đang gọi model: ${modelName}...`);
  
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction: system
  });

  // Map OpenAI-style history to Gemini-compatible format
  const geminiHistory = history.map(h => ({
    role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
    parts: [{ text: h.content || h.text || '' }]
  }));

  const requestPayload = {
    contents: [
      ...geminiHistory,
      { role: "user", parts: [{ text: `Câu hỏi: ${user}` }] }
    ],
    generationConfig: {
      temperature: 0.1, // Hyperparameter Tuning (Step 4)
      maxOutputTokens: 4096,
      topP: 0.95
    }
  };

  if (!disableTools) {
    requestPayload.tools = [{
      functionDeclarations: [{
        name: "queryStudentAcademicRecord",
        description: "Truy vấn điểm số chi tiết, kết quả học tập thực tế và dự báo rủi ro trượt môn của sinh viên từ cơ sở dữ liệu dựa trên mã số sinh viên (MSSV)",
        parameters: {
          type: "OBJECT",
          properties: {
            mssv: {
              type: "STRING",
              description: "Mã số sinh viên cần tra cứu học bạ (Ví dụ: PS23116 hoặc PS27463)"
            }
          },
          required: ["mssv"]
        }
      }]
    }];
  }

  const result = await model.generateContent(requestPayload);
  const response = result.response;
  const functionCalls = response.functionCalls();
  
  // Handle native tool call callback (Step 2)
  if (!disableTools && functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    if (call.name === "queryStudentAcademicRecord") {
      const { mssv } = call.args;
      console.log(`[aiService - Gemini Tool Call] AI yêu cầu gọi queryStudentAcademicRecord cho MSSV: ${mssv}`);
      
      const recordData = await getStudentDataForAI(mssv);
      
      const chat = model.startChat({
        history: [
          ...geminiHistory,
          { role: "user", parts: [{ text: `Câu hỏi: ${user}` }] },
          { role: "model", parts: [{ functionCall: call }] }
        ],
        generationConfig: {
          temperature: 0.1, // Hyperparameter Tuning (Step 4)
          maxOutputTokens: 4096,
          topP: 0.95
        }
      });

      const secondResult = await chat.sendMessage([{
        functionResponse: {
          name: "queryStudentAcademicRecord",
          response: { record: recordData }
        }
      }]);
      
      return secondResult.response.text();
    }
  }

  return response.text();
}

module.exports = {
  askGroq,
  askGemini
};
