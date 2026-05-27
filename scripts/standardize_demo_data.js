const fs = require('fs');
const path = require('path');

// Mảng môn tiên quyết được sử dụng chính thức trong regression.js
const ACADEMIC_PREREQUISITES = {
  "Lập trình PHP 1": ["Lập trình PHP cơ bản", "Cơ sở dữ liệu", "Xây dựng trang Web"],
  "Lập trình Javascript nâng cao": ["Lập trình cơ sở với JavaScript", "Nhập môn lập trình"],
  "Quản trị website": ["Lập trình PHP 1", "Thiết kế Web với HTML5 & CSS3", "Cơ sở dữ liệu", "Xây dựng trang Web", "Lập trình PHP cơ bản"],
  "Lập trình ECMAScript": ["Lập trình Javascript nâng cao", "Lập trình cơ sở với JavaScript", "Nhập môn lập trình"],
  "NodeJS & Restful Web Service": ["Lập trình Javascript nâng cao", "Cơ sở dữ liệu", "Lập trình ECMAScript"],
  "Lập trình Front-End Framework 1": ["Lập trình Javascript nâng cao", "Lập trình ECMAScript", "Thiết kế Web với HTML5 & CSS3", "Lập trình cơ sở với JavaScript"],
  "Lập trình Front-End Framework 2": ["Lập trình Front-End Framework 1", "Lập trình TypeScript"],
  "Lập trình TypeScript": ["Lập trình Javascript nâng cao", "Lập trình ECMAScript", "Lập trình cơ sở với JavaScript"],
  "Dự án 1": ["Lập trình PHP 1", "Thiết kế UI/UX", "Thiết kế Web với HTML5 & CSS3", "Cơ sở dữ liệu", "Lập trình cơ sở với JavaScript"],
  "Dự án tốt nghiệp": ["NodeJS & Restful Web Service", "Lập trình Front-End Framework 1", "Dự án 1 (TKTW)", "Cơ sở dữ liệu", "Lập trình PHP 1"]
};

function standardizeDemoData() {
  const dataPath = path.join(__dirname, '../server/src/datasets/training_data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Không tìm thấy training_data.json!');
    return;
  }

  const trainingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  let modifiedCount = 0;

  for (let student of trainingData.students) {
    let changed = false;

    for (let targetSubject of Object.keys(ACADEMIC_PREREQUISITES)) {
      const targetScore = student.scores[targetSubject];
      
      // Nếu môn này chưa học, bỏ qua
      if (targetScore === undefined || targetScore === null) continue;

      const prereqs = ACADEMIC_PREREQUISITES[targetSubject];
      
      // Kiểm tra tất cả môn tiên quyết
      let hasFailedPrereq = false;
      let minPrereqScore = 10;
      let hasMissingPrereq = false;

      for (let prereq of prereqs) {
        // Tên môn trong DB có thể có đuôi (TKTW), cần mapping nhẹ nếu ko match
        const exactPrereqName = Object.keys(student.scores).find(k => k.includes(prereq));
        if (exactPrereqName) {
          const prereqScore = student.scores[exactPrereqName];
          if (prereqScore === null || prereqScore === undefined) {
            hasMissingPrereq = true;
          } else {
            if (prereqScore < 5.0) {
              hasFailedPrereq = true;
            }
            if (prereqScore < minPrereqScore) {
              minPrereqScore = prereqScore;
            }
          }
        } else {
           hasMissingPrereq = true;
        }
      }

      // Xử lý logic chuẩn hóa dữ liệu demo
      if (hasMissingPrereq || hasFailedPrereq) {
        // Nếu không có điểm tiên quyết hoặc đã tạch môn tiên quyết
        // -> Đáng lý không được học môn sau. Set điểm môn sau = null để Graph chuẩn
        // Hoặc để demo Risk, set điểm rất thấp (1.0 - 4.0) nếu muốn thể hiện "Học lụi nhưng tạch"
        // Ở đây ta chọn: Rớt tiên quyết -> Điểm môn sau bị kéo tụt xuống mức tạch (2.0 - 4.5) 
        // để hệ thống ML bắt được Correlation.
        if (targetScore > 4.5) {
            const adjustedScore = Number((Math.random() * (4.5 - 2.0) + 2.0).toFixed(1));
            student.scores[targetSubject] = adjustedScore;
            changed = true;
        }
      } else if (!hasMissingPrereq && !hasFailedPrereq) {
        // Nếu qua tất cả tiên quyết
        // Điểm target nên tương đương với điểm thấp nhất của nhóm tiên quyết
        // Điều này giúp ML model (Pearson) có độ tin cậy r=0.8 đến 0.9 rất đẹp để demo.
        const targetDiff = Math.abs(targetScore - minPrereqScore);
        
        // Nếu điểm lệch quá 2 điểm so với tiên quyết thấp nhất -> Kéo về gần
        if (targetDiff > 2.0) {
            // Dao động quanh minPrereqScore [-1, +1]
            const adjustedScore = Number((Math.max(5.0, Math.min(10.0, minPrereqScore + (Math.random() * 2 - 1)))).toFixed(1));
            student.scores[targetSubject] = adjustedScore;
            changed = true;
        }
      }
    }
    
    if (changed) modifiedCount++;
  }

  // Save back
  fs.writeFileSync(dataPath, JSON.stringify(trainingData, null, 2));
  console.log(`✅ Standardized risk chain for ${modifiedCount}/${trainingData.students.length} students in training_data.json!`);
}

standardizeDemoData();
