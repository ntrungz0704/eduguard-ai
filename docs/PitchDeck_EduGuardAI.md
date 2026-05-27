# PITCH DECK TRÌNH BÀY DỰ ÁN: EDUGUARD AI DSS
**Sự kiện:** SmartGen AI Challenge 2026
**Đội thi:** FPoly Innovators

---

## PHẦN 1 — OPENING

### Slide 1 — Hero Opening
- **Tên dự án:** EduGuard DSS
- **Tagline:** "Educational Early Warning DSS"
- **Visual:** Background tối hiện đại, vệt sáng gradient, logo dự án đặt ở trung tâm.

### Slide 2 — Problem
- **Tiêu đề:** Những "điểm mù" của giáo dục truyền thống
- **Nội dung:** 
  - Mỗi học kỳ, nhiều sinh viên rớt môn không phải vì kém — mà vì không được phát hiện sớm.
  - Cố vấn học tập (CVHT) quá tải, không thể rà soát hàng ngàn sinh viên.
  - Rớt dây chuyền: Rớt môn tiên quyết kéo theo đứt gãy lộ trình.
- **Visual:** Infographic biểu diễn học sinh rơi rụng qua các học kỳ.

### Slide 3 — Real-world Impact
- **Tiêu đề:** Hiệu ứng Domino
- **Ví dụ thực tế:** Rớt JS $\rightarrow$ fail PHP $\rightarrow$ fail Project.
- **Nội dung:** Khi dữ liệu phân mảnh, CVHT không thể nhìn thấy rủi ro cho đến khi quá muộn. EduGuard được tạo ra để phát hiện nguy cơ trước khi quá muộn.

---

## PHẦN 2 — SOLUTION

### Slide 4 — EduGuard Overview
- **Tiêu đề:** EduGuard DSS - Quyết định dựa trên Dữ liệu
- **Nội dung:** Hệ thống Hỗ trợ Ra quyết định (Decision Support System) giúp cảnh báo sớm nguy cơ học vụ.
- **Visual:** 1 ảnh tổng quan hệ thống (Dashboard tổng thể).

### Slide 5 — Hybrid DSS Philosophy
- **Tiêu đề:** Triết lý Hybrid DSS
- **Nội dung:** AI hỗ trợ chứ không thay thế giảng viên. Hệ thống làm nhiệm vụ sàng lọc và ưu tiên mức độ chú ý (Prioritization). Giảng viên đưa ra quyết định cuối cùng.

### Slide 6 — Core Features
- **Tiêu đề:** Các tính năng cốt lõi
- **Nội dung:**
  - Risk ranking (Phân loại rủi ro)
  - NLP assistant (Trợ lý ảo học vụ)
  - Bottleneck detection (Phát hiện điểm nghẽn)
  - Timeline (Dòng thời gian rủi ro)
  - Heatmap (Bản đồ nhiệt toàn khối)

### Slide 7 — User Roles
- **Tiêu đề:** Phục vụ Hệ sinh thái Giáo dục
- **Nội dung:**
  - **CVHT:** Trợ thủ đắc lực, tối ưu thời gian lọc dữ liệu.
  - **Giảng viên:** Nắm bắt điểm nghẽn của môn học.
  - **Admin / Ban Đào tạo:** Bức tranh toàn cảnh về sức khỏe học vụ.

---

## PHẦN 3 — AI

### Slide 8 — AI Pipeline
- **Tiêu đề:** AI Pipeline
- **Nội dung:** Input $\rightarrow$ NLP $\rightarrow$ Context $\rightarrow$ Risk Engine $\rightarrow$ XAI

### Slide 9 — NLP Assistant
- **Tiêu đề:** Trợ lý ảo NLP
- **Nội dung:**
  - Intent classification (Phân loại ý định)
  - Synonym handling (Xử lý từ đồng nghĩa)
  - Session memory (Ghi nhớ ngữ cảnh)

### Slide 10 — Risk Scoring
- **Tiêu đề:** Cách tính Risk Score (Risk Formula)
- **Nội dung:** 
  - Không random, có logic rõ ràng.
  - Kết hợp GPA, số môn nợ, điểm danh và các yếu tố học thuật.

### Slide 11 — XAI (Explainable AI)
- **Tiêu đề:** Trí tuệ nhân tạo giải thích được
- **Nội dung:** Giải thích chi tiết nguyên nhân (Ví dụ: "Nguy cơ cao do nợ 2 môn tiên quyết"). Cố vấn có căn cứ để hành động.

### Slide 12 — Confidence Calibration
- **Tiêu đề:** Đo lường độ tin cậy
- **Nội dung:** Hệ thống phân loại độ tin cậy của dự đoán theo mức High / Medium / Low confidence.

### Slide 13 — Bottleneck Detection
- **Tiêu đề:** Nhận diện điểm nghẽn (Bottleneck)
- **Nội dung:** Dependency chain - Theo dõi chuỗi rớt môn tiên quyết và môn học khiến nhiều sinh viên rớt nhất.

---

## PHẦN 4 — SYSTEM

### Slide 14 — Architecture
- **Tiêu đề:** Kiến trúc 4 tầng Hybrid AI
- **Visual:** Sơ đồ kiến trúc Mermaid hiển thị các luồng xử lý.

### Slide 15 — Tech Stack
- **Tiêu đề:** Công nghệ sử dụng
- **Nội dung:** React / Node / Prisma / TFJS (TensorFlow.js)

### Slide 16 — Database Design
- **Tiêu đề:** Thiết kế Cơ sở dữ liệu
- **Visual:** ERD đơn giản minh họa mối quan hệ giữa Sinh viên, Điểm số, và Risk Logs.

### Slide 17 — CI/CD & Git Workflow
- **Tiêu đề:** Quy trình DevOps & Git Workflow
- **Nội dung:**
  - PR (Pull Requests)
  - CI (Continuous Integration)
  - Branch protection

### Slide 18 — Docker Deployment
- **Tiêu đề:** Triển khai Docker
- **Nội dung:**
  - Containerized deployment
  - Reproducible environment

---

## PHẦN 5 — DEMO

### Slide 19 — Demo Flow
- **Tiêu đề:** Luồng Trải nghiệm Demo
- **Nội dung:** Login $\rightarrow$ Dashboard $\rightarrow$ Risk analysis $\rightarrow$ NLP assistant $\rightarrow$ Bottleneck

### Slide 20 — Dashboard
- **Tiêu đề:** Giao diện Tổng quan (Dashboard)
- **Visual:** Screenshot thật của hệ thống.

### Slide 21 — Student Analysis
- **Tiêu đề:** Phân tích chi tiết sinh viên
- **Nội dung:** Risk breakdown (Phân rã nguyên nhân rủi ro).
- **Visual:** Screenshot XAI.

### Slide 22 — NLP Chat
- **Tiêu đề:** Trợ lý ảo Hội thoại
- **Nội dung:** Ví dụ câu hỏi và trả lời.
- **Visual:** Screenshot khung chat NLP.

---

## PHẦN 6 — BUSINESS & FUTURE

### Slide 23 — Limitations
- **Tiêu đề:** Giới hạn hiện tại
- **Nội dung:** 
  - Dataset chưa lớn.
  - Sử dụng Self-labeling dựa trên rule nghiệp vụ.
  - Chưa tích hợp realtime với LMS.
- **Ghi chú:** Sự trung thực về kỹ thuật giúp BGK đánh giá cao tư duy thực tế.

### Slide 24 — Future Roadmap
- **Tiêu đề:** Tương lai của EduGuard
- **Nội dung:**
  - Tích hợp Moodle API
  - Đồ thị tri thức (Neo4j)
  - Nâng cấp mô hình XGBoost
  - Tự động thông báo qua SMS/Zalo

### Slide 25 — Closing
- **Tiêu đề:** Detect early. Support smarter.
- **Nội dung:** Cảm ơn Ban Giám Khảo đã lắng nghe. Q&A.
