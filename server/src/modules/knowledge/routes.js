const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/courses/:courseId', controller.getCourseInfo);
router.get('/dependencies', controller.getDependencies);
router.get('/risk/:courseId', controller.getRiskChain);
router.get('/careers', controller.getAllCareers);
router.get('/careers/suggest/:mssv', controller.suggestCareers);
router.get('/careers/:goal/analyze/:mssv', controller.analyzeStudentCareer);
router.get('/careers/:goal', controller.getCareerPath);
router.get('/summary', controller.getSummary);

module.exports = router;
