const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ============================================================
// CẤU HÌNH ĐƯỜNG DẪN VÀ THƯ MỤC
// ============================================================
const trainingDataPath = path.join(__dirname, '..', 'data', 'training_data.json');
const outputPersonalDir = path.join(__dirname, '..', '..', 'generated', 'personal_transcripts');
const outputClassDir = path.join(__dirname, '..', '..', 'generated', 'class_format_transcripts');

// Đảm bảo các thư mục đầu ra tồn tại
fs.mkdirSync(outputPersonalDir, { recursive: true });
fs.mkdirSync(outputClassDir, { recursive: true });

console.log('⚡ Đang khởi tạo công cụ tạo file điểm sinh viên mẫu...');

// Kiểm tra sự tồn tại của file dữ liệu
if (!fs.existsSync(trainingDataPath)) {
  console.error(`❌ Không tìm thấy file dữ liệu tại: ${trainingDataPath}`);
  process.exit(1);
}

// Nạp dữ liệu
const trainingData = JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));
const { students, curriculumOrder } = trainingData;

console.log(`📚 Đã nạp thành công dữ liệu hệ thống: ${students.length} sinh viên, ${curriculumOrder.length} môn học.`);

// ============================================================
// HÀM TẠO TÊN TIẾNG VIỆT ỔN ĐỊNH THEO MSSV
// ============================================================
const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô"];
const dem = ["Văn", "Thị", "Đức", "Minh", "Quốc", "Gia", "Thanh", "Ngọc", "Hữu", "Khánh", "Hải", "Thu"];
const ten = ["Anh", "Bình", "Cường", "Duy", "Dương", "Đạt", "Giang", "Hải", "Huy", "Khoa", "Lâm", "Minh", "Nam", "Phong", "Quân", "Sơn", "Tú", "Tuấn", "Vy", "Yến"];

function getStableName(mssv) {
  let hash = 0;
  for (let i = 0; i < mssv.length; i++) {
    hash = mssv.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  const hIndex = hash % ho.length;
  const dIndex = (hash >> 2) % dem.length;
  const tIndex = (hash >> 4) % ten.length;
  
  // Tránh đệm "Thị" đi kèm với các tên nam tính nếu muốn, nhưng đơn giản hóa bằng hash ổn định
  return `${ho[hIndex]} ${dem[dIndex]} ${ten[tIndex]}`;
}

// ============================================================
// LỌC RA 100 SINH VIÊN TỐT NHẤT ĐỂ LÀM MẪU (CÓ NHIỀU ĐIỂM SỐ NHẤT)
// ============================================================
const activeStudents = students
  .map(s => {
    // Đếm số môn học có điểm số thực tế hợp lệ (không phải null)
    const validScoresCount = Object.values(s.scores).filter(v => v !== null && v !== undefined).length;
    return {
      ...s,
      validScoresCount,
      name: s.name || getStableName(s.id)
    };
  })
  // Lọc các sinh viên có ít nhất 15 đầu điểm để đảm bảo mô hình có đủ dữ liệu học tập làm nền tảng tương quan
  .filter(s => s.validScoresCount >= 15)
  // Sắp xếp giảm dần theo số lượng môn học đã hoàn thành
  .sort((a, b) => b.validScoresCount - a.validScoresCount)
  // Lấy đúng 100 sinh viên hàng đầu
  .slice(0, 100);

console.log(`🎯 Đã chọn lọc được 100 sinh viên tích cực (đã hoàn thành >= 15 môn học) để tạo file mẫu.`);

// ============================================================
// DANH SÁCH CÁC MÔN HỌC CUỐI KHÓA SẼ ĐƯỢC ẨN ĐIỂM (SET NULL) ĐỂ CHẠY AI DỰ ĐOÁN
// ============================================================
const subjectsToHide = [
  "Dự án tốt nghiệp",
  "Thực tập tốt nghiệp",
  "Kỹ năng làm việc",
  "Khởi sự doanh nghiệp",
  "Lập trình Front-End Framework 2",
  "Lập trình Front-End Framework 1",
  "Lập trình TypeScript",
  "NodeJS & Restful Web Service"
];

console.log(`👁️ Các môn học cuối khóa sẽ được để trống (null) trong file Excel để AI dự báo:`);
subjectsToHide.forEach(sub => console.log(`   - ${sub}`));

// ============================================================
// TIẾN HÀNH XUẤT CÁC FILE EXCEL (.xlsx)
// ============================================================
activeStudents.forEach((student, index) => {
  const mssv = student.id;
  const name = student.name;
  
  // Chuẩn bị dữ liệu điểm đã ẩn đi các môn cuối khóa
  const cleanScores = { ...student.scores };
  subjectsToHide.forEach(sub => {
    cleanScores[sub] = null; // Ẩn điểm đi
  });

  // ------------------------------------------------------------
  // 1. FORMAT 1: BẢNG ĐIỂM CÁ NHÂN (DỌC) - Gồm 2 cột: Môn học, Điểm
  // ------------------------------------------------------------
  const personalRows = [];
  curriculumOrder.forEach(subName => {
    // Chỉ đưa vào các môn có tên trong scores của sinh viên
    const scoreVal = cleanScores[subName];
    personalRows.push({
      "Môn học": subName,
      "Điểm số": scoreVal !== null && scoreVal !== undefined ? scoreVal : ""
    });
  });

  const wsPersonal = XLSX.utils.json_to_sheet(personalRows);
  
  // Trang trí thêm độ rộng cột cho đẹp mắt
  wsPersonal['!cols'] = [
    { wch: 35 }, // Độ rộng cột Môn học
    { wch: 12 }  // Độ rộng cột Điểm số
  ];

  const wbPersonal = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbPersonal, wsPersonal, "Bảng điểm");
  
  const personalFilePath = path.join(outputPersonalDir, `${mssv}_transcript.xlsx`);
  XLSX.writeFile(wbPersonal, personalFilePath);

  // ------------------------------------------------------------
  // 2. FORMAT 2: BẢNG ĐIỂM LỚP (NGANG - 1 DÒNG DỮ LIỆU)
  // Gồm các cột: MSSV, Họ tên, và các Môn học...
  // ------------------------------------------------------------
  const classRow = {
    "MSSV": mssv,
    "Họ tên": name
  };

  curriculumOrder.forEach(subName => {
    const scoreVal = cleanScores[subName];
    classRow[subName] = scoreVal !== null && scoreVal !== undefined ? scoreVal : "";
  });

  const wsClass = XLSX.utils.json_to_sheet([classRow]);
  
  // Định cấu hình độ rộng các cột cho file bảng điểm ngang
  const colWidths = [
    { wch: 12 }, // MSSV
    { wch: 25 }  // Họ tên
  ];
  curriculumOrder.forEach(() => {
    colWidths.push({ wch: 20 }); // Độ rộng mỗi cột môn học
  });
  wsClass['!cols'] = colWidths;

  const wbClass = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbClass, wsClass, "Lớp học");
  
  const classFilePath = path.join(outputClassDir, `${mssv}_class.xlsx`);
  XLSX.writeFile(wbClass, classFilePath);

  if ((index + 1) % 20 === 0 || index === 99) {
    console.log(`✔️ Đã sinh file thành công cho ${index + 1}/100 sinh viên...`);
  }
});

console.log('\n🎉 THÀNH CÔNG! Đã tạo xong 100 file Excel điểm sinh viên mẫu!');
console.log(`📁 Bảng điểm cá nhân (cột dọc) tại: ${outputPersonalDir}`);
console.log(`📁 Bảng điểm lớp (hàng ngang) tại: ${outputClassDir}`);
console.log('💡 Bạn có thể upload hàng loạt các file này lên giao diện Web hoặc chạy script dự báo tự động tiếp theo.');
