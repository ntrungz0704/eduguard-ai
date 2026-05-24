# EduGuard AI DSS: Hybrid Educational Decision Support System 🎓

> "Nền tảng Hỗ trợ Ra quyết định Học vụ bằng Trí tuệ nhân tạo, giúp dự báo sớm và ngăn chặn chuỗi rủi ro học thuật của sinh viên."

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)

---

## 1. Project Overview (Tổng quan dự án)
EduGuard AI DSS là một hệ thống phân tích học vụ (Academic Intelligence Platform) kết hợp giữa Hệ thống Hỗ trợ Ra Quyết định (DSS) và Trí tuệ Nhân tạo (AI). Hệ thống sử dụng Xử lý ngôn ngữ tự nhiên (NLP) để cung cấp một trợ lý ảo đàm thoại, đồng thời ứng dụng công nghệ **Explainable AI (XAI)** để tính toán và giải thích mức độ rủi ro rớt môn của từng sinh viên ngay từ những tuần đầu tiên của học kỳ.

## 2. Problem Statement (Bài toán thực tế)
Tại các trường Đại học và Cao đẳng, quy trình giám sát học vụ đang gặp phải nhiều nút thắt:
- **Phát hiện quá muộn:** Sinh viên rớt môn thường chỉ được phát hiện khi điểm thi cuối kỳ công bố, dẫn đến việc can thiệp không còn ý nghĩa.
- **Quá tải nhân sự:** Cố vấn học tập (CVHT) phải theo dõi hàng trăm sinh viên qua các bảng tính Excel thủ công.
- **Đứt gãy chuỗi môn tiên quyết:** Việc rớt một môn nền tảng có thể kéo theo sự sụp đổ của toàn bộ học kỳ sau, nhưng thiếu hệ thống tự động cảnh báo sớm.
- **Dữ liệu phân mảnh:** Điểm số, điểm chuyên cần, và các dữ liệu học vụ khác nằm rải rác.

## 3. Proposed Solution (Giải pháp đề xuất)
Giải pháp của chúng tôi là xây dựng **EduGuard AI DSS** — chuyển đổi từ quản lý dữ liệu thụ động (Descriptive) sang dự báo chủ động (Predictive):
- 🤖 **AI Academic Assistant:** Trợ lý ảo giao tiếp qua ngôn ngữ tự nhiên, hiểu ngữ cảnh và truy xuất dữ liệu cá nhân hóa.
- 📊 **Explainable Risk Scoring:** Hệ thống chấm điểm rủi ro có khả năng giải thích (XAI).
- 📈 **Class-level Analytics:** Bảng phân tích toàn diện cấp độ lớp, hiển thị các môn học "nút thắt cổ chai".
- 🔗 **Dependency Chain Analysis:** Phát hiện tức thời nguy cơ gãy chuỗi môn tiên quyết.

## 4. System Architecture (Kiến trúc Hệ thống)
Hệ thống được thiết kế theo mô hình **Modular Monolith** chuẩn Enterprise, phân tách rõ ràng các service:
- **Frontend (Presentation Layer):** Giao diện Single Page Application (SPA) với React.
- **Backend (API & Orchestrator):** Điều hướng Pipeline xử lý dữ liệu và AI.
- **AI Core (DSS & NLP Engine):** Cụm module tính toán điểm số rủi ro và nhận diện ý định.
- **Data Layer:** SQLite Database kết nối qua Prisma ORM, đi kèm Cache in-memory.

![Architecture Diagram](https://placehold.co/800x400/1e293b/fff?text=System+Architecture+Diagram)

## 5. AI Components (Thành phần Trí tuệ Nhân tạo)
Khác với các hệ thống phụ thuộc hoàn toàn vào API bên thứ 3, EduGuard sử dụng **Hybrid AI**:
- **Intent Router (NLP):** Phân loại ý định của người dùng (node-nlp) chạy offline hoàn toàn, bảo mật 100% dữ liệu (FERPA compliance).
- **Entity Extractor:** Nhận diện thực thể (MSSV, Tên môn học, Ngữ cảnh).
- **Session Memory:** Ghi nhớ sinh viên đang được thảo luận để đàm thoại theo ngữ cảnh (Contextual Conversation) mà không cần lặp lại thông tin.

## 6. DSS Engine (Hệ thống Hỗ trợ Ra quyết định)
Lõi của DSS là thuật toán **Weighted Risk Scoring (Chấm điểm trọng số rủi ro)**, phân phối như sau:
- `40%` — Rớt môn / Nợ môn (Failed Subjects)
- `25%` — Suy giảm chuyên cần (Attendance Drop)
- `15%` — Điểm thực hành thấp (Lab Scores)
- `10%` — Gãy chuỗi tiên quyết (Prerequisite Break)
- `10%` — Suy giảm phong độ GPA (GPA Trend Decline)

*Mô hình XAI sẽ ánh xạ ngược các trọng số này thành một báo cáo nguyên nhân chi tiết để CVHT dễ dàng tư vấn.*

## 7. Tech Stack (Công nghệ sử dụng)
* **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide Icons.
* **Backend:** Node.js, Express, Winston Logger.
* **Database:** Prisma ORM, SQLite.
* **AI & NLP:** `node-nlp` (Offline Intent Classification), Custom Rule-based Expert System.

## 8. Features (Tính năng cốt lõi)
1. **Student Risk Analysis:** Xếp hạng rủi ro sinh viên theo 4 cấp độ (LOW, MEDIUM, HIGH, CRITICAL).
2. **Academic Timeline:** Theo dõi dòng thời gian học thuật, cảnh báo ngay khi phát sinh sự kiện rủi ro.
3. **Bottleneck Subject Detection:** Phát hiện "môn học sát thủ" đang kéo tụt GPA của nhiều sinh viên nhất.
4. **Follow-up AI Conversation:** Đặt câu hỏi đào sâu ("Tại sao nguy cơ cao?", "Timeline ra sao?", "Cần can thiệp gì?").
5. **Role-based Access Control (RBAC):** Phân quyền nghiêm ngặt giữa Giáo viên (xem tất cả) và Sinh viên (chỉ xem chính mình).

## 9. Screenshots (Giao diện hệ thống)

*(Placeholder - Sẽ thay bằng ảnh thật của dự án)*

| Trang chủ Analytics (Dashboard) | Trợ lý AI (Chatbot) | Phân tích Môn Tiên quyết |
|:---:|:---:|:---:|
| ![Dashboard](https://placehold.co/400x250/1e293b/fff?text=Dashboard+Analytics) | ![Chatbot](https://placehold.co/400x250/1e293b/fff?text=AI+Contextual+Chatbot) | ![Prereq](https://placehold.co/400x250/1e293b/fff?text=Dependency+Graph) |

## 10. Future Improvements (Hướng phát triển tương lai)
1. **LMS Integration:** Tích hợp trực tiếp với hệ thống Canvas/Moodle qua RESTful/GraphQL API.
2. **Real-time Notifications:** Gửi cảnh báo tự động qua Zalo ZNS / Mobile App khi mức rủi ro chuyển sang CRITICAL.
3. **Deep Learning Prediction:** Áp dụng mô hình LSTM để học và dự đoán chuỗi thời gian dựa trên Big Data thực tế.
4. **Intervention Tracking:** Theo dõi và đo lường tỷ lệ thành công sau mỗi lần cố vấn học tập can thiệp.

---

## 🚀 Hướng dẫn khởi chạy dự án
```bash
# 1. Cài đặt thư viện
npm install && cd server && npm install && cd ../client && npm install && cd ..

# 2. Khởi tạo Database
cd server && npx prisma db push && cd ..

# 3. Chạy hệ thống (Tự động train model & bật server/client)
npm run boot
```
*Truy cập hệ thống tại: `http://localhost:5173`*
