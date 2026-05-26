# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG HỆ THỐNG EDUGUARD DSS

Hệ thống **EduGuard DSS (Decision Support System)** được chia thành 2 phân hệ chính dành cho 2 đối tượng người dùng: **Giảng viên/Cố vấn học tập** và **Sinh viên**. 

Dưới đây là cẩm nang thao tác chuẩn để bạn có thể khai thác tối đa sức mạnh của AI trong hệ thống.

---

## PHẦN 1: DÀNH CHO GIẢNG VIÊN & CỐ VẤN HỌC TẬP

### 1. Đăng nhập và truy cập Workspace
- Truy cập vào trang chủ hệ thống.
- Chọn vai trò **Giảng viên** và đăng nhập.
- Màn hình chính (Dashboard) sẽ hiển thị bức tranh toàn cảnh về tình hình học vụ của toàn bộ lớp học mà bạn quản lý.

### 2. Sử dụng Dashboard Phân tích Lớp học (Class Analytics)
Tại Dashboard, bạn sẽ thấy các biểu đồ trực quan:
- **Risk Breakdown (Biểu đồ tròn):** Cho thấy tỷ lệ sinh viên đang ở mức rủi ro Critical (Nguy kịch), High, Medium, Low.
- **Academic Timeline (Biểu đồ đường):** Hiển thị xu hướng tăng/giảm số lượng sinh viên bị cảnh báo học vụ qua từng tuần.
- **Class Heatmap / Danh sách nguy cơ:** Liệt kê các sinh viên có **Risk Score** cao nhất để bạn ưu tiên can thiệp.

### 3. Xem hồ sơ học bạ chi tiết của 1 Sinh Viên (Student 360 View)
- Bấm vào thanh tìm kiếm ở Header (hoặc nhấn phím tắt `/`), nhập MSSV (ví dụ: `PS47261`) hoặc Tên sinh viên.
- Nhấp vào sinh viên tương ứng để mở **Hồ sơ 360 độ**.
- Tại đây bạn sẽ xem được điểm thành phần, GPA, tiến độ tín chỉ và đặc biệt là **Mô hình Dữ liệu Dự báo (Predictive Chart)**.

### 4. Giao tiếp với Trợ lý NLP (Teacher AI)
Đây là tính năng cốt lõi. Hãy mở khung Chat (hình robot) ở góc phải.
Bạn có thể hỏi AI (bằng ngôn ngữ tự nhiên tiếng Việt):
- *"Phân tích tình hình môn học hiện tại của lớp"*
- *"Liệt kê cho tôi 5 sinh viên có nguy cơ rớt môn cao nhất"*
- *"Môn học nào đang là nút thắt cổ chai (bottleneck) khiến nhiều sinh viên rớt nhất?"*
- *"Phân tích hồ sơ của em PS47261 và soạn giúp tôi một email cảnh báo gửi cho phụ huynh em ấy."*
> **Mẹo:** AI có khả năng nhớ ngữ cảnh. Nếu bạn vừa mở hồ sơ của sinh viên A, AI sẽ tự động hiểu bạn đang muốn hỏi về sinh viên A mà không cần bạn phải gõ lại MSSV.

---

## PHẦN 2: DÀNH CHO SINH VIÊN

### 1. Đăng nhập
- Đăng nhập với tư cách **Sinh viên** (Sử dụng MSSV, ví dụ: PS47261).
- Trải nghiệm của sinh viên sẽ mang tính **cá nhân hóa hoàn toàn**. Hệ thống tự động khóa (lock) dữ liệu, sinh viên chỉ xem được điểm số của chính mình.

### 2. Giao tiếp với Trợ lý AI (Student AI)
Không giống như AI của giảng viên mang tính "Quản lý", AI của Sinh viên đóng vai trò là "Người đồng hành".
Tại khung Chat, sinh viên có thể hỏi:
- *"Đánh giá chi tiết năng lực học thuật của tôi hiện tại?"*
- *"Học kỳ này tôi đang có nguy cơ rớt môn nào cao nhất?"*
- *"Làm sao để tôi kéo điểm GPA lên 8.0?"*
- *"Tôi đang bị nợ môn Web, điều này ảnh hưởng thế nào đến kỳ sau?"*

AI sẽ tự động tính toán, vẽ biểu đồ xu hướng GPA của bạn ngay trong khung chat và đưa ra các lời khuyên thực tế nhất (kèm theo lời động viên).

---

## PHẦN 3: XỬ LÝ SỰ CỐ (TROUBLESHOOTING)

**1. Khung chat không hiển thị biểu đồ mà hiện ô trống?**
- Hệ thống đã được nâng cấp cơ chế parse JSON tự động. Nếu biểu đồ không hiện, hãy thử tải lại trang (F5).

**2. Báo lỗi `[vite] http proxy error: /api/...` màu đỏ trong console khi khởi chạy?**
- Lỗi này do cổng 3000 đang bị kẹt bởi một tiến trình cũ.
- **Cách khắc phục:** Mở Terminal, gõ lệnh `npm run kill` để hệ thống tự động dò và tiêu diệt tiến trình rác. Sau đó gõ lại `npm run boot`.

**3. Làm sao để Train thêm dữ liệu cho AI Chatbot?**
- Để dạy AI hiểu thêm các câu hỏi mới, hãy vào file `server/src/jobs/train_nlp.js`, thêm câu hỏi (utterance) và câu trả lời (answer).
- Sau đó mở Terminal và chạy lệnh: `npm run train:chat` để AI tự học lại (mất khoảng 1 giây).

---
*(Tài liệu này được tạo tự động bởi Hệ thống EduGuard AI)*
