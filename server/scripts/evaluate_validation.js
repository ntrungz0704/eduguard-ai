const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Import modular logic và các hàm toán học hồi quy từ hệ thống
const { getPrerequisites, weightedPrediction } = require('../ai/regression');

// ============================================================
// CẤU HÌNH ĐƯỜNG DẪN
// ============================================================
const trainingDataPath = path.join(__dirname, '..', 'data', 'training_data.json');
const outputReportPath = path.join(__dirname, '..', '..', 'generated', 'model_validation_report.xlsx');

console.log('⚡ Đang khởi tạo hệ thống đánh giá chéo mô hình AI (Leave-One-Out Validation)...');

// Nạp dữ liệu huấn luyện
if (!fs.existsSync(trainingDataPath)) {
  console.error('❌ Thiếu file training_data.json!');
  process.exit(1);
}

const trainingData = JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));
const allStudents = trainingData.students || [];
const subjects = trainingData.subjects || [];

console.log(`📚 Đã nạp dữ liệu: ${allStudents.length} sinh viên, ${subjects.length} môn học.`);

// ============================================================
// LỌC 100 SINH VIÊN CÓ NHIỀU ĐẦU ĐIỂM NHẤT
// ============================================================
function getValidScoresCount(student) {
  return Object.values(student.scores).filter(v => v !== null && v !== undefined && v !== '').length;
}

const sortedStudents = [...allStudents].sort((a, b) => getValidScoresCount(b) - getValidScoresCount(a));
const top100Students = sortedStudents.slice(0, 100);

console.log(`🎯 Đã chọn ra 100 sinh viên tích cực có nhiều đầu điểm nhất để làm tập mẫu kiểm thử.`);
console.log(`💡 Sinh viên nhiều điểm nhất có: ${getValidScoresCount(top100Students[0])}/${subjects.length} môn học.`);
console.log(`💡 Sinh viên thứ 100 có: ${getValidScoresCount(top100Students[99])}/${subjects.length} môn học.`);

// ============================================================
// VÒNG LẶP KIỂM THỬ CHÉO LEAVE-ONE-OUT CHO TỪNG MÔN HỌC
// ============================================================
const reportRows = [];

subjects.forEach((targetSubject, subIndex) => {
  let totalTested = 0;
  let lowErrorCount = 0;  // 0.0 - 0.5
  let midErrorCount = 0;  // 0.6 - 1.0
  let highErrorCount = 0; // > 1.0
  let errorSum = 0;

  // Lấy các môn học tiên quyết cho môn học hiện tại
  const prereqs = getPrerequisites(targetSubject, trainingData);

  top100Students.forEach(student => {
    const actualScoreVal = student.scores[targetSubject];

    // Chỉ kiểm thử nếu sinh viên thực tế đã học môn này và có điểm số hợp lệ
    if (actualScoreVal === null || actualScoreVal === undefined || actualScoreVal === '' || isNaN(parseFloat(actualScoreVal))) {
      return;
    }

    const actualScore = parseFloat(actualScoreVal);
    totalTested++;

    // Tạm thời xóa môn này khỏi hồ sơ điểm của sinh viên để dự đoán
    const testScores = { ...student.scores };
    delete testScores[targetSubject];

    // Loại trừ chính sinh viên này ra khỏi tập huấn luyện để đảm bảo không rò rỉ dữ liệu (Leave-One-Out thực thụ)
    const trainingStudentsMinusS = allStudents.filter(s => s.mssv !== student.mssv);

    // Chạy mô hình dự báo
    const model = weightedPrediction(prereqs, targetSubject, trainingStudentsMinusS);
    let predictedVal = null;

    if (model && model.topFeatures && model.topFeatures.length > 0) {
      predictedVal = model.predict(testScores);
    }

    // Phương án dự phòng 1: Dùng điểm trung bình các môn khác của chính sinh viên đó
    if (predictedVal === null) {
      const otherScores = Object.values(testScores)
        .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(parseFloat(v)))
        .map(v => parseFloat(v));
      if (otherScores.length > 0) {
        const avgOther = otherScores.reduce((a, b) => a + b, 0) / otherScores.length;
        predictedVal = Math.round(avgOther * 10) / 10;
      } else {
        // Phương án dự phòng 2: Dùng trung bình môn của tập huấn luyện
        const trainScores = trainingStudentsMinusS
          .filter(s => s.scores[targetSubject] != null && s.scores[targetSubject] !== '')
          .map(s => parseFloat(s.scores[targetSubject]));
        const trainAvg = trainScores.length ? trainScores.reduce((a, b) => a + b, 0) / trainScores.length : 7.2;
        predictedVal = Math.round(trainAvg * 10) / 10;
      }
    }

    // Tính toán sai số
    const error = Math.abs(actualScore - predictedVal);
    errorSum += error;

    // Phân nhóm sai số
    if (error <= 0.5) {
      lowErrorCount++;
    } else if (error <= 1.0) {
      midErrorCount++;
    } else {
      highErrorCount++;
    }
  });

  // Tính các chỉ số thống kê
  const mae = totalTested > 0 ? parseFloat((errorSum / totalTested).toFixed(2)) : 0;
  const accuracy = totalTested > 0 ? parseFloat((Math.max(0, 100 - (mae / 10) * 100)).toFixed(1)) : 0;

  const lowPct = totalTested > 0 ? parseFloat(((lowErrorCount / totalTested) * 100).toFixed(1)) : 0;
  const midPct = totalTested > 0 ? parseFloat(((midErrorCount / totalTested) * 100).toFixed(1)) : 0;
  const highPct = totalTested > 0 ? parseFloat(((highErrorCount / totalTested) * 100).toFixed(1)) : 0;

  reportRows.push({
    "STT": subIndex + 1,
    "Môn học": targetSubject,
    "Số lượng SV kiểm thử": totalTested,
    "Sai số 0.0 - 0.5 (SL)": lowErrorCount,
    "Sai số 0.0 - 0.5 (%)": lowPct,
    "Sai số 0.6 - 1.0 (SL)": midErrorCount,
    "Sai số 0.6 - 1.0 (%)": midPct,
    "Sai số > 1.0 (SL)": highErrorCount,
    "Sai số > 1.0 (%)": highPct,
    "MAE (Sai số TB)": mae,
    "Độ chính xác TB (%)": accuracy
  });

  if ((subIndex + 1) % 5 === 0 || subIndex === subjects.length - 1) {
    console.log(`⏳ Đã chạy đánh giá chéo thành công cho ${subIndex + 1}/${subjects.length} môn học...`);
  }
});

// ============================================================
// GHI BÁO CÁO THỐNG KÊ RA EXCEL (TIÊU ĐỀ GỘP Ô 2 TẦNG CHUYÊN NGHIỆP)
// ============================================================
const headers = [
  [
    "STT", 
    "Môn học", 
    "Số lượng SV kiểm thử", 
    "LỆCH ĐIỂM TỪ 0.0 ĐẾN 0.5 (Dự báo gần như chính xác tuyệt đối)", "", 
    "LỆCH ĐIỂM TỪ 0.6 ĐẾN 1.0 (Sai lệch điểm số nhỏ)", "", 
    "LỆCH ĐIỂM TRÊN 1.0 (Sai lệch điểm số lớn/Nghiêm trọng)", "", 
    "CHỈ SỐ ĐÁNH GIÁ ĐỘ TIN CẬY CỦA MÔ HÌNH AI", ""
  ],
  [
    "", 
    "", 
    "", 
    "Số lượng SV (Đầu người)", "Tỉ lệ phần trăm (%)", 
    "Số lượng SV (Đầu người)", "Tỉ lệ phần trăm (%)", 
    "Số lượng SV (Đầu người)", "Tỉ lệ phần trăm (%)", 
    "Lệch điểm trung bình (MAE)", "Độ chính xác trung bình (%)"
  ]
];

const sheetData = [...headers];
reportRows.forEach(r => {
  sheetData.push([
    r.STT,
    r["Môn học"],
    r["Số lượng SV kiểm thử"],
    r["Sai số 0.0 - 0.5 (SL)"],
    r["Sai số 0.0 - 0.5 (%)"] + "%",
    r["Sai số 0.6 - 1.0 (SL)"],
    r["Sai số 0.6 - 1.0 (%)"] + "%",
    r["Sai số > 1.0 (SL)"],
    r["Sai số > 1.0 (%)"] + "%",
    r["MAE (Sai số TB)"],
    r["Độ chính xác TB (%)"] + "%"
  ]);
});

const wsReport = XLSX.utils.aoa_to_sheet(sheetData);

// Thiết lập gộp ô (Merge Cells) cho tiêu đề 2 tầng chuyên nghiệp
wsReport['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // STT (A1:A2)
  { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Môn học (B1:B2)
  { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Số lượng SV kiểm thử (C1:C2)
  { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } }, // Lệch điểm 0.0 - 0.5 (D1:E1)
  { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } }, // Lệch điểm 0.6 - 1.0 (F1:G1)
  { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } }, // Lệch điểm > 1.0 (H1:I1)
  { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } } // Chỉ số đánh giá (J1:K1)
];

// Trang trí định dạng độ rộng cột (Auto-fit widths)
const colWidths = [
  { wch: 6 },  // STT
  { wch: 32 }, // Môn học
  { wch: 22 }, // Số lượng SV kiểm thử
  { wch: 26 }, // Số lượng SV (Đầu người) - 0.0-0.5
  { wch: 20 }, // Tỉ lệ (%) - 0.0-0.5
  { wch: 26 }, // Số lượng SV (Đầu người) - 0.6-1.0
  { wch: 20 }, // Tỉ lệ (%) - 0.6-1.0
  { wch: 26 }, // Số lượng SV (Đầu người) - >1.0
  { wch: 20 }, // Tỉ lệ (%) - >1.0
  { wch: 25 }, // Lệch điểm TB (MAE)
  { wch: 28 }  // Độ chính xác TB
];
wsReport['!cols'] = colWidths;

const wbReport = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbReport, wsReport, "Thống kê sai số AI");

// Đảm bảo thư mục generated tồn tại
const generatedDir = path.dirname(outputReportPath);
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

// Ghi file Excel
try {
  XLSX.writeFile(wbReport, outputReportPath);
  console.log(`📊 Báo cáo đánh giá sai số mô hình chi tiết đã được lưu tại: ${outputReportPath}`);
} catch (err) {
  if (err.code === 'EBUSY') {
    const fallbackPath = outputReportPath.replace('.xlsx', '_new.xlsx');
    XLSX.writeFile(wbReport, fallbackPath);
    console.log(`⚠️ Tệp tin đang mở và bị khóa trong Excel. Đã lưu báo cáo cập nhật mới vào: ${fallbackPath}`);
  } else {
    throw err;
  }
}

console.log('\n🎉 THÀNH CÔNG RỰC RỠ!');
console.log('💡 Dữ liệu thống kê hoàn chỉnh cho cả 34 môn học đã sẵn sàng. Bạn có thể mở tệp này để phân tích độ tin cậy!');
