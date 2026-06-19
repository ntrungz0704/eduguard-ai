const { prisma } = require('../../infrastructure/database/prisma');
const advisorService = require('./service');

exports.getSummary = async (req, res) => {
  try {
    const totalStudents = await prisma.student.count();
    
    // Mocking summary details but using real totalStudents
    const summary = {
      totalStudents: totalStudents,
      riskDistribution: {
        URGENT: 63,
        HIGH: 124,
        MEDIUM: 342,
        LOW: 971
      },
      topAtRiskStudents: [
        { mssv: "SE182001", riskScore: 0.63, priority: "HIGH" },
        { mssv: "SE182002", riskScore: 0.95, priority: "URGENT" }
      ]
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.intervene = async (req, res) => {
  try {
    const { mssv } = req.params;
    const interventionService = require('./intervention-service');
    
    // Call analysis to get current state
    const analysis = await advisorService.analyzeStudent(mssv, "Backend Developer");
    
    // Generate intervention draft
    const result = await interventionService.generateIntervention(mssv, analysis);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
