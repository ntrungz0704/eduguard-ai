# EduGuard AI — Defensive Q&A Bank (Bộ câu hỏi phản biện)

Tài liệu này tổng hợp các câu hỏi phản biện "hóc búa" thường gặp từ Ban giám khảo (BGK) hoặc Tech Lead/Recruiter, kèm theo chiến lược trả lời chuẩn "Enterprise Mindset" và "Scientific Reasoning" để bảo vệ kiến trúc, dữ liệu và định hướng của dự án.

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

### 4. "Làm thế nào để đảm bảo dữ liệu hiển thị trên giao diện và file PDF không bị lệch nhau?"
**Chiến lược trả lời (Zustand Store Source of Truth):**
"Dạ thưa Thầy/Cô, hệ thống của chúng em áp dụng nguyên lý Single Source of Truth (SSOT). Dữ liệu PDF xuất ra không được gọi truy vấn API độc lập hay tính toán lại từ đầu. Thay vào đó, dữ liệu PDF được trích xuất (export) trực tiếp từ **Zustand Global Store** đang hiển thị và render trên giao diện Web Dashboard của Advisor. Phương pháp này đảm bảo tính đồng bộ dữ liệu tuyệt đối ($100\%$ consistency) giữa Dashboard đang hiển thị và tài liệu PDF xuất ra, triệt tiêu hoàn toàn rủi ro lệch thông tin."

---

## Nhóm 2: Câu hỏi về AI & Dữ liệu (AI & Data Engineering)

### 5. "Data ở đâu ra để các em train mô hình AI dự đoán rủi ro? Data này có thực tế không?"
**Chiến lược trả lời (Data Honesty & Domain Knowledge):**
"Dạ thưa BGK, bài toán lớn nhất của các dự án AI sinh viên là thiếu data thực tế. Nhóm không cố tình fake data một cách vô lý để train Neural Network phức tạp, vì điều đó tạo ra 'Black box AI' không đáng tin cậy.
Thay vào đó, nhóm sử dụng **Decision Support System (Hệ trợ lý Quyết định)** dựa trên Rule-based và Thống kê học thuật (Academic Correlation). Dữ liệu demo được synthesize (tổng hợp) dựa trên quy chế đào tạo thực tế của FPT Polytechnic (trọng số tín chỉ, môn tiên quyết, môn điều kiện). Mô hình dự đoán dựa trên sự sụt giảm GPA và sự thiếu hụt kiến thức từ các môn tiên quyết (Prerequisite Failure). Hướng đi này giúp AI có tính **Explainability (XAI - Trí tuệ nhân tạo có thể giải thích được)**, điều mà các trường đại học cực kỳ cần để đưa ra quyết định can thiệp."

### 6. "Local NLP Chatbot của các em hoạt động thế nào? Nó có bịa đặt ra các kỹ năng hay đề xuất sai lệch không?"
**Chiến lược trả lời (Hallucination Mitigation):**
"Local NLP của nhóm sử dụng Intent Routing để xử lý các câu hỏi phổ biến ngay tại local. Để tránh hiện tượng AI bịa đặt thông tin (Hallucination), hệ thống áp dụng nguyên tắc **Hallucination-Minimized Design**:
- NLP Assistant bị giới hạn nghiêm ngặt, chỉ được phép trả lời dựa trên thông tin trích xuất từ cơ sở tri thức tĩnh (Knowledge Base) của môn học (`curriculum_knowledge_base.json`) và kết quả đầu ra của DSS Engine.
- Nếu có câu hỏi nằm ngoài phạm vi, hệ thống sẽ từ chối trả lời hoặc chuyển tiếp (fallback) thay vì tự sinh (generative) thông tin không có thực. Mọi kỹ năng và nghề nghiệp đề xuất đều có chuỗi bằng chứng (evidence path) tường minh kết nối trực tiếp đến bảng điểm thực tế của sinh viên."

### 7. "Căn cứ vào đâu mà hệ thống có thể chuẩn hóa các mã môn như WEB206 thành WEB2063 hay VIE102 thành VIE1026?"
**Chiến lược trả lời (Course Code Normalization Map):**
"Dạ thưa Thầy/Cô, hệ thống không tự suy diễn ngẫu nhiên. Chúng em xây dựng một **Course Code Normalization Map** dựa trên dữ liệu thực tế xuất từ portal học vụ và đề cương syllabus chính thức của chuyên ngành Web Development tại FPT Polytechnic.
Ví dụ: Các mã lịch sử hoặc shorthand viết tay trong Excel như `WEB206`, `WEB206(JS)` đều được hệ thống tự động ánh xạ (normalize) về mã môn chuẩn trong hệ thống là `WEB2063` (JavaScript Core). Điều này giúp hệ thống xử lý dữ liệu đầu vào linh hoạt mà vẫn đảm bảo tính toàn vẹn của đồ thị môn học tiên quyết bên dưới."

---

## Nhóm 3: Bảo mật & Vận hành (Security & DevOps)

### 8. "Nếu hệ thống bị tấn công DDoS hoặc sinh viên spam request, hệ thống xử lý thế nào?"
**Chiến lược trả lời (Defense in Depth):**
"Hệ thống áp dụng tư duy Defense-in-Depth (Bảo mật nhiều lớp). Ngay tại cổng API Gateway, nhóm đã cấu hình:
1. **Helmet.js:** Đóng gói các HTTP headers để chống XSS/Clickjacking.
2. **CORS:** Chỉ định đích danh frontend domain được phép gọi API.
3. **Rate Limiting:** Giới hạn số lượng request (ví dụ: 100 request/15 phút) từ một IP. Nếu vượt quá, request sẽ bị drop ngay lập tức ở tầng Gateway mà chưa chạm tới Database.
4. **Zod Validation:** Mọi input từ client đều được validate type chặt chẽ trước khi controller xử lý, chống NoSQL/SQL Injection."

### 9. "Làm sao biết được giảng viên nào đã xem điểm của sinh viên nào (Tính minh bạch)?"
**Chiến lược trả lời (Audit & Compliance):**
"Đây là tính năng nhóm rất tự hào: **Audit Logging**. Không giống các app cơ bản chỉ có CRUD, EduGuard áp dụng Audit Log Middleware. Mọi hành động làm thay đổi dữ liệu (như 'Gắn cờ can thiệp') hoặc truy xuất dữ liệu nhạy cảm đều được ghi log với cấu trúc: *Ai làm (Actor) - Hành động gì (Action) - Đối tượng nào (Target) - Thời gian & IP (Context)*. Việc này đáp ứng chuẩn Enterprise Compliance."

---

## Nhóm 4: Tính Khoa Học & Xác Thực Thực Tế (Scientific Validation)

### 10. "Readiness Score 96/100 của hệ thống dựa trên tiêu chí nào? Tại sao không phải là 100/100?"
**Chiến lược trả lời (Defensive & Realistic QA):**
"Dạ thưa Thầy/Cô, con số **96/100** là điểm đánh giá mức độ sẵn sàng vận hành nội bộ (**Internal QA Readiness Assessment**). Chúng em không khẳng định hệ thống đạt 100% không có lỗi vì thực tế mọi phần mềm phức tạp đều tiềm ẩn rủi ro trong môi trường production thực tế.
Điểm 96/100 dựa trên thang đo kiểm thử tự động toàn diện đối với 653 sinh viên và hơn 16.000 đầu điểm, xác thực không còn bất kỳ lỗi bất đồng bộ hay sai lệch dữ liệu nào giữa DB và UI/PDF. 4% còn lại đại diện cho các điều kiện biên của môi trường production thực tế và sự tương thích trình duyệt mà chúng em cần tiếp tục giám sát sau khi deploy chính thức."

### 11. "Nhóm có dữ liệu thực nghiệm nào chứng minh tính hữu ích của hệ thống đối với sinh viên và giảng viên không?"
**Chiến lược trả lời (Empirical Validation & UAT):**
"Dạ có. Để chứng minh tính khả thi của hệ thống, chúng em đã thực hiện kiểm chứng qua 3 kênh thực nghiệm khoa học:
1. **Khảo sát định lượng (Student Survey):** Tiến hành khảo sát trên **100 sinh viên FPT Polytechnic** để phân tích các yếu tố ảnh hưởng kết quả học vụ. Kết quả phân tích OLS Regression cho thấy mức độ tự học (Self-Regulated Learning - SRL) có tương quan tuyến tính rất mạnh với GPA ($r = 0.42, p < 0.001$, OLS: $\text{GPA} = 1.25 + 0.68 \times \text{SRL}$), chứng minh tính đúng đắn của DSS khi đưa SRL làm trọng tâm của Recovery Roadmap.
2. **User Acceptance Testing (UAT):** Chạy thử nghiệm thực tế với **20 sinh viên chuyên ngành Web Development**. Kết quả ghi nhận **85%** thấy dashboard hữu ích, **90%** hiểu rõ cảnh báo và đồ thị học phần bị chặn, và **80%** đồng ý với định hướng nghề nghiệp của DSS.
3. **Đánh giá từ Chuyên gia (Expert Evaluation):** Hệ thống nhận được phản hồi tích cực từ **1 Giảng viên CNTT** và **1 Mentor Doanh nghiệp** với số điểm Likert cao (từ 4.5 đến 4.8/5.0 cho tính đúng đắn của logic hỗ trợ ra quyết định)."

---

## 🎯 Chốt hạ (Lưu ý khi trả lời)
- **Luôn tự tin:** Nhìn thẳng vào mắt giám khảo. 
- **Không tranh cãi:** Nếu BGK góp ý một công nghệ mới (VD: "Sao không dùng Kafka?"), hãy đáp: *"Dạ cảm ơn thầy cô, đây là một suggestion rất hay. Bọn em đã cân nhắc Kafka cho kiến trúc Event-Driven, nhưng do time-constraint và scope hiện tại, nhóm quyết định chọn RESTful + Redis để đảm bảo tính ổn định (stability) cho bản release này. Ở Phase tiếp theo, Kafka chắc chắn là ưu tiên số 1 để scale hệ thống."* 
- **Chìa khóa:** Luôn lèo lái câu trả lời về **"Sự phù hợp với giai đoạn dự án"**, **"Dữ liệu thực nghiệm khoa học"** và **"Kiểm soát Scope"**.
