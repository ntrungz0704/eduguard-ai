# BÁO CÁO TỔNG HỢP & PHÂN TÍCH CHUYÊN SÂU: EDUGUARD AI
## NỀN TẢNG PHÂN TÍCH HỌC VỤ & CẢNH BÁO SỚM THÔNG MINH (ACADEMIC INTELLIGENCE PLATFORM)

**Tài liệu dành cho:** Hội đồng Khoa học, Nhà đầu tư (VC), Ban giám khảo chuyên môn và Đội ngũ Kỹ sư Phát triển.
**Đơn vị thực hiện:** EduGuard AI Team
**Phiên bản Tài liệu:** 5.0 (Enterprise Production-Ready)

---

### 1. GIỚI THIỆU DỰ ÁN (PROJECT OVERVIEW & VISION)

**1.1 Tổng quan dự án**
Giáo dục đại học hiện đại đang tạo ra một lượng dữ liệu khổng lồ (Big Data) mỗi ngày: từ điểm số, điểm danh, đến hành vi tương tác trên hệ thống quản lý học tập (LMS). Tuy nhiên, hầu hết các trường đại học vẫn đang hoạt động theo mô hình quản trị "thụ động" (Reactive) — tức là chỉ nhận diện vấn đề sau khi sinh viên đã thực sự thi rớt hoặc bảo lưu.
EduGuard AI ra đời như một **Nền tảng Phân tích Học vụ (Academic Intelligence Platform)** tích hợp trí tuệ nhân tạo (AI) và khai phá dữ liệu giáo dục (Educational Data Mining - EDM) để đưa ra các phán đoán có cơ sở khoa học về xu hướng học thuật của từng cá nhân sinh viên.

**1.2 Ý tưởng hình thành và sự cấp thiết**
Sự thất bại học thuật hiếm khi xảy ra đột ngột. Phân tích sơ bộ cho thấy rớt môn mang tính "dây chuyền" (Domino Effect). Một sinh viên hổng kiến thức ở môn Nhập môn Lập trình sẽ có tỷ lệ rớt môn Cấu trúc Dữ liệu lên tới 80%. Nếu có một hệ thống cảnh báo kịp thời ngay từ tuần thứ 3 của học kỳ, giảng viên có thể can thiệp, cứu vãn toàn bộ chặng đường đại học của sinh viên đó. EduGuard AI được xây dựng để giải quyết bài toán cốt lõi này.

**1.3 Mục tiêu & Tầm nhìn tương lai**
Tầm nhìn của EduGuard AI là trở thành một "Bản sao số học thuật" (Academic Digital Twin). Hệ thống phục vụ đồng thời 3 đối tượng:
*   **Giảng viên / Cố vấn học tập:** Trở thành hệ thống hỗ trợ ra quyết định (Decision Support System), giúp họ can thiệp chính xác dựa trên Data-driven.
*   **Sinh viên:** Hệ thống hỗ trợ tạo động lực học tập, cung cấp dự báo xu hướng để sinh viên tự điều chỉnh.
*   **Nhà trường:** Một công cụ quản trị rủi ro vĩ mô, giảm thiểu tỷ lệ bỏ học (Dropout Rate) và bảo vệ nguồn thu (Retention Revenue).

---

### 2. PAIN POINTS (NỖI ĐAU THỰC TẾ TRONG HỆ THỐNG GIÁO DỤC)

Hệ thống quản lý sinh viên hiện tại tồn tại những "nỗi đau" (Pain points) khiến cả giảng viên và sinh viên gặp khó khăn:

**2.1 Giảng viên và sự quá tải (Advisor Burnout)**
Một cố vấn học vụ trung bình quản lý từ 100 đến 300 sinh viên. Họ phải theo dõi thủ công bằng Microsoft Excel, dùng hàm VLOOKUP để đối chiếu điểm từ nhiều file khác nhau. Quy trình này khiến giảng viên tốn nhiều thời gian cho việc nhập liệu, giảm thời gian cho việc "khai vấn" hay định hướng nghề nghiệp.

**2.2 Sự phân mảnh dữ liệu (Data Silos)**
Thông tin về điểm danh, điểm bài tập trên LMS, và điểm thi trên Hệ thống Đào tạo hoàn toàn rời rạc. Việc vắng mặt liên tục ở tuần 1 và tuần 2 có tương quan mạnh mẽ với việc thi rớt, nhưng vì Data Silos, không một hệ thống nào tự động chỉ ra mối liên hệ này.

**2.3 Phân tích Hậu kiểm (Post-mortem Alerts)**
Hầu hết các trường chỉ gửi "Cảnh báo học vụ" vào CUỐI học kỳ, khi GPA đã tụt xuống dưới mức cho phép. Sự can thiệp lúc này thường quá muộn, sinh viên mất động lực (Dropout risk), và tỷ lệ phục hồi rất thấp.

---

### 3. GIẢI PHÁP EDUGUARD AI (THE ENTERPRISE SOLUTION)

EduGuard AI là một Nền tảng AI khép kín cung cấp chuỗi giá trị từ: **Phân tích -> Dự báo -> Giải thích -> Can thiệp**.

**3.1 Predictive Academic Analytics (Phân tích Dự báo Học vụ)**
Thay vì chờ đến cuối kỳ, EduGuard phân tích ngay từ tuần học đầu tiên dựa trên lịch sử điểm các môn tiên quyết và tỷ lệ đi học. 
*   **Forecasting academic risk trends:** Dự báo xu hướng học tập dựa trên dữ liệu.
*   **Khai thác Môn Tiên Quyết:** Thuật toán tìm ra mối liên hệ nhân quả (VD: Điểm C++ thấp ảnh hưởng trực tiếp đến kết quả môn Java).
*   **Real-time Risk Score:** Điểm rủi ro học tập được cập nhật liên tục khi có dữ liệu đầu vào mới.

**3.2 Red Alert System (Hệ thống Cảnh báo Đỏ)**
Phân loại sinh viên trực quan: Đỏ (High Risk), Vàng (Medium Risk), và Xanh (Safe). Hệ thống đánh dấu cờ (Flag) những sinh viên Đỏ lên màn hình của Cố vấn học tập.

**3.3 Explainable AI (XAI) - Máy học minh bạch**
Hệ thống không sử dụng mô hình "Hộp đen". Thay vào đó, nó cung cấp lời giải thích tường minh: *"Sinh viên có 88% rủi ro rớt môn Thiết kế Web vì: 1. Điểm môn HTML (Tiên quyết) thấp; 2. Tuần qua vắng 3 buổi"*. XAI cung cấp cơ sở lập luận minh bạch cho giảng viên.

**3.4 What-if GPA Simulation (Mô phỏng Kết quả tương lai)**
Giảng viên có thể dùng thanh trượt (Slider) để giả lập: *"Nếu từ tuần sau em đi học đủ 100% và đạt 7.0 điểm giữa kỳ, rủi ro rớt môn của em sẽ giảm từ 88% xuống còn 30%"*. **Hệ thống hỗ trợ tạo động lực học tập thông qua việc mô phỏng trực quan.**

**3.5 AI Intervention System (Hệ thống can thiệp khép kín)**
Hệ thống theo dõi toàn bộ quá trình hỗ trợ theo nguyên lý Closed-loop Intervention:
`Cảnh báo` -> `Giáo viên can thiệp` -> `Ghi nhận Audit Log` -> `Theo dõi tiến bộ (Sau 2 tuần)` -> `Đánh giá mức độ cải thiện` -> `Tối ưu mô hình`.

---

### 4. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống được thiết kế theo tư duy Enterprise Architecture, tách bạch luồng xử lý và dữ liệu.

**4.1 Frontend Layer (Giao diện người dùng)**
Xây dựng bằng **React.js** và **Tailwind CSS**. Component hóa giúp render giao diện nhanh chóng, mang lại trải nghiệm Dashboard quản trị chuyên nghiệp và responsive.

**4.2 Backend API Layer & Authentication**
Sử dụng **Node.js** và **Express** làm API Gateway. Kiến trúc Asynchronous Non-blocking, bảo mật với JWT và Rate Limiting chống DDoS.

**4.3 Database Layer (Prisma & PostgreSQL)**
Sử dụng **PostgreSQL** kết hợp **Prisma ORM** đảm bảo ACID transaction. Prisma ORM cung cấp Type-safety nghiêm ngặt, ngăn chặn triệt để SQL Injection. (Bản MVP hiện đang dùng SQLite để tối ưu tốc độ phát triển nhưng Schema hoàn toàn tương thích PostgreSQL).

**4.4 Queue System & Background Workers**
Thiết kế sẵn sàng xử lý hàng loạt khối lượng dữ liệu lớn mà không gây treo server (blocking Event Loop):
*   API nhận file Excel chứa 10,000 dòng điểm -> Ném Job vào **Redis Queue** -> Trả về `HTTP 202 Accepted`.
*   **AI Background Workers** (chạy ngầm) sẽ Pull data từ Redis, load mô hình Machine Learning, xử lý Batch Analytics và Write-back vào Database.

---

### 5. KIẾN TRÚC NLP VÀ ROUTER (OFFLINE/ONLINE AI)

EduGuard AI áp dụng **Hybrid AI Architecture** để cân bằng giữa bảo mật và khả năng phân tích ngôn ngữ sâu:

**5.1 Local NLP Intent Classification Engine (Offline)**
Sử dụng thư viện `node-nlp` chạy độc lập trên server nội bộ như một Lightweight NLP Engine.
*   **Cách hoạt động:** Khi giảng viên nhập câu lệnh tìm kiếm, Local NLP sẽ phân tích Intent và trích xuất Entity. *Intent Router ánh xạ intent sang predefined query blocks* an toàn thông qua Prisma.
*   **Ưu điểm:** Đảm bảo data privacy tuyệt đối, không đẩy thông tin nhạy cảm lên cloud. Tốc độ phản hồi tức thời.

**5.2 Online AI Mode (Semantic RAG Fallback)**
Đối với các câu hỏi phức tạp không nằm trong predefined query blocks, hệ thống fallback sang API bên ngoài (như Gemini) kết hợp RAG. Dữ liệu ngữ cảnh được truy xuất và làm sạch trước khi gửi để tránh Hallucination.

---

### 6. PHÂN TÍCH MACHINE LEARNING (LÕI THUẬT TOÁN)

Lựa chọn **Interpretable Machine Learning** thay vì Deep Learning, bởi dataset học vụ chưa đủ lớn và tính giải thích (Explainability) là yêu cầu tiên quyết trong giáo dục.

**6.1 Pearson Correlation (Đo lường tương quan)**
Pearson giúp đo tương quan tuyến tính giữa các môn học để phục vụ feature selection (chọn lọc đặc trưng) trước khi đưa vào mô hình hồi quy. Đây là cơ sở khoa học để xác định "Môn tiên quyết" thực sự thay vì chỉ dựa vào chương trình học.

**6.2 Linear Regression (Hồi quy tuyến tính)**
Sử dụng điểm môn tiên quyết và số ngày vắng mặt để dự báo rủi ro học tập. Linear Regression mang lại khả năng diễn giải minh bạch, giúp hệ thống XAI dễ dàng truy xuất trọng số (weights) của từng biến.

**6.3 Đánh giá Mô hình (Metrics)**
*   Mô hình cho kết quả dự báo sát với xu hướng thực tế thông qua chỉ số RMSE.
*   Chiến lược đánh giá ưu tiên **Độ nhạy (Recall)** để phát hiện sớm nhất các sinh viên có nguy cơ cao, giảm thiểu tỷ lệ bỏ sót (False Negative).

---

### 7. CẤU TRÚC DATABASE (PRECOMPUTATION & MATERIALIZED VIEW)

Thiết kế CSDL tuân thủ chuẩn Normalization 3NF và tối ưu cho hiệu năng đọc/ghi:
*   **Score / Attendance:** Bảng Fact lưu trữ kết quả và chuyên cần. Đánh Composite Index `(studentId, courseId)` để tránh Table Scan.
*   **Prediction (Materialized View Concept):** Đây là điểm nhấn kiến trúc. Thay vì tính toán realtime mỗi khi request, AI Worker chạy Batch Analytics ngầm và ghi kết quả (RiskScore, Confidence, XAI_Reasons) vào bảng Prediction. Tốc độ Fetching qua API đạt O(1) - Rất đúng chuẩn Production.
*   **Audit Logging (Intervention):** Lưu toàn bộ vết can thiệp của giảng viên (AI Decision Logs). Cung cấp khả năng Observability và Compliance.

---

### 8. QUẢN TRỊ PHÂN QUYỀN VÀ BẢO MẬT (RBAC & MULTI-TENANCY)

**8.1 Quản trị Quyền (Role-Based Access Control)**
*   **Giảng viên:** Upload dữ liệu, xem analytics, quản lý can thiệp, chạy what-if simulation, xem log XAI. Chỉ được truy cập dữ liệu trong phạm vi phụ trách.
*   **Sinh viên:** Xem dự báo GPA cá nhân, nhận các thông báo hỗ trợ học tập tự động. Không được quyền xem dữ liệu chéo.

**8.2 Tenant Isolation Strategy (Kiến trúc Đa khách hàng)**
Hướng tới mô hình B2B SaaS, kiến trúc hỗ trợ Multi-tenancy thông qua:
*   Thêm trường `tenant_id` ở cấp độ Schema.
*   Row-level isolation đảm bảo dữ liệu trường A tách biệt hoàn toàn với trường B ở mức Database.

---

### 9. SCALABILITY, DEPLOYMENT & TESTING (SẴN SÀNG QUY MÔ LỚN)

Hệ thống được định hướng theo tiêu chuẩn Enterprise với các chiến lược:

**9.1 Testing Strategy**
*   **Unit & Integration Tests:** Áp dụng Jest/Mocha cho các luồng xử lý API lõi.
*   **AI Evaluation:** Đánh giá độ lệch mô hình (Drift detection) trên các tập dữ liệu lịch sử.

**9.2 Deployment & Observability**
*   Toàn bộ hệ thống được **Dockerize**, phân rã thành các container độc lập (Web, API, Worker, Redis, DB).
*   *Future Observability Architecture:* Sẵn sàng tích hợp Prometheus và Grafana để monitor sức khỏe của AI Worker và Database metrics. Cung cấp API Documentation qua Swagger/OpenAPI.

---

### 10. ĐỊNH HƯỚNG TƯƠNG LAI VÀ GIÁ TRỊ DOANH NGHIỆP (BUSINESS & STARTUP POTENTIAL)

**10.1 Triết lý AI Giáo dục (Human-in-the-loop)**
AI đóng vai trò như một Decision Support System (Hệ thống hỗ trợ ra quyết định). Hệ thống tập trung cung cấp insight học thuật, giúp giảng viên phát hiện vấn đề và có biện pháp tư vấn phù hợp. *Hệ thống không thay thế các chuyên gia tâm lý hay cố vấn giáo dục.*

**10.2 Tiềm năng Startup B2B EdTech**
EduGuard AI giải quyết bài toán sụt giảm Retention Rate - nỗi đau chảy máu doanh thu của mọi trường Đại học. Với mô hình SaaS Subscription hoặc Enterprise On-premise License (nhờ khả năng chạy Offline NLP), sản phẩm có độ thực tế và tính thương mại hóa rất cao.

### KẾT LUẬN TỪ KIẾN TRÚC SƯ HỆ THỐNG
Dự án EduGuard AI không còn là một hệ thống CRUD quản lý sinh viên đơn thuần, mà là một **Academic Intelligence Platform MVP** thực thụ. Sự kết hợp giữa tư duy phân rã hệ thống (Decoupling bằng Queue/Redis), tối ưu truy xuất (Materialized Prediction), minh bạch thuật toán (XAI), và tư duy triển khai bảo mật (Offline AI) đã tạo ra một nền tảng vững chắc, sẵn sàng để nâng cấp quy mô và thương mại hóa trong tương lai.

*(HẾT BÁO CÁO)*
