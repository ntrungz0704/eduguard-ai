const express = require('express');
const router = express.Router();
const { prisma } = require('../infrastructure/database/prisma');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine for physical file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ----------------------------------------------------
// AUTH ENDPOINTS (Mock Auth)
// ----------------------------------------------------

// /api/comm/auth/login
router.post('/auth/login', async (req, res) => {
  const { role, id } = req.body;
  try {
    if (role === 'ADVISOR') {
      let user = await prisma.user.findFirst({ where: { role: 'ADVISOR' } });
      if (!user) {
        user = await prisma.user.create({
          data: { email: 'admin@fpt.edu.vn', name: 'Giảng viên FPT', role: 'ADVISOR' }
        });
      }
      return res.json({ token: 'mock-token', user: { id: user.id, name: user.name, role: 'ADVISOR' } });
    } else if (role === 'STUDENT') {
      if (!id) return res.status(400).json({ error: 'MSSV is required for student login' });
      let student = await prisma.student.findUnique({ where: { mssv: id } });
      if (!student) {
        // Auto create missing student for demo purposes
        student = await prisma.student.create({
          data: {
            mssv: id,
            name: 'Sinh viên Demo',
            classCode: 'DEMO101'
          }
        });
      }
      return res.json({ token: 'mock-token', user: { id: student.mssv, name: student.name, role: 'STUDENT', classCode: student.classCode } });
    }
    return res.status(400).json({ error: 'Invalid role' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/comm/auth/google
router.post('/auth/google', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng nhập email/tên đăng nhập' });
    }

    const isAdvisorEmail = email.endsWith('@fpt.edu.vn');
    const isStudentEmail = email.endsWith('@gmail.com');

    if (!isAdvisorEmail && !isStudentEmail) {
      return res.status(400).json({ error: 'Vui lòng dùng email @fpt.edu.vn (GV) hoặc @gmail.com (SV)' });
    }

    if (isAdvisorEmail && password !== 'admin123') {
        return res.status(401).json({ error: 'Mật khẩu giảng viên không chính xác (Mẹo: admin123)'});
    }

    const prefix = email.split('@')[0];
    // Determine role based on email domain
    const isStudent = isStudentEmail;

    if (isStudent) {
      // Extract MSSV from prefix if possible. Assume prefix is the MSSV (e.g. ps47261)
      // If it doesn't look like MSSV, we generate a random one for demo or just use prefix
      let mssv = prefix.toUpperCase();
      if (!/^[A-Z]{2}\d+$/.test(mssv)) {
        // If they just typed "nguyenvana@gmail.com", generate a dummy ID for demo
        mssv = 'PS' + Math.floor(Math.random() * 90000 + 10000);
      }
      
      let student = await prisma.student.findUnique({ where: { mssv } });
      if (!student) {
        student = await prisma.student.create({
          data: {
            mssv,
            name: `Sinh viên (${mssv})`,
            classCode: 'DEMO101'
          }
        });
      }
      return res.json({ token: 'mock-token', user: { id: student.mssv, name: student.name, role: 'STUDENT', classCode: student.classCode, email } });
    } else {
      // ADVISOR
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { email, name: prefix, role: 'ADVISOR' }
        });
      }
      return res.json({ token: 'mock-token', user: { id: user.id, name: user.name, role: 'ADVISOR', email } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ----------------------------------------------------
// MESSAGING ENDPOINTS
// ----------------------------------------------------

// Get AI-generated personalized roadmap suggestion based on syllabus JSONs
router.get('/messages/suggestion', async (req, res) => {
  const { mssv, courseId, predictedScore } = req.query;
  if (!mssv || !courseId) {
    return res.status(400).json({ error: 'Missing mssv or courseId' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { mssv },
      include: { scores: true }
    });
    
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!student || !course) {
      return res.status(404).json({ error: 'Student or Course not found' });
    }

    // Load target course syllabus from processed-json
    const syllabusPath = path.join(__dirname, '..', '..', 'data', 'processed-json', `${courseId}.json`);
    let targetSyllabus = null;
    if (fs.existsSync(syllabusPath)) {
      targetSyllabus = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
    }

    // Determine weak prerequisites from student scores
    const { ACADEMIC_PREREQUISITES } = require('../ai/regression');
    const targetPrereqs = ACADEMIC_PREREQUISITES[course.name] || [];
    const weakPrereqs = [];
    student.scores.forEach(sc => {
      if (targetPrereqs.includes(sc.courseId) && sc.value != null && sc.value < 6.0) {
        weakPrereqs.push({ courseId: sc.courseId, score: sc.value });
      }
    });

    let explanation = '';
    let weakPrereqActions = '';
    if (weakPrereqs.length > 0) {
      explanation = `Nguyên nhân chính do em bị hổng kiến thức từ các môn tiên quyết: ${weakPrereqs.map(w => `${w.courseId} (${w.score}đ)`).join(', ')}.`;
      
      weakPrereqActions += `⚠️ Hành động khẩn cấp cho môn tiên quyết:\n`;
      for (const wp of weakPrereqs) {
        const wpPath = path.join(__dirname, '..', '..', 'data', 'processed-json', `${wp.courseId}.json`);
        let wpSyllabus = null;
        if (fs.existsSync(wpPath)) {
          wpSyllabus = JSON.parse(fs.readFileSync(wpPath, 'utf8'));
        }
        if (wpSyllabus && wpSyllabus.sessions && wpSyllabus.sessions.length > 0) {
          // Get the first 3 topics
          const coreTopics = wpSyllabus.sessions.slice(0, 3).map(s => s.topic).join(', ');
          weakPrereqActions += `- Với môn ${wpSyllabus.course_name} (${wp.courseId}): Ôn tập lại ngay các chủ đề cốt lõi: ${coreTopics}.\n`;
        } else {
          weakPrereqActions += `- Với môn ${wp.courseId}: Ôn tập lại slide, video bài giảng và hoàn thành các bài thực hành/lab cốt lõi.\n`;
        }
      }
    } else {
      explanation = `Nguyên nhân do phong độ học tập gần đây của em có dấu hiệu giảm sút.`;
      weakPrereqActions += `- Ôn tập lại các kiến thức cơ bản của ngành học để lấy lại nhịp độ học tập.\n`;
    }

    // Target course details
    let toolsStr = 'VS Code, Git';
    let outcomesStr = '';
    let sessionsStr = '';

    if (targetSyllabus) {
      if (targetSyllabus.tools_required && targetSyllabus.tools_required.length > 0) {
        toolsStr = targetSyllabus.tools_required.join(', ');
      }
      if (targetSyllabus.learning_outcomes && targetSyllabus.learning_outcomes.length > 0) {
        outcomesStr = targetSyllabus.learning_outcomes.slice(0, 3).map(o => `- ${o.code}: ${o.title}`).join('\n');
      } else {
        outcomesStr = `- Hiểu và vận dụng các kiến thức cốt lõi của môn học.\n- Hoàn thành các bài thực hành và dự án mẫu.`;
      }
      if (targetSyllabus.sessions && targetSyllabus.sessions.length > 0) {
        sessionsStr = targetSyllabus.sessions.slice(0, 4).map(s => `- Session ${s.session}: ${s.topic}`).join('\n');
      } else {
        sessionsStr = `- Tuần 1: Làm quen môn học và cài đặt công cụ.\n- Tuần 2: Học các khái niệm cơ bản đầu tiên.`;
      }
    } else {
      outcomesStr = `- Hiểu và vận dụng các kiến thức cốt lõi của môn học.\n- Hoàn thành các bài thực hành và dự án mẫu.`;
      sessionsStr = `- Tuần 1: Làm quen môn học và cài đặt công cụ.\n- Tuần 2: Học các khái niệm cơ bản đầu tiên.`;
    }

    const predScoreNum = predictedScore ? parseFloat(predictedScore) : 5.0;
    const predScoreFormatted = isNaN(predScoreNum) ? '5.0' : predScoreNum.toFixed(1);

    const isCritical = predScoreNum < 4.0;
    const action3 = isCritical 
      ? `3. 🚨 Khẩn cấp (Hành động trực tiếp): Đặt lịch hẹn gặp Cố vấn học tập (CVHT) trong tuần này để được hỗ trợ phương án cứu vãn điểm chuyên cần và điểm số.`
      : `3. 👥 Tham gia phụ đạo: Tham gia các buổi tutorial/phụ đạo do trường tổ chức hoặc nhờ nhóm bạn hỗ trợ ôn tập thêm ngoài giờ học.`;

    const suggestion = `Chào ${student.name},\n
Giảng viên phát hiện em đang có nguy cơ gặp khó khăn ở môn ${course.name} (${course.id}) sắp tới (Dự báo AI: ${predScoreFormatted}đ).
${explanation}\n
🎯 LỘ TRÌNH CẢI THIỆN (AI Đề xuất dựa trên Đề cương chi tiết):\n
1. 📚 Bù đắp lỗ hổng kiến thức tiên quyết:
${weakPrereqActions}
2. 🚀 Chủ động tiếp cận môn học mới (${course.name}):
- 🛠️ Yêu cầu công cụ: Đảm bảo đã cài đặt và biết sử dụng: ${toolsStr}.
- 🎯 Chuẩn đầu ra quan trọng cần đạt:
${outcomesStr}
- 📅 Nội dung trọng tâm cần học trước (Tuần 1-2):
${sessionsStr}\n
3. 📆 Kế hoạch hành động chi tiết:
- 1. Dành 2 giờ mỗi ngày tự học và làm lại các phần Assignment/Lab tương tự.
- 2. Tăng cường chú ý: Xem lại video bài giảng và các phần thực hành trên lớp tuần qua.
- ${action3}\n
Nếu cần hỗ trợ thêm, hãy phản hồi lại qua Hộp thư này. Chúc em học tốt và cải thiện điểm số thành công!`;

    res.json({ suggestion });
  } catch (err) {
    console.error("Lỗi tạo đề xuất:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get inbox for a user
router.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.query; // 'ADVISOR' or 'STUDENT'
  
  try {
    // Fetch all advisors to build advisor list
    const advisors = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADVISOR', 'ADMIN']
        }
      }
    });
    const advisorIds = advisors.map(a => a.id);
    advisorIds.push('advisor-group'); // Add virtual group ID
    
    const advisorMap = {};
    for (const a of advisors) {
      advisorMap[a.id] = a.name;
    }
    advisorMap['advisor-group'] = 'Ban Cố vấn Học vụ';
    
    let messages = [];
    if (role === 'STUDENT') {
      // Fetch student's own messages
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        include: { attachments: true },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Fetch ALL messages where sender or receiver is in advisorIds (student-advisor chats)
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: { in: advisorIds } },
            { receiverId: { in: advisorIds } }
          ]
        },
        include: { attachments: true },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    // Find names for students in the messages
    const studentIds = [...new Set(messages.flatMap(m => [m.senderId, m.receiverId]))]
      .filter(id => !advisorMap[id]);
    
    const students = await prisma.student.findMany({
      where: { mssv: { in: studentIds } },
      select: { mssv: true, name: true }
    });
    
    const studentMap = {};
    for (const s of students) {
      studentMap[s.mssv] = s.name;
    }
    
    // Map names on each message
    for (const msg of messages) {
      msg.senderName = advisorMap[msg.senderId] || studentMap[msg.senderId] || msg.senderId;
      msg.receiverName = advisorMap[msg.receiverId] || studentMap[msg.receiverId] || msg.receiverId;
    }
    
    // Group by conversation partner
    const conversations = {};
    for (const msg of messages) {
      let partnerId;
      if (role === 'STUDENT') {
        // For student, group all advisor messages under the virtual advisor-group
        const isSenderAdvisor = advisorIds.includes(msg.senderId);
        const isReceiverAdvisor = advisorIds.includes(msg.receiverId);
        if (isSenderAdvisor || isReceiverAdvisor) {
          partnerId = 'advisor-group';
        } else {
          partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        }
      } else {
        // For advisor, group by student MSSV
        const isSenderAdvisor = advisorIds.includes(msg.senderId);
        const isReceiverAdvisor = advisorIds.includes(msg.receiverId);
        if (isSenderAdvisor && !isReceiverAdvisor) {
          partnerId = msg.receiverId;
        } else if (!isSenderAdvisor && isReceiverAdvisor) {
          partnerId = msg.senderId;
        } else {
          partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        }
      }
      
      if (!conversations[partnerId]) {
        let partnerName = partnerId;
        if (role === 'STUDENT') {
          if (partnerId === 'advisor-group') {
            partnerName = 'Ban Cố vấn Học vụ';
          } else {
            partnerName = studentMap[partnerId] || partnerId;
          }
        } else {
          partnerName = studentMap[partnerId] ? `${studentMap[partnerId]} (${partnerId})` : partnerId;
        }
        
        conversations[partnerId] = {
          partnerId,
          partnerName,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
          messages: []
        };
      }
      if (msg.receiverId === userId && !msg.isRead) {
        conversations[partnerId].unreadCount += 1;
      }
      conversations[partnerId].messages.push(msg);
    }
    
    // Pre-populate conversations using the Intervention table
    if (role === 'STUDENT') {
      if (!conversations['advisor-group']) {
        conversations['advisor-group'] = {
          partnerId: 'advisor-group',
          partnerName: 'Ban Cố vấn Học vụ',
          lastMessage: '',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          messages: []
        };
      }
    } else {
      // ADVISOR
      const interventions = await prisma.intervention.findMany({
        where: { advisorId: userId },
        include: { student: true }
      });
      for (const iv of interventions) {
        const partnerId = iv.mssv;
        if (!conversations[partnerId]) {
          const partnerName = iv.student ? `${iv.student.name} (${iv.student.mssv})` : partnerId;
          conversations[partnerId] = {
            partnerId,
            partnerName,
            lastMessage: '',
            lastMessageAt: iv.createdAt,
            unreadCount: 0,
            messages: []
          };
        }
      }
    }
    
    res.json(Object.values(conversations).sort((a,b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
  } catch (err) {
    console.error("Lỗi lấy inbox:", err);
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/messages', upload.array('files'), async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  try {
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content || ''
      }
    });

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await prisma.attachment.create({
          data: {
            messageId: newMessage.id,
            fileName: file.originalname,
            fileUrl: `/uploads/${file.filename}`,
            fileType: file.mimetype
          }
        });
      }
    }

    const savedMsg = await prisma.message.findUnique({
      where: { id: newMessage.id },
      include: { attachments: true }
    });

    res.json(savedMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read
router.post('/messages/read', async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    const advisors = await prisma.user.findMany({
      where: { role: { in: ['ADVISOR', 'ADMIN'] } },
      select: { id: true }
    });
    const advisorIds = advisors.map(a => a.id);
    advisorIds.push('advisor-group');
    
    const isSenderAdvisor = advisorIds.includes(senderId);
    const isReceiverAdvisor = advisorIds.includes(receiverId);
    
    if (isSenderAdvisor) {
      // Student marking advisor messages as read
      await prisma.message.updateMany({
        where: {
          senderId: { in: advisorIds },
          receiverId: receiverId, // student ID
          isRead: false
        },
        data: { isRead: true }
      });
    } else if (isReceiverAdvisor) {
      // Advisor marking student messages as read
      await prisma.message.updateMany({
        where: {
          senderId: senderId, // student ID
          receiverId: { in: advisorIds },
          isRead: false
        },
        data: { isRead: true }
      });
    } else {
      // Fallback
      await prisma.message.updateMany({
        where: {
          senderId: senderId,
          receiverId: receiverId,
          isRead: false
        },
        data: { isRead: true }
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/comm/advisors
router.get('/advisors', async (req, res) => {
  try {
    let advisors = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADVISOR', 'ADMIN']
        }
      }
    });
    if (advisors.length === 0) {
      const adv = await prisma.user.create({
        data: { email: 'admin@fpt.edu.vn', name: 'Cố vấn Học vụ FPT', role: 'ADVISOR' }
      });
      advisors = [adv];
    }
    const virtualAdvisor = {
      id: 'advisor-group',
      name: 'Ban Cố vấn Học vụ',
      role: 'ADVISOR',
      email: 'support@eduguard.ai'
    };
    res.json([virtualAdvisor, ...advisors]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
