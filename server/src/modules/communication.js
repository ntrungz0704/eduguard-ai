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

// Get inbox for a user
router.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.query; // 'ADVISOR' or 'STUDENT'
  
  try {
    let messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Group by conversation partner
    const conversations = {};
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversations[partnerId]) {
        // Fetch partner details
        let partnerName = partnerId;
        if (role === 'STUDENT') {
          // Partner is advisor
          const adv = await prisma.user.findUnique({ where: { id: partnerId }});
          partnerName = adv ? adv.name : 'Giảng viên';
        } else {
          // Partner is student
          const stu = await prisma.student.findUnique({ where: { mssv: partnerId }});
          partnerName = stu ? `${stu.name} (${stu.mssv})` : partnerId;
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
    
    res.json(Object.values(conversations).sort((a,b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
  } catch (err) {
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
    await prisma.message.updateMany({
      where: {
        senderId: senderId,
        receiverId: receiverId,
        isRead: false
      },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/comm/advisors
router.get('/advisors', async (req, res) => {
  try {
    const advisors = await prisma.user.findMany({
      where: { role: 'ADVISOR' }
    });
    res.json(advisors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
