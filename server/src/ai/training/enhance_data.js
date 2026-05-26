const fs = require("fs");
const path = require("path");

const inputCsv = path.join(__dirname, "student_grades.csv");
const outputCsv = path.join(__dirname, "enhanced_student_grades.csv");

const raw = fs.readFileSync(inputCsv, "utf8");
const lines = raw.trim().split("\n");

// Add headers for the new columns
const header = lines[0].trim();
const newHeader = header + "attendance_rate,assignment_avg,quiz_avg,late_submission,missed_deadlines";

const enhancedLines = [newHeader];

// Helper to generate random number within range
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// Skip header (line 0)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const cols = line.split(",");
  let totalSubjects = 0;
  let sumGrades = 0;
  
  // Calculate true GPA for the student to generate realistic fake data
  for (let j = 1; j < cols.length; j++) {
    const val = cols[j].trim();
    if (val !== "" && val !== "*" && val !== "-") {
      const grade = parseFloat(val);
      if (!isNaN(grade)) {
        totalSubjects++;
        sumGrades += grade;
      }
    }
  }
  
  let gpa = 0;
  if (totalSubjects > 0) {
    gpa = sumGrades / totalSubjects;
  }
  
  // Logic nội suy dữ liệu hành vi dựa trên điểm thực tế (GPA)
  let attendance_rate, assignment_avg, quiz_avg, late_submission, missed_deadlines;

  if (gpa >= 8.0) {
    // Học sinh giỏi: Chuyên cần cao, điểm quá trình cao, ít nộp trễ
    attendance_rate = getRandomArbitrary(0.85, 1.0).toFixed(2);
    assignment_avg = getRandomArbitrary(7.5, 9.5).toFixed(1);
    quiz_avg = getRandomArbitrary(7.5, 9.5).toFixed(1);
    late_submission = Math.floor(getRandomArbitrary(0, 2));
    missed_deadlines = 0;
  } else if (gpa >= 5.0) {
    // Học sinh trung bình/khá: Có thể cúp học vài buổi, điểm quiz trung bình
    attendance_rate = getRandomArbitrary(0.65, 0.85).toFixed(2);
    assignment_avg = getRandomArbitrary(5.0, 7.5).toFixed(1);
    quiz_avg = getRandomArbitrary(5.0, 7.5).toFixed(1);
    late_submission = Math.floor(getRandomArbitrary(1, 4));
    missed_deadlines = Math.floor(getRandomArbitrary(0, 2));
  } else {
    // Học sinh kém/Yếu (Nguy cơ rớt): Chuyên cần thấp, điểm quá trình thấp, nộp trễ nhiều, bỏ deadline
    attendance_rate = getRandomArbitrary(0.40, 0.65).toFixed(2);
    assignment_avg = getRandomArbitrary(2.0, 5.0).toFixed(1);
    quiz_avg = getRandomArbitrary(2.0, 5.0).toFixed(1);
    late_submission = Math.floor(getRandomArbitrary(3, 8));
    missed_deadlines = Math.floor(getRandomArbitrary(1, 5));
  }
  
  // Đưa thêm nhiễu (noise) ngẫu nhiên 5% để model không bị overfitting hoàn toàn vào rule trên
  if (Math.random() < 0.05) {
      attendance_rate = getRandomArbitrary(0.3, 0.9).toFixed(2);
      quiz_avg = getRandomArbitrary(3.0, 8.0).toFixed(1);
  }

  const newLine = line + `${attendance_rate},${assignment_avg},${quiz_avg},${late_submission},${missed_deadlines}`;
  enhancedLines.push(newLine);
}

fs.writeFileSync(outputCsv, enhancedLines.join("\n"));
console.log(`✅ Đã nội suy và tạo thành công file: ${outputCsv}`);
