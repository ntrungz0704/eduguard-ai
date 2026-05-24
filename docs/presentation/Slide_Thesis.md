# SLIDE THESIS - EduGuard AI: Hệ thống DSS Giám sát Rủi ro Học thuật Cảnh báo Sớm

## Slide 1: Tiêu đề & Giới thiệu
- **Tên Đề tài:** EduGuard AI – Ứng dụng AI & Data Analytics trong Giám sát Rủi ro Học thuật và Can thiệp Sớm.
- **Sinh viên thực hiện:** [Tên của bạn]
- **Giảng viên hướng dẫn:** [Tên Giảng viên]
- **Logo trường & Hình ảnh minh họa:** UI mượt mà của hệ thống (Dashboard).

## Slide 2: Vấn đề Thực tiễn (Pain Points)
- **Cố vấn học vụ quá tải:** 1 CVHT quản lý >300 sinh viên, không thể theo dõi sát sao từng người.
- **Phát hiện rủi ro chậm trễ:** Thường chỉ biết sinh viên gặp nguy hiểm khi đã **Rớt môn** hoặc **Thiếu chuyên cần trầm trọng**, lúc này đã quá muộn để cứu vãn.
- **Rủi ro dây chuyền:** Rớt môn tiên quyết (vd: Lập trình cơ bản) sẽ gây hiệu ứng domino rớt hàng loạt các môn chuyên ngành sau đó.

## Slide 3: Giải pháp - EduGuard AI (DSS)
- Hệ thống hỗ trợ ra quyết định (Decision Support System) theo thời gian thực.
- Theo dõi toàn diện: **Điểm số (GPA)**, **Chuyên cần**, **Môn tiên quyết**.
- Dự báo tự động bằng Machine Learning & Phân tích dữ liệu.
- Kích hoạt cảnh báo tự động thay vì đợi con người rà soát thủ công.

## Slide 4: Kiến trúc Hệ thống (System Architecture)
*(Chèn sơ đồ Architecture nhẹ nhàng vào đây)*
- **Frontend:** React + Vite, TailwindCSS, Recharts (Lazy loading, Virtualized render siêu mượt).
- **Backend:** Node.js, Express, Prisma ORM (Kiến trúc chuẩn Enterprise, Module hóa rõ ràng).
- **AI/DSS Engine:** Thuật toán phân tích chuỗi rủi ro (Dependency Chain), đánh giá trọng số điểm/chuyên cần.

## Slide 5: Tính năng cốt lõi 1 - Dashboard Cảnh báo Sớm
- Hiển thị Timeline leo thang rủi ro qua từng tuần (Tuần 1 - Tuần 8).
- **Risk Heatmap:** Nhìn thoáng qua là biết ngay sinh viên nào đang "báo động đỏ".
- **Cảnh báo khẩn cấp:** Phân loại tự động sinh viên cần can thiệp trong vòng 24h.

## Slide 6: Tính năng cốt lõi 2 - AI Personal Assistant
- Chatbot Context-Aware: Không phải chatbot trả lời chung chung.
- Nó "đọc" trực tiếp học bạ của từng cá nhân, biết rõ lỗ hổng kiến thức ở môn nào.
- Sinh ra **Lộ trình phụ đạo** và **Biên bản tư vấn PDF** tự động.

## Slide 7: Demo Flow (Thực chiến)
*(Giới thiệu nhanh các bước sẽ thực hiện trong phần Live Demo)*
1. Truy cập Dashboard, xem cảnh báo toàn trường.
2. Click vào 1 sinh viên "Nguy cơ cao".
3. Mở Personal Assistant, yêu cầu AI giải thích vì sao sinh viên này rủi ro.
4. Yêu cầu AI sinh lộ trình học tập, xuất file PDF biên bản tư vấn.

## Slide 8: Khả năng mở rộng (Future Work) & Hướng phát triển
- Tích hợp thêm dữ liệu từ Hệ thống điểm danh bằng FaceID.
- Tự động gửi SMS/Zalo/Email cảnh báo cho phụ huynh.
- Mở rộng thuật toán Deep Learning (LSTMs) để dự đoán đường xu hướng học tập dài hạn hơn.

## Slide 9: Tổng kết & Lời cảm ơn
- EduGuard AI không chỉ là một trang web quản lý, mà là một **Trợ lý Thông minh**, chuyển đổi quy trình từ "Bị động giải quyết hậu quả" sang "Chủ động ngăn ngừa rủi ro".
- Cảm ơn Hội đồng đã lắng nghe.
- **Q&A**.
