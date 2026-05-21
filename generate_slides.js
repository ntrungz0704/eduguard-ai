const pptxgen = require('pptxgenjs');

let pres = new pptxgen();

// Settings
pres.author = 'EduGuard AI Team';
pres.company = 'SmartGen AI 2026';
pres.title = 'EduGuard AI Pitch Deck';
pres.layout = 'LAYOUT_16x9';

// Define master slide layout (DARK MODE)
pres.defineSlideMaster({
  title: 'MASTER_DARK',
  background: { color: '0A0F1C' }, // Very dark blue/black
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.6, fill: { color: '1A233A' } } },
    { text: { text: 'EduGuard AI - SmartGen AI 2026', options: { x: 0.5, y: 0.1, w: 5, h: 0.4, color: 'FFFFFF', fontSize: 14, bold: true } } },
    { text: { text: 'Trí tuệ Nhân tạo trong Giáo dục', options: { x: '70%', y: 0.1, w: '25%', h: 0.4, color: '8B5CF6', fontSize: 12, align: 'right', bold: true } } },
    { rect: { x: 0, y: 5.3, w: '100%', h: 0.3, fill: { color: '1A233A' } } }
  ],
  slideNumber: { x: '90%', y: 5.35, color: '9CA3AF', fontSize: 10 }
});

// Helper function to create slides
function addSlide(title, points = [], imagePath = null, teaser = null) {
  let slide = pres.addSlide({ masterName: 'MASTER_DARK' });
  
  slide.addText(String(title), { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, bold: true, color: '60A5FA' }); // Blue title
  
  let yPos = 1.6;
  
  if (imagePath) {
    // If there is an image, we place it large and center-ish
    // Text goes to the left or we just show the image
    if (points.length > 0) {
      slide.addImage({ path: imagePath, x: 4.5, y: 1.5, w: 5, h: 3.2 });
      points.forEach((p) => {
        slide.addText(String(p.text), { x: 0.5, y: yPos, w: 3.8, h: 0.4, fontSize: p.size || 16, color: p.color || 'E5E7EB', bullet: true });
        yPos += 0.5;
      });
    } else {
      // Full width image
      slide.addImage({ path: imagePath, x: 0.5, y: 1.5, w: 9, h: 4 });
    }
  } else {
    // No image, text takes full width
    points.forEach((p) => {
      slide.addText(String(p.text), { 
        x: 0.5, y: yPos, w: 9, h: 0.5, 
        fontSize: p.size || 20, 
        color: p.color || 'E5E7EB', 
        bullet: p.noBullet ? false : true,
        bold: p.bold || false,
        indentLevel: p.level || 0
      });
      yPos += 0.6 + (p.level ? 0 : 0.1);
    });
  }

  if (teaser) {
    slide.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.6, w: 9, h: 0.6, fill: { color: '312E81' } });
    slide.addText(String(teaser), { x: 0.6, y: 4.6, w: 8.8, h: 0.6, fontSize: 14, color: 'FCD34D', bold: true, italic: true });
  }
}

// TITLE SLIDE
let slide1 = pres.addSlide({ masterName: 'MASTER_DARK' });
slide1.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '0A0F1C' } });
slide1.addText('EduGuard AI', { x: 0, y: 2, w: '100%', h: 1, fontSize: 54, bold: true, color: '60A5FA', align: 'center', shadow: {type:'outer', color:'3B82F6', blur:10, offset:0} });
slide1.addText('Hệ thống Cảnh báo Sớm & Can thiệp Học vụ Tự động', { x: 0, y: 3.2, w: '100%', h: 0.5, fontSize: 24, color: 'A78BFA', align: 'center' });

// 1. ĐẶT VẤN ĐỀ
addSlide('Nỗi đau của Giáo dục hiện đại', [
  { text: 'Hơn 30% sinh viên rớt môn mỗi kỳ không phải vì yếu kém.', size: 24 },
  { text: 'Nguyên nhân: Họ không biết mình sắp rớt cho đến khi quá muộn!', color: 'F87171', bold: true, size: 28, noBullet: true },
  { text: '1 Cố vấn học vụ / 500 Sinh viên -> Quá tải, can thiệp chậm trễ.', size: 20 },
  { text: 'EduGuard cung cấp Cố vấn học vụ AI 24/7 cho từng cá nhân.', color: '34D399', bold: true, size: 22 }
]);

const P = 'C:\\Users\\ntrun\\.gemini\\antigravity\\brain\\6a3cebd4-811a-483c-ab46-00a78e9c6dc1\\';

// 2. TÍNH NĂNG ÚP MỞ
addSlide('Tổng quan Hệ thống (Admin Dashboard)', [], P+'media__1779362722187.png');

addSlide('Tính năng 1: Cảnh báo Đỏ (Red Alerts)', [
  { text: 'Dự đoán chính xác sinh viên rớt môn ngay từ Tuần 3.' },
  { text: 'Hoạt động ngay cả khi CHƯA thi giữa kỳ.' }
], P+'media__1779366518227.png', '💡 Bí mật (Q&A): Chưa thi thì lấy data đâu mà dự đoán? -> Dự đoán bằng các môn Tiên quyết trong quá khứ!');

addSlide('Tính năng 2: Quản lý Can thiệp Học vụ', [
  { text: 'Quy trình khép kín: Có nguy cơ -> Đang can thiệp -> Vượt khó.' },
  { text: '1 Click chuột tạo ra 100 Lộ trình khắc phục hoàn toàn khác biệt.' }
], P+'media__1779366522012.png', '💡 Bí mật (Q&A): 1 Click gửi 100 thư không bị spam giống nhau? -> LLM tự sinh nội dung dựa trên điểm yếu riêng!');

addSlide('Tính năng 3: What-if & Cỗ máy Thời gian', [], P+'media__1779366579811.png', '💡 Sinh viên tự kéo thanh trượt giả lập điểm sắp tới, AI lập tức dự báo GPA tương lai.');

addSlide('Trợ lý AI Đồng hành 24/7 (Chatbot)', [], P+'media__1779366583311.png', '💡 Chatbot đóng vai Cố vấn học vụ, tư vấn phương pháp học tập tức thì.');

// 3. KIẾN TRÚC & AI
addSlide('Kiến trúc Lõi (AI Engine)', [
  { text: 'Sử dụng Thuật toán Machine Learning dựa trên hệ số Pearson.' },
  { text: 'Phát hiện Môn học rào cản (Prerequisites).' }
], P+'media__1779366525161.png');

addSlide('Đánh giá Thuật toán: Độ chính xác > 92%', [], P+'media__1779366678488.png');

addSlide('Chi tiết Phân bổ Sai số', [], P+'media__1779366692299.png');

addSlide('Số liệu Kiểm chứng Thực tế', [], P+'media__1779366699427.png', '💡 Kiểm tra chéo trên 649 sinh viên với 3,272 lượt test.');

// 4. TỔNG KẾT
let slideEnd = pres.addSlide({ masterName: 'MASTER_DARK' });
slideEnd.addText('Giá trị Cốt lõi', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, bold: true, color: '60A5FA' });
slideEnd.addText('NHANH - TRÍ TUỆ - CÁ NHÂN HÓA', { x: 0, y: 2, w: '100%', h: 1, fontSize: 36, color: '34D399', align: 'center', bold: true });
slideEnd.addText('EduGuard AI tự động lấp lỗ hổng kiến thức, giảm 40% tỉ lệ nợ môn.', { x: 0, y: 3.5, w: '100%', h: 0.5, fontSize: 20, color: 'E5E7EB', align: 'center' });

let slideQA = pres.addSlide({ masterName: 'MASTER_DARK' });
slideQA.addText('Q & A', { x: 0, y: 2, w: '100%', h: 1, fontSize: 60, bold: true, color: 'FCD34D', align: 'center' });
slideQA.addText('Chân thành cảm ơn Ban Giám khảo SmartGen 2026', { x: 0, y: 3.5, w: '100%', h: 0.5, fontSize: 24, color: 'FFFFFF', align: 'center' });

pres.writeFile({ fileName: 'EduGuard_AI_PitchDeck_Visual.pptx' })
  .then(fileName => { console.log(`Created: ${fileName}`); })
  .catch(err => { console.error('Error:', err); });
