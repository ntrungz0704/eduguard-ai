# EduGuard AI DSS - Kiến Trúc Hệ Thống (Enterprise Prototype)

## 1. Tổng Quan Kiến Trúc
Hệ thống EduGuard AI DSS được thiết kế theo mô hình **Modular Monolith** kết hợp với **Event-driven architecture**, rất phù hợp cho giai đoạn prototype/demo nhưng vẫn đảm bảo tính mở rộng cao theo chuẩn Enterprise.

### 1.1 Tầng Frontend (Client Layer)
- **Công nghệ:** React.js, Vite, TailwindCSS, Recharts.
- **Vai trò:** Hiển thị Dashboard, quản lý trạng thái, hiển thị đồ thị và cung cấp giao diện tương tác với AI Chatbot.
- **Tối ưu:** Sử dụng cơ chế Lazy Loading, React Window (Virtualization) cho danh sách sinh viên lớn, và phân tách Production Build tối ưu qua lệnh `npm run preview`.

### 1.2 Tầng Backend (Server Layer)
- **Công nghệ:** Node.js, Express.js.
- **Cấu trúc lõi (`server/src/`):**
  - `ai/`: Chứa các thuật toán Decision Support System (DSS) Engine và Machine Learning inference (TF.js).
  - `modules/`: Chứa các controller và logic nghiệp vụ tách biệt (Chatbot, Prediction, API lõi).
  - `infrastructure/`: Quản lý cấu hình database (Prisma), logging, và event bus.
  - `events/`: Hệ thống Pub/Sub cục bộ để decouple các luồng xử lý nặng (vd: lưu log, train dữ liệu).

### 1.3 Tầng Database (Data Layer)
- **Công nghệ:** SQLite + Prisma ORM.
- **Vai trò:** Lưu trữ thông tin sinh viên, điểm số, lịch sử dự đoán và nhật ký can thiệp.
- **Định hướng mở rộng:** ORM Prisma cho phép chuyển đổi sang PostgreSQL mà hầu như không cần sửa đổi mã nguồn.

## 2. Luồng Xử Lý AI (AI Pipeline)

Luồng xử lý cốt lõi của hệ thống được tuân thủ nghiêm ngặt qua 3 bước:
1. **INPUT:** Tiếp nhận Điểm số, Attendance (Điểm danh), Môn tiên quyết, Timeline học tập.
2. **PROCESSING:** Dữ liệu đi qua Orchestrator để:
   - NLP Engine (node-nlp) phân loại Intent (Ý định người dùng).
   - Weighted Risk Engine tính toán điểm rủi ro.
   - Rule-based DSS phân tích đứt gãy môn tiên quyết.
3. **OUTPUT:** Trả ra Risk Score (Chỉ số rủi ro), Academic Timeline (Lộ trình leo thang), Heatmap và Intervention Suggestion (Gợi ý can thiệp).

## 3. Lý Do Chọn Kiến Trúc Này
1. **Modular Monolith:** Phù hợp với team size nhỏ và nhu cầu triển khai đồ án nhanh chóng, tránh over-engineering như Microservices nhưng vẫn giữ ranh giới module rõ ràng.
2. **Offline-first AI:** NLP Model chạy cục bộ, đảm bảo bảo mật dữ liệu sinh viên 100%, tốc độ phản hồi tính bằng ms thay vì phụ thuộc API ngoài.
3. **Event-driven:** Cải thiện thời gian phản hồi (Response Time) bằng cách đưa các tác vụ lưu trữ và phân tích nặng xuống nền (background processing).
