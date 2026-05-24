# Kịch Bản Demo Đồ Án (5 Phút)

**Chuẩn bị:** Chạy lệnh `npm run boot` để khởi động hệ thống.

## Bước 1: Tổng quan Class Analytics (1.5 phút)
- **Hành động:** Mở trang Dashboard hệ thống.
- **Lời thoại:** "Đây là giao diện bảng điều khiển dành cho Cố vấn học tập (CVHT). Ngay khi đăng nhập, CVHT có thể thấy toàn cảnh tình hình lớp học thông qua Timeline Escalation và Risk Heatmap. Nhìn vào biểu đồ Timeline, ta có thể thấy số lượng cảnh báo có xu hướng tăng dần ở các tuần giữa kỳ. Hệ thống đã đánh giá mức độ rủi ro dựa trên nhiều tiêu chí như điểm thi, điểm danh."

## Bước 2: Đi sâu vào sinh viên rủi ro cao (1.5 phút)
- **Hành động:** Chuyển sang màn hình Tìm kiếm/Danh sách, chọn một sinh viên có nhãn `CRITICAL` (Ví dụ: PS47261). Mở trang phân tích cá nhân.
- **Lời thoại:** "Hệ thống EduGuard cung cấp cơ chế Explainable AI. Khi ta xem hồ sơ sinh viên PS47261, thay vì chỉ hiện 1 con số rủi ro vô hồn, hệ thống phân rã và chỉ ra nguyên nhân gốc rễ: Sinh viên bị điểm danh kém ở tuần 4, rớt môn tiên quyết WEB105. Dưới đây là lộ trình thời gian thực những rủi ro đã tích lũy."

## Bước 3: Giao tiếp qua AI Chatbot (1.5 phút)
- **Hành động:** Mở tab AI Assistant. Nhập: `Phân tích PS47261` sau đó nhập tiếp `Can thiệp như thế nào?`
- **Lời thoại:** "Hệ thống tích hợp một NLP Chatbot cục bộ có Session Memory. Em xin demo, đầu tiên ta nhập MSSV. Chatbot trả về hồ sơ rủi ro. Kế tiếp, ta gõ 'can thiệp như thế nào?'. Chatbot tự hiểu ngữ cảnh ta đang nói về PS47261 và gợi ý Checklist hành động cho CVHT như: gọi điện, sắp xếp học phụ đạo. Nó không trả lời rập khuôn mà phụ thuộc vào Risk Score của sinh viên đó."

## Bước 4: Chức năng Can thiệp (Intervention) (0.5 phút)
- **Hành động:** Ở trong trang sinh viên PS47261, bấm nút "Báo động Can Thiệp".
- **Lời thoại:** "Khi CVHT nhận diện được sự cấp bách, họ có thể tạo yêu cầu can thiệp. Việc này sẽ đưa sinh viên vào luồng theo dõi đặc biệt, thể hiện đây là một hệ thống Decision Support hoàn chỉnh, khép kín quy trình từ lúc phát hiện đến lúc giải quyết."
