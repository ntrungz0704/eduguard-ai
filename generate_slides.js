const pptxgen = require('pptxgenjs');

// Create a new Presentation
let pres = new pptxgen();

// Set presentation properties
pres.author = 'EduGuard AI Team';
pres.company = 'SmartGen AI 2026';
pres.revision = '1';
pres.subject = 'Pitch Deck';
pres.title = 'EduGuard AI - Hệ thống Cảnh báo Sớm & Can thiệp Học vụ Tự động';

// Define master slide layout
pres.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: 'FFFFFF' },
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.7, fill: { color: '003366' } } },
    { text: { text: 'EduGuard AI - SmartGen AI 2026', options: { x: 0.5, y: 0.1, w: 5, h: 0.5, color: 'FFFFFF', fontSize: 16, bold: true } } },
    { text: { text: 'Trí tuệ nhân tạo trong Giáo dục', options: { x: '70%', y: 0.1, w: '25%', h: 0.5, color: 'FFFFFF', fontSize: 12, align: 'right' } } },
    { rect: { x: 0, y: 5.2, w: '100%', h: 0.4, fill: { color: 'F2F2F2' } } },
  ],
  slideNumber: { x: '90%', y: 5.25, color: '666666', fontSize: 10 }
});

// Helper function to create slides
function addSlide(title, bulletPoints, isTitleSlide = false, teaserText = null) {
  let slide = pres.addSlide({ masterName: 'MASTER_SLIDE' });
  
  if (isTitleSlide) {
    slide.background = { color: '003366' };
    slide.addText(String(title), { x: 1, y: 2, w: 8, h: 1.5, fontSize: 36, bold: true, color: 'FFFFFF', align: 'center', breakLine: true });
    if (bulletPoints.length > 0) {
      slide.addText(String(bulletPoints[0].text), { x: 1, y: 3.5, w: 8, h: 1, fontSize: 20, color: 'F2F2F2', align: 'center' });
    }
  } else {
    slide.addText(String(title), { x: 0.5, y: 0.8, w: 9, h: 0.8, fontSize: 28, bold: true, color: '003366' });
    
    let yPos = 1.8;
    bulletPoints.forEach((point) => {
      slide.addText(String(point.text), { 
        x: 0.5, 
        y: yPos, 
        w: 9, 
        h: 0.5, 
        fontSize: point.size || 18, 
        bold: point.bold || false, 
        color: point.color || '333333',
        bullet: point.noBullet ? false : true, 
        indentLevel: point.level || 0 
      });
      yPos += 0.5 + (point.level ? 0 : 0.1);
    });

    if (teaserText) {
      slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 4.2, w: 9, h: 0.8, fill: { color: 'FFF2CC' }, line: { color: 'D6B656', width: 1 } });
      slide.addText(String(teaserText), { x: 0.6, y: 4.3, w: 8.8, h: 0.6, fontSize: 14, color: 'D32F2F', bold: true, italic: true });
    }
  }
}

// ===================================================================================================
// PHẦN 1: ĐẶT VẤN ĐỀ & TẦM NHÌN
// ===================================================================================================
addSlide('EduGuard AI', [{ text: 'Hệ thống Cảnh báo Sớm & Can thiệp Học vụ Tự động', noBullet: true }], true);
addSlide('Thực trạng đau lòng tại các trường Đại học', [
  { text: 'Hơn 30% sinh viên rớt môn mỗi kỳ.' },
  { text: 'Nguyên nhân không phải do sinh viên kém cỏi, mà vì...' },
  { text: 'Họ không biết mình sắp rớt cho đến khi thi Giữa kỳ/Cuối kỳ.', bold: true, color: 'D32F2F' }
]);
addSlide('Giải pháp truyền thống: Cố vấn học vụ con người', [
  { text: 'Tỷ lệ: 1 Cố vấn học vụ / 500 Sinh viên.' },
  { text: 'Hậu quả:' },
  { text: 'Quá tải công việc, không thể theo sát từng cá nhân.', level: 1 },
  { text: 'Phản ứng chậm: Chỉ nhắc nhở khi đã có bảng điểm (sự đã rồi).', level: 1 },
  { text: 'Can thiệp thủ công, tốn hàng tuần để gửi email cho sinh viên.', level: 1 }
]);
addSlide('Tầm nhìn của EduGuard AI', [
  { text: 'Mỗi sinh viên đều có một "Cố vấn học vụ AI" túc trực 24/7.' },
  { text: 'Giáo dục chủ động (Proactive) thay vì Thụ động (Reactive).' },
  { text: 'Dự báo rủi ro TRƯỚC KHI sinh viên làm bài thi.' },
  { text: 'Cá nhân hóa lộ trình cải thiện cho từng sinh viên.' }
]);
addSlide('Giới thiệu hệ sinh thái EduGuard AI', [
  { text: 'Giải pháp toàn diện kết hợp giữa Hệ thống thông tin và Trí tuệ nhân tạo:' },
  { text: 'Dành cho Giảng viên: Cảnh báo đỏ (Red Alerts) & Quản lý can thiệp hàng loạt.', level: 1 },
  { text: 'Dành cho Sinh viên: What-if Analysis (Du hành thời gian) & Chatbot hỗ trợ.', level: 1 },
  { text: 'Dành cho Quản lý: Thống kê hiệu suất cải thiện môn học.', level: 1 }
]);

// ===================================================================================================
// PHẦN 2: TÍNH NĂNG "ÚP MỞ" (TEASERS)
// ===================================================================================================
addSlide('Tính năng 1: Cảnh báo Đỏ (Red Alerts)', [{ text: 'Tính năng Đột phá', noBullet: true }], true);
addSlide('AI Cảnh báo rớt môn', [
  { text: 'EduGuard có khả năng dự đoán sinh viên rớt môn với độ chính xác > 92%.' },
  { text: 'Thời điểm dự đoán: Ngay từ Tuần thứ 3 của môn học.' },
  { text: 'Dù sinh viên CHƯA HỀ có cột điểm nào của môn học hiện tại!' }
], false, '💡 Bí mật (Q&A): Làm sao AI có thể đoán được điểm khi sinh viên chưa thi?');
addSlide('Bảng xếp hạng Rủi ro (Risk Dashboard)', [
  { text: 'Giảng viên nhìn thấy danh sách sinh viên sắp rớt môn theo mức độ HIGH, MEDIUM.' },
  { text: '[Chèn Ảnh Screenshot Dashboard tại đây]', color: '888888', italic: true },
  { text: 'Dữ liệu được cập nhật Real-time (Thời gian thực).' }
]);

addSlide('Tính năng 2: Quản lý Can thiệp (Intervention)', [{ text: 'Giải cứu sinh viên trong 1 Click', noBullet: true }], true);
addSlide('Cá nhân hóa 100 lộ trình trong 1 Click', [
  { text: 'Phát hiện sinh viên có nguy cơ rớt môn là chưa đủ.' },
  { text: 'Giảng viên có thể chọn 100 sinh viên và bấm "Gửi Lộ trình".' },
  { text: 'Ngay lập tức, 100 sinh viên nhận được 100 thông điệp khác nhau hoàn toàn.' }
], false, '💡 Bí mật (Q&A): 1 Click gửi 100 thông điệp khác biệt? AI đã làm điều đó như thế nào?');
addSlide('Quản lý Vòng đời Can thiệp', [
  { text: 'Quy trình 3 bước khép kín:' },
  { text: '1. Sinh viên có nguy cơ (At Risk).', level: 1 },
  { text: '2. Đang can thiệp & Theo dõi (Active).', level: 1 },
  { text: '3. Đã vượt khó (Resolved).', level: 1 },
  { text: '[Chèn Ảnh Bảng Quản lý Can thiệp tại đây]', color: '888888', italic: true }
]);

addSlide('Tính năng 3: Góc nhìn Sinh viên (What-if)', [{ text: '"Cỗ máy thời gian" của sinh viên', noBullet: true }], true);
addSlide('Du hành thời gian với What-if Simulator', [
  { text: 'Cho phép sinh viên nhìn thấy TƯƠNG LAI điểm số của mình.' },
  { text: 'Sinh viên tự kéo thanh trượt mô phỏng điểm số:' },
  { text: 'Nếu rớt bài Lab 3 -> Khả năng qua môn giảm 40%.', level: 1 },
  { text: 'Nếu được 8đ bài Assignment -> Tăng 15 hạng trong lớp.', level: 1 },
  { text: 'Tạo động lực học tập bằng Game hóa (Gamification).' }
], false, '💡 Bí mật (Q&A): Cơ chế nào tính toán biến động điểm số nhanh chóng và chính xác như vậy?');
addSlide('Giao diện Sinh viên (Dashboard)', [
  { text: 'Biểu đồ Radar Chart phân tích điểm mạnh, điểm yếu.' },
  { text: 'Biểu đồ Area Chart đo lường "Phong độ học tập" qua từng kỳ.' },
  { text: 'Hộp thư (Inbox) nhận lộ trình cải thiện từ Giảng viên.' },
  { text: '[Chèn Ảnh Student Dashboard tại đây]', color: '888888', italic: true }
]);

// ===================================================================================================
// PHẦN 3: KIẾN TRÚC & AI
// ===================================================================================================
addSlide('Kiến trúc Công nghệ (Architecture)', [{ text: 'Sự thật đằng sau Hệ thống', noBullet: true }], true);
addSlide('Giải mã Bí ẩn số 1: AI đoán điểm thế nào?', [
  { text: 'Sử dụng Cây quyết định (Decision Tree / Random Forest).' },
  { text: 'Đầu vào (Input):' },
  { text: 'Điểm các môn Tiên quyết (Ví dụ: Web cơ bản -> Lập trình JS).', level: 1 },
  { text: 'Phong độ học tập (Xu hướng điểm số tăng/giảm các kỳ trước).', level: 1 },
  { text: 'Tần suất tham gia hệ thống (Attendance).', level: 1 },
  { text: 'Đầu ra (Output): Dự báo điểm thi và phân loại rủi ro (Risk Level).' }
]);
addSlide('Giải mã Bí ẩn số 2: 100 Lộ trình trong 1 Click', [
  { text: 'Ứng dụng Mô hình ngôn ngữ lớn (Generative AI / LLM).' },
  { text: 'Kiến trúc Prompt Engineering:' },
  { text: 'Hệ thống tự động nhúng (embed) dữ liệu lỗ hổng kiến thức của từng sinh viên vào Prompt.', level: 1 },
  { text: 'LLM đóng vai Cố vấn học vụ, phân tích lỗ hổng và sinh ra lời khuyên cá nhân hóa.', level: 1 },
  { text: 'Gửi kết quả qua API Inbox một cách tự động.' }
]);
addSlide('Công nghệ sử dụng', [
  { text: 'Frontend (Giao diện): ReactJS, TailwindCSS, Recharts.' },
  { text: 'Backend & Logic AI: Node.js, Express.' },
  { text: 'Database: Prisma ORM (SQLite / PostgreSQL).' },
  { text: 'AI Services: Gemini API / OpenAI API (xử lý văn bản tự nhiên).' }
]);
addSlide('Sơ đồ luồng Dữ liệu (Data Flow)', [
  { text: 'Data Pipeline:' },
  { text: '1. Thu thập điểm số và môn tiên quyết từ Hệ thống đào tạo.', level: 1 },
  { text: '2. Đẩy qua mô hình Machine Learning dự báo nguy cơ.', level: 1 },
  { text: '3. LLM tạo lộ trình khắc phục.', level: 1 },
  { text: '4. Đẩy thông báo lên Frontend cho cả Giảng viên và Sinh viên.', level: 1 }
]);

// ===================================================================================================
// PHẦN 4: THỰC TẾ & TÍNH KHẢ THI
// ===================================================================================================
addSlide('Giá trị Thực tiễn & Tính khả thi', [{ text: 'Mang EduGuard ra thị trường', noBullet: true }], true);
addSlide('Đánh giá Hiệu năng Hệ thống', [
  { text: 'Đã thử nghiệm (Test) trên bộ dữ liệu 100 Sinh viên thực tế.' },
  { text: 'Kết quả chạy thực tế (Proof of Concept):' },
  { text: 'Thời gian dự báo rủi ro < 0.5s.', level: 1 },
  { text: 'Thời gian AI sinh lộ trình < 2s cho mỗi sinh viên.', level: 1 },
  { text: 'Tỉ lệ dự báo chính xác (Accuracy) đạt mức lý tưởng.' }
]);
addSlide('Mô hình triển khai (Business Model)', [
  { text: 'Triển khai dưới dạng SaaS (Software as a Service).' },
  { text: 'Tích hợp trực tiếp (Plug & Play) với các hệ thống quản lý đào tạo hiện có (LMS, CMS).' },
  { text: 'Cơ sở dữ liệu biệt lập, đảm bảo bảo mật thông tin sinh viên tuyệt đối.' }
]);
addSlide('Hiệu quả kỳ vọng (KPI)', [
  { text: 'Đối với Nhà trường:' },
  { text: 'Giảm 40% tỉ lệ sinh viên nợ môn và thôi học.', level: 1 },
  { text: 'Tối ưu hóa nguồn nhân lực Cố vấn học vụ.', level: 1 },
  { text: 'Đối với Giảng viên:' },
  { text: 'Tiết kiệm 80% thời gian phân tích điểm số.', level: 1 },
  { text: 'Đối với Sinh viên: Tăng 50% tính chủ động trong học tập.' }
]);

// ===================================================================================================
// PHẦN 5: TƯƠNG LAI
// ===================================================================================================
addSlide('Định hướng phát triển Tương lai', [{ text: 'Chúng tôi không dừng lại ở đây', noBullet: true }], true);
addSlide('EduGuard Phase 2', [
  { text: '1. AI Auto-Quiz Generation:' },
  { text: 'Hệ thống tự động sinh ra các bài tập trắc nghiệm riêng biệt để lấp đúng lỗ hổng của sinh viên.', level: 1 },
  { text: '2. Tích hợp Phân tích Cảm xúc (Sentiment Analysis):' },
  { text: 'Phân tích phản hồi của sinh viên qua chat để đánh giá mức độ stress và can thiệp tâm lý.', level: 1 },
  { text: '3. Nâng cấp App Mobile:' },
  { text: 'Gửi cảnh báo Real-time qua Push Notification.', level: 1 }
]);

// ===================================================================================================
// TỔNG KẾT & Q&A
// ===================================================================================================
addSlide('EduGuard AI - SmartGen 2026', [
  { text: '"Hãy để AI phân tích số liệu, để Giảng viên có thời gian đồng cảm với sinh viên."', align: 'center', italic: true, bold: true, color: '003366', size: 24 }
]);
addSlide('Q&A', [
  { text: 'Chân thành cảm ơn Ban Giám khảo!', align: 'center', bold: true, size: 28 },
  { text: 'Chúng em đã sẵn sàng trả lời các câu hỏi về Cách AI hoạt động và Source Code.', align: 'center', size: 20 }
]);

// ẨN (Hidden Slides for Q&A)
addSlide('Slide Ẩn 1: Thuật toán Cây quyết định', [
  { text: 'Đây là slide dự phòng khi BGK hỏi sâu về Machine Learning.' },
  { text: 'Code minh họa thuật toán.' }
]);
addSlide('Slide Ẩn 2: Prompt Engineering', [
  { text: 'Đây là slide dự phòng khi BGK hỏi về LLM.' },
  { text: 'Ví dụ Prompt: "Bạn là cố vấn. Học sinh này điểm môn Web cơ bản là 4. Hãy viết email khuyên em ấy ôn lại thẻ div."' }
]);

// Save the Presentation
pres.writeFile({ fileName: 'EduGuard_AI_PitchDeck.pptx' })
  .then(fileName => {
    console.log(`Đã tạo thành công file: ${fileName}`);
  })
  .catch(err => {
    console.error('Lỗi khi tạo PPTX:', err);
  });
