const fs = require('fs');
const path = require('path');
const { prisma } = require('../src/infrastructure/database/prisma');

const courseNameToCode = {
  'Tin học': 'COM1071',
  'Nhập môn lập trình': 'COM108',
  'Tiếng Anh 1.1': 'ENT1128',
  'Nhập môn Công nghệ thông tin': 'ITI101',
  'Kỹ năng học tập': 'PDP102',
  'Giáo dục thể chất - Vovinam': 'VIE103',
  'Cơ sở dữ liệu': 'COM2012',
  'Tiếng Anh 1.2': 'ENT123',
  'Chính trị': 'VIE108',
  'Giáo dục chính trị': 'VIE108',
  'Xây dựng trang Web': 'WEB1013',
  'Lập trình cơ sở với JavaScript': 'WEB1043',
  'Lập trình PHP cơ bản': 'WEB108',
  'Tiếng Anh 2.1': 'ENT213',
  'Kỹ năng phát triển bản thân': 'PDP103',
  'Thiết kế UI/UX': 'WEB105',
  'Lập trình PHP 1': 'WEB2014',
  'Dự án mẫu (TKTW)': 'WEB2041',
  'Thiết kế Web với HTML5 & CSS3': 'WEB3023',
  'Thiết kế Web với HTML5&CSS3': 'WEB3023',
  'Tiếng Anh 2.2': 'ENT223',
  'Dự án 1 (TKTW)': 'PRO1014',
  'Quản trị website': 'WEB1023',
  'Marketing trên Internet': 'WEB2055',
  'Lập trình Javascript nâng cao': 'WEB2063',
  'Lập trình ECMAScript': 'WEB501',
  'Kỹ năng làm việc': 'PDP104',
  'Khởi sự doanh nghiệp': 'SYB3013',
  'Lập trình Front-End Framework 1': 'WEB2081',
  'Lập trình Front-End Framework 2': 'WEB2091',
  'Lập trình TypeScript': 'WEB502',
  'NodeJS & Restful Web Service': 'WEB503',
  'Thực tập tốt nghiệp (TKTW)': 'PRO116',
  'Dự án tốt nghiệp': 'PRO2201',
  'Pháp luật': 'VIE1026',
  'Giáo dục quốc phòng': 'VIE104'
};

async function main() {
  const csvPath = path.join(__dirname, '..', 'data', 'students3.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8').trim();
  const lines = csvContent.split('\n');

  if (lines.length < 2) return;

  const headers = lines[0].split(',').map(h => h.trim());
  const transactions = [];

  // Courses
  for (let i = 1; i < headers.length; i++) {
    const courseName = headers[i];
    if (!courseName) continue;
    const courseCode = courseNameToCode[courseName] || courseName.toUpperCase();
    
    let credits = 3;
    const lower = courseName.toLowerCase();
    if (lower.includes('thể chất') || lower.includes('vovinam') || lower.includes('vie103') || lower.includes('quốc phòng') || lower.includes('gdqp') || lower.includes('vie104') || lower.includes('kỹ năng')) {
      credits = lower.includes('quốc phòng') || lower.includes('gdqp') ? 4 : 2;
    } else if (lower.includes('thực tập') || lower.includes('dự án tốt nghiệp') || lower.includes('chính trị')) {
      credits = 5;
    }

    transactions.push(
      prisma.course.upsert({
        where: { id: courseCode },
        update: { name: courseName },
        create: { id: courseCode, name: courseName, credits, prerequisites: '' }
      })
    );
  }

  // Execute courses
  await prisma.$transaction(transactions);
  console.log('Courses synchronized.');
  transactions.length = 0; // clear

  for (let r = 1; r < lines.length; r++) {
    const row = lines[r].split(',');
    const mssv = row[0] ? row[0].trim().toUpperCase() : null;
    if (!mssv) continue;

    transactions.push(
      prisma.student.upsert({
        where: { mssv },
        update: {},
        create: { mssv, name: `Sinh viên ${mssv}`, classCode: 'WD18301' }
      })
    );

    for (let c = 1; c < headers.length; c++) {
      const courseName = headers[c];
      if (!courseName) continue;
      const courseCode = courseNameToCode[courseName] || courseName.toUpperCase();
      const cellVal = row[c] ? row[c].trim() : '';
      
      let value = null;
      let status = 'STUDYING';
      
      if (cellVal !== '') {
        value = parseFloat(cellVal);
        if (!isNaN(value)) {
           status = (value >= 5.0 || value === 1.0) ? 'PASSED' : 'FAILED';
        } else {
           value = null;
        }
      }

      transactions.push(
        prisma.score.upsert({
          where: { mssv_courseId_semester: { mssv, courseId: courseCode, semester: 'Summer 2025' } },
          update: { value, status },
          create: { mssv, courseId: courseCode, value, status, semester: 'Summer 2025' }
        })
      );
    }
  }

  console.log(`Executing ${transactions.length} operations in batches...`);
  // Batch size 500
  const BATCH = 500;
  for(let i = 0; i < transactions.length; i += BATCH) {
     await prisma.$transaction(transactions.slice(i, i + BATCH));
     console.log(`Processed ${i + BATCH}/${transactions.length}`);
  }
  
  console.log('✅ Import completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
