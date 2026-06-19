const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Import modular logic và các hàm toán học hồi quy từ hệ thống
const { getPrerequisites, calibrate, weightedPrediction } = require('../ai/regression');
const { calculateOfficialGPA } = require('../utils/dataService');

// ============================================================
// CẤU HÌNH ĐƯỜNG DẪN
// ============================================================
const trainingDataPath = path.join(__dirname, '..', 'data', 'training_data.json');
const modelCachePath = path.join(__dirname, '..', 'data', 'model_cache.json');
const inputClassDir = path.join(__dirname, '..', '..', 'generated', 'class_format_transcripts');
const outputSummaryPath = path.join(__dirname, '..', '..', 'generated', 'predictions_summary.xlsx');

console.log('⚡ Đang khởi tạo bộ chạy dự đoán điểm AI hàng loạt (EduGuard AI Engine)...');

// Kiểm tra thư mục đầu vào
if (!fs.existsSync(inputClassDir)) {
  console.error(`❌ Thư mục chứa các file điểm đầu vào không tồn tại: ${inputClassDir}`);
  console.error('💡 Vui lòng chạy script "node server/scripts/generate_transcripts.js" trước!');
  process.exit(1);
}

// Nạp dữ liệu huấn luyện và bộ đệm mô hình (Model Cache)
let trainingData = { students: [], subjects: [], curriculumOrder: [] };
let modelCache = {};

if (fs.existsSync(trainingDataPath)) {
  trainingData = JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));
  console.log(`📚 Đã nạp dữ liệu train: ${trainingData.students.length} SV`);
} else {
  console.error('❌ Thiếu file training_data.json!');
  process.exit(1);
}

if (fs.existsSync(modelCachePath)) {
  modelCache = JSON.parse(fs.readFileSync(modelCachePath, 'utf8'));
  console.log(`⚡ Đã nạp bộ đệm mô hình pre-trained: ${Object.keys(modelCache).length} môn học`);
}

// Danh sách 8 môn học chúng ta đã ẩn đi để chạy dự đoán
const subjectsToPredict = [
  "Dự án tốt nghiệp",
  "Thực tập tốt nghiệp",
  "Kỹ năng làm việc",
  "Khởi sự doanh nghiệp",
  "Lập trình Front-End Framework 2",
  "Lập trình Front-End Framework 1",
  "Lập trình TypeScript",
  "NodeJS & Restful Web Service"
];

// Đọc toàn bộ danh sách file điểm sinh viên mẫu (Class format)
const files = fs.readdirSync(inputClassDir).filter(f => f.endsWith('.xlsx'));
console.log(`📂 Tìm thấy ${files.length} file Excel điểm sinh viên để chạy dự toán.`);

if (files.length === 0) {
  console.error('❌ Không tìm thấy file điểm nào để xử lý!');
  process.exit(1);
}

// ============================================================
// HÀM TIÊN ĐOÁN ĐIỂM SỐ CHO MỘT MÔN CỤ THỂ CỦA MỘT SINH VIÊN
// ============================================================
function predictSubjectScore(studentScores, targetSubject) {
  const trainStudents = trainingData.students || [];
  const trainScores = trainStudents.filter(s => s.scores[targetSubject] != null).map(s => s.scores[targetSubject]);

  // Cách 1: Sử dụng bộ đệm mô hình đã huấn luyện sẵn (Fast Path)
  const cachedModel = modelCache[targetSubject];
  if (cachedModel) {
    const topFeatures = cachedModel.topFeatures;
    const activeFeatures = topFeatures.filter(f => studentScores[f.subject] !== null && studentScores[f.subject] !== undefined && studentScores[f.subject] !== '');

    if (activeFeatures.length > 0) {
      const activeTotalScore = activeFeatures.reduce((sum, f) => sum + f.hybridScore, 0) || 1;
      let predSum = 0;
      activeFeatures.forEach(f => {
        const x = parseFloat(studentScores[f.subject]);
        const val = Math.min(10, Math.max(0, f.a + f.b * x));
        predSum += (f.hybridScore / activeTotalScore) * val;
      });
      const rawPredicted = Math.round(predSum * 10) / 10;
      return calibrate(rawPredicted, trainScores);
    }
  }

  // Cách 2: Hồi quy tuyến tính lai động trên tập train (Slow Path)
  const prereqs = getPrerequisites(targetSubject, trainingData);
  // Định dạng lại scores của student về kiểu số để dự đoán
  const parsedScores = {};
  Object.entries(studentScores).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') {
      parsedScores[k] = parseFloat(v);
    }
  });

  const model = weightedPrediction(prereqs, targetSubject, trainStudents);
  if (model && model.topFeatures && model.topFeatures.length > 0) {
    const pred = model.predict(parsedScores);
    if (pred !== null) return pred;
  }

  // Phương án dự phòng 1: Dùng GPA trung bình của chính sinh viên đó
  const otherScores = Object.values(studentScores)
    .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(parseFloat(v)))
    .map(v => parseFloat(v));
  if (otherScores.length > 0) {
    const avgOther = otherScores.reduce((a, b) => a + b, 0) / otherScores.length;
    return Math.round(avgOther * 10) / 10;
  }

  // Phương án dự phòng 2: Dùng điểm trung bình môn của tập huấn luyện
  const trainAvg = trainScores.length ? trainScores.reduce((a, b) => a + b, 0) / trainScores.length : 7.2;
  return Math.round(trainAvg * 10) / 10;
}

// ============================================================
// TIẾN HÀNH ĐỌC FILE VÀ DỰ ĐOÁN CHO TỪNG SINH VIÊN
// ============================================================
const summaryRows = [];

files.forEach((filename, index) => {
  const filePath = path.join(inputClassDir, filename);
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  if (rows.length === 0) return;
  const rawStudent = rows[0]; // File class ngang chỉ có 1 dòng dữ liệu sinh viên

  const mssv = rawStudent["MSSV"];
  const name = rawStudent["Họ tên"];

  // Tạo một bản sao điểm số gốc của sinh viên
  const studentScores = { ...rawStudent };
  delete studentScores["MSSV"];
  delete studentScores["Họ tên"];

  // Dữ liệu phục vụ tính toán
  const predictions = {};
  const failedSubjects = [];
  let completedCount = 0;

  // Đếm số môn đã học thực tế
  Object.entries(studentScores).forEach(([sub, score]) => {
    if (score !== null && score !== undefined && score !== '' && !subjectsToPredict.includes(sub)) {
      completedCount++;
    }
  });

  // Chạy mô hình dự đoán cho 8 môn học bị thiếu
  subjectsToPredict.forEach(sub => {
    const predictedVal = predictSubjectScore(studentScores, sub);
    predictions[sub] = predictedVal;
    
    if (predictedVal < 5.0) {
      failedSubjects.push(`${sub} (${predictedVal}đ)`);
    }
  });

  // Điểm số đầy đủ (kết hợp thực tế + dự đoán)
  const fullScores = { ...studentScores };
  subjectsToPredict.forEach(sub => {
    fullScores[sub] = predictions[sub];
  });

  // Tính GPA thực tế và GPA dự phóng
  const gpaActual = calculateOfficialGPA(studentScores).gpa;
  const gpaProjected = calculateOfficialGPA(fullScores).gpa;

  // Tạo dòng báo cáo
  const reportRow = {
    "MSSV": mssv,
    "Họ tên": name,
    "GPA Hiện tại (Thực tế)": gpaActual,
    "GPA Dự phóng (AI dự báo)": gpaProjected,
    "Môn Đã học": completedCount,
    "Môn Dự đoán": subjectsToPredict.length,
    "Môn Nguy cơ trượt": failedSubjects.length,
    "Danh sách môn nguy cơ": failedSubjects.join(', ') || 'Không có (An toàn)'
  };

  // Thêm chi tiết điểm dự đoán của 8 môn cuối khóa
  subjectsToPredict.forEach(sub => {
    reportRow[`Dự đoán: ${sub}`] = predictions[sub];
  });

  summaryRows.push(reportRow);

  if ((index + 1) % 20 === 0 || index === files.length - 1) {
    console.log(`⏳ Đã chạy dự báo thành công cho ${index + 1}/${files.length} sinh viên...`);
  }
});

// Sắp xếp kết quả báo cáo tổng hợp theo thứ tự GPA dự phóng giảm dần (Từ giỏi đến yếu)
summaryRows.sort((a, b) => b["GPA Dự phóng (AI dự báo)"] - a["GPA Dự phóng (AI dự báo)"]);

// ============================================================
// GHI BÁO CÁO TỔNG HỢP RA EXCEL
// ============================================================
const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

// Trang trí định dạng độ rộng cột cho báo cáo tổng hợp
const colWidths = [
  { wch: 12 }, // MSSV
  { wch: 25 }, // Họ tên
  { wch: 22 }, // GPA Hiện tại
  { wch: 22 }, // GPA Dự phóng
  { wch: 15 }, // Môn Đã học
  { wch: 15 }, // Môn Dự đoán
  { wch: 18 }, // Môn Nguy cơ trượt
  { wch: 45 }  // Danh sách môn nguy cơ
];
subjectsToPredict.forEach(() => {
  colWidths.push({ wch: 30 }); // Độ rộng mỗi cột môn dự báo
});
wsSummary['!cols'] = colWidths;

const wbSummary = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbSummary, wsSummary, "Báo cáo dự toán AI");

// Ghi file báo cáo
XLSX.writeFile(wbSummary, outputSummaryPath);

console.log('\n🎉 THÀNH CÔNG RỰC RỠ!');
console.log(`📊 Báo cáo dự báo tổng hợp đã được lưu tại: ${outputSummaryPath}`);
console.log('💡 Mô hình đã đánh giá xong toàn bộ 100 sinh viên. Bạn có thể mở file này để kiểm chứng độ chính xác!');
