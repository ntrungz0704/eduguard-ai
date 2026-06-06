const express = require('express');
const router = express.Router();
const controller = require('./controller');
const dashboardController = require('./dashboard-controller');
const roadmapController = require('./roadmapController');

// API Tiến độ Lộ trình nghề nghiệp của lớp (Teacher Dashboard)
router.get('/class-roadmap-progress', roadmapController.getClassRoadmapProgress);

// API Phân tích nhanh (Raw Data)
router.post('/analyze/raw', controller.analyzeRaw);

// API Phân tích theo Sinh viên (DB Transcript)
router.get('/analyze/student/:mssv', controller.analyzeStudent);

// API Dashboard Demo
router.get('/dashboard/summary', dashboardController.getSummary);
router.post('/dashboard/intervene/:mssv', dashboardController.intervene);

module.exports = router;
