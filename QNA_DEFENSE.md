# EduGuard AI — Defensive Q&A Bank (Bộ câu hỏi phản biện)

Tài liệu này tổng hợp các câu hỏi phản biện "hóc búa" thường gặp từ Ban giám khảo (BGK) hoặc Tech Lead/Recruiter, kèm theo chiến lược trả lời chuẩn "Enterprise Mindset" để bảo vệ kiến trúc và định hướng của dự án.

---

## Nhóm 1: Câu hỏi về Kiến trúc & System Design (Architecture)

### 1. "Tại sao hệ thống lại dùng Monolithic Architecture mà không phải Microservices? Xu hướng bây giờ là Microservices mà?"
**Chiến lược trả lời (Pragmatic Engineering):**
"Dạ, nhóm hoàn toàn nhận thức được xu hướng Microservices. Tuy nhiên, việc áp dụng Microservices cho một dự án ở giai đoạn Prototype hoặc quy mô dữ liệu hiện tại là một sự 'Over-engineering' (Làm quá mức cần thiết). Microservices sẽ kéo theo sự phức tạp khổng lồ về network latency, distributed tracing, và DevOps overhead (quản lý deployment). 
Thay vào đó, EduGuard AI áp dụng kiến trúc **Modular Monolith**. Mã nguồn backend được chia thành các thư mục `modules/` độc lập (Auth, Students, Prediction). Nhờ vậy, khi hệ thống thực sự scale và có traffic lớn, chúng em có thể dễ dàng tách các module này ra thành các microservices thực thụ. Đây là cách tiếp cận mà cả Shopify và các big tech đang khuyến nghị cho dự án khởi đầu."

### 2. "Tại sao lại cần Redis trong khi database PostgreSQL đã đủ nhanh với lượng dữ liệu này?"
**Chiến lược trả lời (Scalability Readiness):**
"Hiện tại, với lượng dữ liệu demo thì PostgreSQL hoàn toàn đáp ứng được. Nhưng EduGuard AI được thiết kế với tư duy của một hệ thống Production. Trong thực tế, bảng Dashboard của Giảng viên sẽ phải tính toán Analytics (KPIs, xu hướng rủi ro) liên tục. Nếu hàng trăm giảng viên cùng login và load Dashboard, Database sẽ bị quá tải (Bottleneck). 
Redis được đưa vào hệ thống để cache lại các Query nặng (như Dashboard Analytics) và làm Rate Limiting bảo vệ API Gateway. Điều này chứng minh hệ thống có khả năng **horizontal scaling** và chịu tải (High Availability) khi áp dụng vào thực tế."

### 3. "Dự án sử dụng SQLite (như em nói ban nãy) hay PostgreSQL?"
**Chiến lược trả lời (Environment Separation):**
"Dự án tuân thủ nguyên tắc 12-Factor App. Ở môi trường local development (máy dev), hệ thống dùng SQLite in-memory để chạy unit test và phát triển siêu tốc mà không cần setup phức tạp. Tuy nhiên, ở môi trường Production (như thông qua file `docker-compose.yml`), hệ thống được cấu hình tự động chuyển sang dùng PostgreSQL làm database chính và Redis làm Cache. Bọn em dùng Prisma ORM nên việc switch DB engine chỉ tốn đúng 1 dòng config biến môi trường."

---

## Nhóm 2: Câu hỏi về AI & Dữ liệu (AI & Data Engineering)

### 4. "Data ở đâu ra để các em train mô hình AI dự đoán rủi ro? Data này có thực tế không?"
**Chiến lược trả lời (Data Honesty & Domain Knowledge):**
"Dạ thưa BGK, bài toán lớn nhất của các dự án AI sinh viên là thiếu data thực tế. Nhóm không cố tình fake data một cách vô lý để train Neural Network phức tạp, vì điều đó tạo ra 'Black box AI' không đáng tin cậy.
Thay vào đó, nhóm sử dụng **Decision Support System (Hệ trợ lý Quyết định)** dựa trên Rule-based và Thống kê học thuật (Academic Correlation). Dữ liệu demo được synthesize (tổng hợp) dựa trên quy chế đào tạo thực tế của FPT Polytechnic (trọng số tín chỉ, môn tiên quyết, môn điều kiện). Mô hình dự đoán dựa trên sự sụt giảm GPA và sự thiếu hụt kiến thức từ các môn tiên quyết (Prerequisite Failure). Hướng đi này giúp AI có tính **Explainability (XAI - Trí tuệ nhân tạo có thể giải thích được)**, điều mà các trường đại học cực kỳ cần để đưa ra quyết định can thiệp."

### 5. "Local NLP Chatbot của các em hoạt động thế nào? Nó có thông minh bằng ChatGPT (OpenAI API) không?"
**Chiến lược trả lời (Cost vs Value / Data Privacy):**
"Chắc chắn mô hình Local NLP (Zero-API Cost) của nhóm không thể 'nói chuyện phiếm' giỏi như ChatGPT. Tuy nhiên, nó được thiết kế để giải quyết một **Niche Domain (Miền nghiệp vụ hẹp)**: Truy vấn dữ liệu học vụ.
Lý do nhóm không dùng 100% OpenAI API là vì:
1. **Bảo mật dữ liệu (Data Privacy):** Dữ liệu điểm số và rủi ro của sinh viên là dữ liệu nhạy cảm (PII). Đưa toàn bộ lên OpenAI vi phạm nghiêm trọng chính sách bảo mật của Enterprise.
2. **Chi phí (Cost-optimization):** Việc gọi API cho mọi câu hỏi cơ bản (như 'MSSV này điểm bao nhiêu') là quá lãng phí. 
Local NLP của nhóm dùng Intent Routing để xử lý các câu hỏi phổ biến ngay tại local (chi phí $0). Nếu gặp câu hỏi phức tạp ngoài tầm, hệ thống mới dùng Fallback gọi LLM API. Đây gọi là kiến trúc **Hybrid AI Pipeline**."

---

## Nhóm 3: Câu hỏi về Bảo mật & Vận hành (Security & DevOps)

### 6. "Nếu hệ thống bị tấn công DDoS hoặc sinh viên spam request, hệ thống xử lý thế nào?"
**Chiến lược trả lời (Defense in Depth):**
"Hệ thống áp dụng tư duy Defense-in-Depth (Bảo mật nhiều lớp). Ngay tại cổng API Gateway, nhóm đã cấu hình:
1. **Helmet.js:** Đóng gói các HTTP headers để chống XSS/Clickjacking.
2. **CORS:** Chỉ định đích danh frontend domain được phép gọi API.
3. **Rate Limiting:** Giới hạn số lượng request (ví dụ: 100 request/15 phút) từ một IP. Nếu vượt quá, request sẽ bị drop ngay lập tức ở tầng Gateway mà chưa chạm tới Database.
4. **Zod Validation:** Mọi input từ client đều được validate type chặt chẽ trước khi controller xử lý, chống NoSQL/SQL Injection."

### 7. "Làm sao biết được giảng viên nào đã xem điểm của sinh viên nào (Tính minh bạch)?"
**Chiến lược trả lời (Audit & Compliance):**
"Đây là tính năng nhóm rất tự hào: **Audit Logging**. Không giống các app cơ bản chỉ có CRUD, EduGuard áp dụng Audit Log Middleware. Mọi hành động làm thay đổi dữ liệu (như 'Gắn cờ can thiệp') hoặc truy xuất dữ liệu nhạy cảm đều được ghi log với cấu trúc: *Ai làm (Actor) - Hành động gì (Action) - Đối tượng nào (Target) - Thời gian & IP (Context)*. Việc này đáp ứng chuẩn Enterprise Compliance."

---

## 🎯 Chốt hạ (Lưu ý khi trả lời)
- **Luôn tự tin:** Nhìn thẳng vào mắt giám khảo. 
- **Không tranh cãi:** Nếu BGK góp ý một công nghệ mới (VD: "Sao không dùng Kafka?"), hãy đáp: *"Dạ cảm ơn thầy cô, đây là một suggestion rất hay. Bọn em đã cân nhắc Kafka cho kiến trúc Event-Driven, nhưng do time-constraint và scope hiện tại, nhóm quyết định chọn RESTful + Redis để đảm bảo tính ổn định (stability) cho bản release này. Ở Phase tiếp theo, Kafka chắc chắn là ưu tiên số 1 để scale hệ thống."* 
- **Chìa khóa:** Luôn lèo lái câu trả lời về **"Sự phù hợp với giai đoạn dự án"** và **"Kiểm soát Scope"**.
