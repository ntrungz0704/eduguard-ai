const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'eduguard_dev_secret_change_in_production_must_be_32_chars';

// Sign token for ADVISOR role
const token = jwt.sign(
  { id: 'advisor-id-1', email: 'advisor@eduguard.ai', role: 'ADVISOR' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('Generated mock JWT token for testing.');

function testEndpoint(url, name) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-role': 'ADVISOR',
        'x-user-id': 'advisor-id-1'
      }
    };

    http.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`[PASS] ${name} parsed successfully. Status: ${res.statusCode}`);
          resolve(parsed);
        } catch (e) {
          console.error(`[FAIL] ${name} parse failed. Status: ${res.statusCode}`, e.message);
          console.log('Raw response excerpt:', data.substring(0, 500));
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`[FAIL] ${name} network error:`, err.message);
      resolve(null);
    });
  });
}

async function runTests() {
  console.log('Testing DSS API endpoints...');
  
  const dssReport = await testEndpoint('http://localhost:3000/api/students/PC07988/dss-report', 'Student PC07988 DSS Report');
  if (dssReport) {
    console.log('  Academic Health Rating:', dssReport.academicHealth?.rating);
    console.log('  Academic Health Score:', dssReport.academicHealth?.score);
    console.log('  GPA Trend Datapoints:', dssReport.trendAnalysis?.trendData?.length);
    console.log('  Knowledge Dependency Blocked Courses Count:', dssReport.knowledgeDependency?.blockedCourses?.length);
    console.log('  Root Cause Analysis:', dssReport.rootCauseAnalysis);
    console.log('  Risk Contributors Count:', dssReport.riskContributors?.length);
    console.log('  Future Course Impact Count:', dssReport.futureCourseImpact?.length);
    console.log('  Graduation Risk Level:', dssReport.graduationRisk?.level);
    console.log('  Recovery Roadmap Phases Count:', dssReport.recoveryRoadmap?.length);
    console.log('  Program-Level Comparison Courses Count:', dssReport.programLevelComparison?.length);
  }

  console.log('\n----------------------------------------\n');

  const programAnalytics = await testEndpoint('http://localhost:3000/api/program-analytics', 'Program Analytics');
  if (programAnalytics) {
    console.log('  Total Students Analytics:', programAnalytics.totalStudents);
    console.log('  Risk Level Distribution:', programAnalytics.riskLevelDistribution);
    console.log('  Top 10 Failed Courses Count:', programAnalytics.topFailedCourses?.length);
    console.log('  Top 10 Weakest CLOs Count:', programAnalytics.topWeakestCLOs?.length);
    console.log('  Top 10 Skill Gaps Count:', programAnalytics.topSkillGaps?.length);
    console.log('  Top 10 Prerequisite Bottlenecks Count:', programAnalytics.topPrerequisiteBottlenecks?.length);
  }
}

runTests();
