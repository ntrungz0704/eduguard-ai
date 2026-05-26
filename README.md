# EduGuard DSS (Decision Support System)

**EduGuard DSS** là Hệ thống Hỗ trợ Ra quyết định (Decision Support System) tích hợp Hybrid AI nhằm phân tích dữ liệu và dự đoán sớm rủi ro học tập của sinh viên, từ đó giúp cố vấn học tập và giảng viên can thiệp kịp thời trước khi quá muộn. Hệ thống được thiết kế theo chuẩn Enterprise-style Prototype với kiến trúc Modular Monolith.

---

## 1. Project Overview
Dự án được xây dựng dựa trên bài toán thực tế của các cố vấn học tập: theo dõi và quản lý hàng nghìn sinh viên là điều bất khả thi nếu làm thủ công. Mục tiêu chính của EduGuard không phải thay thế giảng viên, mà là giảm tải việc rà soát dữ liệu thủ công và hỗ trợ phát hiện sớm các dấu hiệu rủi ro học tập. EduGuard DSS đóng vai trò như một "phòng khám học thuật", nơi hệ thống không chỉ báo cáo tình hình hiện tại (điểm số, chuyên cần) mà còn chẩn đoán và dự báo sớm nguy cơ rớt môn dựa trên dữ liệu lịch sử.

## 2. Problem Statement
- **Phát hiện quá muộn:** Các hệ thống quản lý đào tạo hiện nay (LMS, ERP) thường chỉ mang tính chất hiển thị (Descriptive). Sinh viên rớt môn thường chỉ được phát hiện khi điểm thi cuối kỳ đã công bố.
- **Dữ liệu rời rạc:** Điểm số, điểm danh, tiến trình học tập bị phân mảnh. Không có một luồng đánh giá rủi ro tổng thể.
- **Rớt dây chuyền:** Rớt môn tiên quyết kéo theo việc không thể đăng ký các môn sau, làm đứt gãy tiến độ học thuật.
- **CVHT quá tải:** Cố vấn học tập không đủ thời gian rà soát hàng trăm sinh viên để tìm ra những cá nhân thật sự cần hỗ trợ khẩn cấp.

## 3. Solution
EduGuard DSS giải quyết bài toán trên bằng cách kết hợp:
1. **Rule-based & Weighted Risk Engine:** Tính toán điểm rủi ro theo các trọng số (rớt môn 40%, chuyên cần 25%...).
2. **Predictive Analytics:** Dự báo lộ trình leo thang cảnh báo.
3. **Explainable AI (XAI):** Mọi cảnh báo rủi ro đều được hệ thống giải thích chi tiết nguyên nhân gốc rễ (Ví dụ: "Rủi ro vì nợ môn tiên quyết WEB105").
4. **NLP Assistant:** Trợ lý ảo giao tiếp ngôn ngữ tự nhiên giúp CVHT tra cứu hồ sơ và phương án can thiệp dễ dàng.

## 4. Core Features
- **Student Risk Ranking:** Xếp hạng sinh viên theo điểm rủi ro (CRITICAL, HIGH, MEDIUM, LOW).
- **Academic Timeline Escalation:** Biểu đồ dòng thời gian cho thấy xu hướng tăng/giảm cảnh báo qua từng tuần.
- **Class Heatmap & Analytics:** Bản đồ nhiệt toàn lớp, giúp giáo viên nhận diện tổng thể.
- **Bottleneck Subject Detection:** Phát hiện "nút thắt cổ chai" - các môn học khiến nhiều sinh viên rớt nhất.
- **Context-aware NLP Assistant:** Trợ lý ảo có khả năng ghi nhớ ngữ cảnh (Session Memory) và phân quyền bảo mật (RBAC).

## 5. Data Analytics & Predictive Flow
Luồng phân tích và dự báo của hệ thống tuân theo chuẩn:
`Input -> Intent Router -> Entity Extractor -> Context Resolver -> Risk Scoring Engine -> Response Builder -> Output`
- **NLP Routing:** Sử dụng thư viện `node-nlp` chạy cục bộ (Offline-first) để phân loại ý định người dùng cực nhanh và bảo mật tuyệt đối.
- **XAI Output:** Trả về quyết định kèm theo lời giải thích (Reasoning).

## 6. DSS Architecture
Kiến trúc hỗ trợ ra quyết định (Decision Support) không tự động đình chỉ học tập sinh viên. Nó tuân thủ nguyên tắc:
**Phân tích & Gợi ý (Predictive Support) $\rightarrow$ Con người Quyết định (Intervention)**
Mọi gợi ý can thiệp (gọi điện, email, phụ đạo) đều phụ thuộc vào mức độ Risk Score được tính toán bởi Engine.

## 7. Tech Stack
- **Frontend:** React, Vite, TailwindCSS, Recharts.
- **Backend:** Node.js, Express, node-nlp.
- **Database:** SQLite + Prisma ORM.
- **Architecture Pattern:** Modular Monolith & Event-driven.

## 8. Screenshots
*(Hình ảnh giao diện của hệ thống sẽ được đính kèm trong thư mục `/screenshots`)*
- Dashboard Tổng quan
- Giao diện Student Search
- Trợ lý ảo NLP Assistant
- Biểu đồ Heatmap & Timeline
- Risk Chart & Bottleneck Chart

## 9. Demo Video
*(Link video demo 3-5 phút: Giới thiệu -> Login -> Dashboard -> Phân tích sinh viên -> NLP Assistant -> Kết luận sẽ được cập nhật)*

## 10. Installation
```bash
# 1. Cài đặt dependencies cho cả server và client
npm run install-all

# 2. Khởi tạo Database (Prisma)
npm run postinstall

# 3. Môi trường phát triển (Dev Mode)
npm run dev

# 4. Môi trường Trình diễn/Chấm thi (Demo Mode / Enterprise-style Prototype)
npm run boot
```

## 11. Project Structure
```text
eduguard-ai/
├── client/           # React Frontend (Vite)
├── server/           # Node.js Backend & AI Engine
│   ├── src/
│   │   ├── ai/       # Logic phân tích Data, Predictive Rule Engine, Scoring
│   │   ├── modules/  # Controller giao tiếp (API, NLP Assistant)
│   │   └── infrastructure/ # Database, Logger, Cache
├── prisma/           # Schema & SQLite Database
├── docs/             # Tài liệu đồ án và Báo cáo thi SmartGen AI
│   ├── BaoCao_EduGuardAI.md
│   ├── PitchDeck_EduGuardAI.md
│   ├── Presentation_Script.md
│   └── Architecture_EduGuardAI.md
├── screenshots/      # Ảnh chụp giao diện
├── generated/        # Dữ liệu xuất (Excel, PDF)
├── package.json
└── README.md
```

## 12. SmartGen AI Challenge 2026 🏆
Dự án được chuẩn bị cho vòng sơ loại cuộc thi SmartGen AI Challenge 2026. Các tài liệu bảo vệ dự án bao gồm:
- 📄 **[Báo Cáo Kỹ Thuật (Sơ loại)](docs/BaoCao_EduGuardAI.md)**: Chi tiết kiến trúc, dữ liệu và DSS.
- 🖼️ **[Pitch Deck (20 Slides)](docs/PitchDeck_EduGuardAI.md)**: Slide thuyết trình chuẩn Startup.
- 🎤 **[Kịch Bản Thuyết Trình (5 Phút) & Q&A](docs/Presentation_Script.md)**: Script nói và bộ 10 câu hỏi phòng thủ.
- 🗺️ **[Sơ đồ Kiến trúc AI](docs/Architecture_EduGuardAI.md)**: Mermaid diagram của hệ thống.

## 13. Future Roadmap
- Tích hợp trực tiếp với API của LMS (Canvas/Moodle) để lấy dữ liệu hành vi thực tế (Real-time Attendance, Quiz scores, Assignment submissions) thay vì nội suy từ điểm số học thuật.
- Cập nhật mô hình từ **Prototype Prediction Model** lên các thuật toán Time-series (RNN/LSTM) để dự báo xu hướng chuỗi thời gian dựa trên các sự kiện tương tác của sinh viên.
- Bắn thông báo can thiệp tự động qua SMS/Zalo ZNS cho sinh viên và cố vấn học tập.

## 14. Limitations (Giới hạn hiện tại của mô hình)
- **Data Correlation & Self-labeling:** Dữ liệu hành vi học tập hiện tại (attendance, quiz) được nội suy dựa trên tương quan với điểm số học thuật thực tế nhằm mục đích trình diễn tính khả thi của hệ thống (Prototype Demo). Do sử dụng phương pháp tự dán nhãn (Self-labeling) dựa trên các bộ quy tắc (Rules), mô hình có thể gặp hiện tượng *overfitting nhẹ*.
- **Quy mô tập dữ liệu:** Hệ thống đang được huấn luyện trên tập dữ liệu bảng điểm của hơn 650 sinh viên. Dù là dữ liệu thật, nhưng chưa đạt đến quy mô Big Data để các mô hình Deep Learning có thể phát huy tối đa sức mạnh.
- **Kiến trúc Deployment:** Hệ thống được thiết kế dưới dạng Enterprise-style Prototype (Modular Monolith) để dễ dàng triển khai cục bộ, chưa đóng gói thành kiến trúc Cloud Native (Microservices) do giới hạn về tài nguyên.

## 15. Authors
- **Sinh viên thực hiện:** [Nguyễn Phạm Thành Trung - PS47261], [Nguyễn Minh Hiếu - PS47348], [Mai Thị Vỹ An - PS47503]
- **Giảng viên hướng dẫn:** [Tên Giảng viên]

---
*Tài liệu, hướng dẫn cài đặt và bảo vệ đồ án chi tiết được lưu trữ trong thư mục `/docs`. Chúc bạn bảo vệ đồ án thành công!*
