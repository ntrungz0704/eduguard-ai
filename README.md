# EduGuard AI - Enterprise Academic Intelligence Platform 🎓

> **"Không để bất kỳ sinh viên nào bị bỏ lại phía sau."**

EduGuard AI là một Nền tảng Phân tích Học vụ và Trí tuệ Nhân tạo (Academic Intelligence Platform) được thiết kế đặc biệt cho các Cơ sở Giáo dục Đại học. Khác với các hệ thống cảnh báo "khám nghiệm tử thi" truyền thống, EduGuard AI đóng vai trò như một Hệ thống Hỗ trợ ra quyết định (Decision Support System) giúp dự báo sớm rủi ro học thuật bằng kỹ thuật Học Máy (Machine Learning) và Explainable AI (XAI) chạy hoàn toàn 100% Offline (Local AI).

![EduGuard AI Dashboard](https://via.placeholder.com/1000x500?text=EduGuard+AI+Dashboard)

---

## 🌟 Điểm nổi bật (Core Features)

*   🧠 **Predictive Academic Analytics:** Tích hợp mô hình hồi quy tuyến tính lai (Hybrid Linear Regression) và hệ số tương quan Pearson, dự báo nguy cơ rớt môn của sinh viên ngay từ khi đăng ký học.
*   📊 **Explainable AI (XAI):** AI giải thích trực quan (minh bạch) nguyên nhân rủi ro thông qua Feature Engineering (Điểm chuyên cần, Điểm các môn tiên quyết).
*   🔒 **100% Offline & Data Privacy (GDPR/FERPA):** Hệ thống được nhúng Local NLP Intent Classification Engine (node-nlp). Trợ lý ảo Chatbot hoạt động cực mượt mà không cần truy xuất dữ liệu ra bất kỳ bên thứ 3 nào (như OpenAI hay Gemini).
*   🎛️ **Actionable Decision Support:** Giao diện Dashboard cho phép Giảng viên/CVHT nhanh chóng lập "Cờ cảnh báo" và tiến hành can thiệp y tế học thuật trực tiếp.

---

## 🔬 Đóng Góp Nghiên Cứu (Research Contribution)

Dự án này đóng góp những phương pháp luận mới trong lĩnh vực Ứng dụng AI vào Giáo dục (EdTech):
- Xây dựng **Local AI Architecture** dành riêng cho phân tích học vụ, loại bỏ hoàn toàn sự phụ thuộc vào API mạng lưới bên ngoài.
- Ứng dụng thành công **Explainable Academic Prediction**, biến hộp đen AI thành các quyết định có thể lý giải được (Interpretable Machine Learning).
- Triển khai **Privacy-preserving AI Pipeline**, đảm bảo tuân thủ nghiêm ngặt chuẩn bảo mật dữ liệu sinh viên.

---

## ⚔️ So Sánh Cạnh Tranh (Competitive Comparison)

| Capability | Traditional LMS | EduGuard AI |
| :--- | :---: | :---: |
| **Predictive Analytics** | ❌ | ✅ |
| **Explainable AI (XAI)** | ❌ | ✅ |
| **Offline AI** | ❌ | ✅ |
| **Risk Intervention** | ❌ | ✅ |
| **Academic Digital Twin** | ❌ | ✅ |

---

## 🏛️ Quản Trị Trí Tuệ Nhân Tạo (AI Governance & Ethics)

EduGuard AI tuân thủ các nguyên tắc đạo đức cốt lõi trong AI:
- **Bias Mitigation (Giảm thiểu thiên kiến):** Mô hình hồi quy được tinh chỉnh liên tục để tránh thiên kiến cục bộ (ví dụ: thiên vị giới tính hoặc hoàn cảnh sinh viên).
- **Human Oversight (Sự kiểm soát của con người):** AI chỉ đưa ra "Cờ cảnh báo". Quyết định can thiệp cuối cùng (Intervention) phải do Cố Vấn Học Tập / Giảng viên thực hiện.
- **Transparency (Độ minh bạch):** Thuật toán XAI cho phép bất kỳ giảng viên nào cũng có thể kiểm chứng tại sao một dự báo được đưa ra.
- **Security-by-Design:** Kiến trúc bảo mật với JWT rotation, rate limiting, API validation và audit trail toàn diện.

---

## 🏗️ Kiến trúc Hệ thống, Distributed Infrastructure & Failure Recovery

Dự án được thiết kế với **Distributed Architecture Mindset** (Tư duy hệ thống phân tán) sẵn sàng để Scale:
*   **Hiện tại (Implemented):** Frontend React.js, Backend Node.js API, Prisma ORM, Local NLP + ML.
*   **Sẵn sàng Production (Production-ready):** Docker Multi-container (Tách biệt UI, API Orchestration, Redis Message Broker, AI Worker Background, PostgreSQL Persistence).
*   **Failure Recovery Architecture (Kiến trúc phục hồi lỗi):** Nếu Prediction Worker gặp sự cố, các task dự báo vẫn được lưu trữ (persisted) an toàn trong Redis queue và sẽ tự động retry khi Worker khởi động lại.

---

## 👁️ Observability & Monitoring (Roadmap)

Future AI monitoring includes:
- **Prometheus** (Metrics) & **Grafana** (Monitoring)
- **Loki** (Logging)
- **Concept drift detection**
- **Prediction quality monitoring**
- **False alert analytics**

*(Chi tiết kiến trúc, ERD, Sequence Diagram, AI Flow vui lòng xem trong `docs/architecture.md`)*

---

## 🚀 Hướng dẫn Cài đặt & Triển khai (Deployment)

EduGuard AI hỗ trợ triển khai quy mô lớn (Multi-container Docker).

### Dùng Docker Compose (Enterprise Setup)
Bạn chỉ cần cài đặt Docker và chạy lệnh:
```bash
docker-compose up --build -d
```
Cấu trúc Container sẽ tự động thiết lập:
1. `frontend`: Cổng 80 (Vercel Build Simulation)
2. `backend`: Cổng 5000 (REST API Server)
3. `ai-worker`: Xử lý Prediction / Retraining ngầm
4. `redis`: Message Queue
5. `postgres`: Database chính

---

## 🗺️ Lộ trình Phát triển (Product Roadmap)

Chúng tôi định vị EduGuard AI không chỉ là một đồ án, mà là một Startup AI EdTech. Lộ trình phát triển như sau:

*   **Giai đoạn 1: Hoàn thiện Hiện tại (Current State)** ✅
    *   Predictive Analytics & Explainable AI (XAI) Dashboard.
    *   Local NLP Chatbot Pipeline.
    *   Cấu trúc Docker Multi-container Architecture.

*   **Giai đoạn 2: Trí tuệ Nâng cao (Advanced AI)** 🚧
    *   **Semantic Embeddings & Vector DB:** Tìm kiếm ngữ nghĩa vượt ra ngoài Intent cơ bản bằng mô hình MiniLM và ChromaDB.
    *   **AI Memory Layer:** AI ghi nhớ lịch sử học thuật dài hạn của từng sinh viên.
    *   **Recommendation Engine:** Hệ thống tự động đề xuất video học liệu và ghép nối Mentor-Mentee.

*   **Giai đoạn 3: Enterprise AI (Quy mô Lớn)**
    *   Bảng điều khiển Giám sát AI (AI Monitoring Dashboard).
    *   **Model Drift Detection:** Đo lường sự suy giảm chất lượng dữ liệu và tự động tái huấn luyện (Retraining Pipeline).
    *   Graph Analytics (Knowledge Graph) cho chương trình đào tạo.

*   **Giai đoạn 4: Startup & SaaS License**
    *   Multi-school Federation Learning (Liên kết AI học thuật ẩn danh giữa các trường).
    *   Giấy phép phần mềm B2B SaaS cho các trung tâm giáo dục.

---

## 📝 Tài liệu thuyết trình & Pitching
* [Kiến trúc Dữ liệu & Sơ đồ luồng (Architecture)](docs/architecture.md)
* [Pitch Deck Khởi nghiệp 10 Slides (Pitch Deck)](docs/pitch_deck.md)
* [Kịch bản Trình diễn 5 phút (Demo Script)](docs/demo_script.md)

---
*Phát triển bởi đội ngũ Kỹ sư EduGuard AI - Nâng tầm trí tuệ giáo dục.*
