# BÁO CÁO CẤU TRÚC KIẾN TRÚC ENTERPRISE - EDUGUARD AI DSS

> **Lưu ý:** Tài liệu này được biên soạn bởi Software Architect. Nó dùng để làm kim chỉ nam giải thích toàn bộ "bức tranh lớn" của dự án EduGuard AI DSS cho Hội đồng Bảo vệ Đồ án, Giảng viên Hướng dẫn và các Cố vấn Học vụ.

---

## I. GIỚI THIỆU DỰ ÁN

### 1. EduGuard AI DSS là gì?
EduGuard AI DSS (Decision Support System) không phải là một phần mềm quản lý điểm số thông thường. Nó là một **Nền tảng Trí tuệ Nhân tạo hỗ trợ ra quyết định học vụ (Educational Intelligence Platform)**. Hệ thống hoạt động như một "Radar cảnh báo sớm", tự động phân tích học bạ, nhận diện các chuỗi rủi ro tiềm ẩn và kích hoạt AI tư vấn giải pháp can thiệp trước khi sinh viên thực sự thất bại (rớt môn, cấm thi).

### 2. Bài toán thực tế đang giải quyết
Các trường Đại học / Cao đẳng hiện nay lưu trữ khổng lồ dữ liệu điểm số, chuyên cần nhưng lại **thiếu công cụ khai thác dữ liệu đó để dự báo tương lai**. Đa số các báo cáo học vụ chỉ phản ánh "quá khứ" (điểm đã chốt, sinh viên đã rớt). EduGuard ra đời để chuyển dịch mô hình từ **"Xử lý Hậu quả" (Reactive)** sang **"Ngăn ngừa Chủ động" (Proactive)**.

### 3. Nỗi đau (Pain Points) thực tế
* **Cố vấn học vụ / Giảng viên:** Quá tải vì 1 người phải quản lý 300 - 500 sinh viên. Rất khó để dò từng dòng học bạ xem ai đang bị hổng kiến thức môn tiên quyết.
* **Nhà trường:** Tỷ lệ sinh viên rớt môn, nợ môn, bỏ học cao làm giảm chất lượng đào tạo và thất thoát nguồn thu học phí.
* **Sinh viên:** Thường rơi vào "hiệu ứng Domino" — rớt 1 môn nền tảng dẫn đến rớt hàng loạt môn chuyên ngành phía sau do mất gốc, gây nản chí.

### 4. Tại sao lại là AI + DSS?
Nếu chỉ dùng Dashboard truyền thống, giảng viên vẫn phải tự dùng não bộ để suy luận: *"Điểm môn Toán rời rạc 4.0 thì môn Cấu trúc dữ liệu sẽ bị ảnh hưởng thế nào?"*.
Với **AI + DSS**, hệ thống tự tính toán và đưa ra kết luận rõ ràng: *"Cảnh báo: Sinh viên X có 85% nguy cơ rớt Cấu trúc dữ liệu do điểm Toán rời rạc quá thấp. Khuyến nghị: Phụ đạo ngay chương Đồ thị."*

### 5. Định vị Hệ thống
EduGuard AI là sự giao thoa hoàn hảo giữa:
* **Predictive Analytics** (Phân tích dữ liệu dự báo tương lai).
* **Decision Support System - DSS** (Hệ thống hỗ trợ ra quyết định tức thì).
* **NLP Assistant** (Trợ lý ngôn ngữ tự nhiên, hiểu bối cảnh của từng cá nhân).

---

## II. CORE FEATURES (TÍNH NĂNG CỐT LÕI)

| Tính năng | Mục đích & Giá trị thực tế | Công nghệ |
| :--- | :--- | :--- |
| **Risk Score / Heatmap** | Quét toàn bộ sinh viên, tính toán điểm rủi ro và highlight các đối tượng "Báo động đỏ". Giúp Cố vấn học vụ nhìn thoáng qua là biết ngay ai cần cứu. | Tensorflow.js, Weighted Logic |
| **Academic Timeline** | Vẽ lại dòng thời gian leo thang rủi ro của sinh viên từ Tuần 1 đến Tuần 8. | Recharts, React.memo |
| **Explainable AI (XAI)** | AI không chỉ đưa ra dự đoán, mà còn phải giải thích ĐƯỢC tại sao lại dự đoán như vậy (Ví dụ: vì điểm chuyên cần tuần trước giảm đột ngột). | Node.js, Thuật toán suy luận |
| **NLP Chatbot (Context-Aware)** | Chatbot thông minh tự động đọc học bạ của sinh viên đang được chọn (active session) để tư vấn lộ trình học chuẩn xác cho riêng người đó. | node-nlp, Text Processing |
| **Session Memory & RBAC** | Ghi nhớ ngữ cảnh trò chuyện, đồng thời phân quyền rõ ràng: Sinh viên chỉ xem được của mình, Giảng viên xem được toàn trường. | Express Middleware, JWT (tương lai) |
| **Bottleneck Detection** | Phát hiện các "môn học thắt cổ chai" (môn có tỷ lệ rớt cao, cản trở tiến độ của đa số sinh viên). | Prisma Analytics |

---

## III. FULL PROJECT STRUCTURE (CẤU TRÚC KIẾN TRÚC ENTERPRISE)

Dự án được tổ chức theo chuẩn **Enterprise Monorepo (Modular Architecture)**, đảm bảo khả năng mở rộng cực tốt mà không bị rối.

```text
eduguard-ai/
├── client/                # (1) Frontend Layer: Chứa giao diện tương tác React
├── server/                # (2) Backend Layer: Xử lý Logic, API và AI Pipeline
├── prisma/                # (3) Database Layer: Chứa Database Schema, Migration & Seed data
├── docs/                  # (4) Documentation: Báo cáo kỹ thuật, API Reference, Slides
├── scripts/               # (5) Tooling Layer: Các script chạy tự động (fix lỗi, setup)
├── generated/             # (6) Artifacts: Chứa các file AI biên bản sinh ra tự động (PDF, Cache)
├── package.json           # Tích hợp lệnh chạy concurrently và build optimized
├── docker-compose.yml     # Dành cho việc scale container production sau này
└── .env                   # Quản lý cấu hình nhạy cảm (Environment variables)
```

### Chi tiết các tầng (Layers) quan trọng:

**1. CLIENT (Frontend React + Vite)**
* `pages/`: Các màn hình chính (Dashboard, Search, Login). Các trang này được **Lazy Load** để tối ưu tốc độ.
* `components/charts/`: Các biểu đồ (Recharts) được bọc bởi `React.memo` để chống re-render thừa thãi.
* `store/`: State management dùng Zustand (quản lý `activeStudent`, `redAlerts`).

**2. SERVER (Backend Node.js)**
* `src/modules/`: Phân chia code theo tính năng (Student Module, NLP Module).
* `src/ai/`: Chứa các "Bộ não" của hệ thống (`dssEngine.js`, `chatbotOrchestrator.js`).
* `src/infrastructure/`: Kết nối Database Prisma, Logger.
* `src/jobs/`: Các background worker để train model, quét dữ liệu rủi ro định kỳ (`train.js`).
* `src/middlewares/`: Cổng bảo vệ, kiểm tra quyền truy cập (RBAC) và Rate Limit.

**3. AI ENGINE (Bên trong `server/src/ai/`)**
* `chatbotOrchestrator.js`: "Nhạc trưởng" điều phối luồng xử lý NLP.
* `intentRouter.js`: Phân loại ý định người dùng (Hỏi điểm? Hỏi rủi ro? Xin lộ trình?).
* `aiDecisionEngine.js`: Tính toán và trả về một Object chứa các quyết định logic (Không trả về text).
* `responseBuilder.js`: Chuyển đổi dữ liệu Object khô khan từ Decision Engine thành câu trả lời tự nhiên, thân thiện.

---

## IV. SYSTEM ARCHITECTURE & DATA FLOW

**Sơ đồ luồng xử lý (Data Flow):**
`Client (React)` ➔ `API Gateway (Express)` ➔ `Chatbot Orchestrator` ➔ `Intent Router` ➔ `AI Decision Engine (DSS)` ➔ `Database (Prisma)` ➔ `Response Builder` ➔ `Client`

**Giải thích Luồng (Flow) chi tiết:**
1. Giảng viên bấm chọn sinh viên "Nguyễn Văn A" và hỏi Chatbot: *"Tại sao em này rủi ro cao?"*.
2. Frontend truyền câu hỏi + ID của Nguyễn Văn A xuống Backend.
3. **Chatbot Orchestrator** tiếp nhận. Nó đưa câu nói cho **Intent Router** phân tích ý định (Kết quả: Ý định = `explain_risk`).
4. **Orchestrator** lấy toàn bộ học bạ của Nguyễn Văn A từ **Prisma DB** và ném vào **AI Decision Engine**.
5. **Decision Engine** chạy các công thức toán học và AI rule: Phát hiện em này điểm chuyên cần dưới 50% và nợ môn Toán.
6. **Response Builder** lấy kết quả thô, lắp ráp thành câu văn tự nhiên: *"Chào thầy, em Nguyễn Văn A rủi ro cao do chuyên cần thấp và nợ môn tiên quyết. Khuyến nghị..."*

---

## V. AI & DSS PIPELINE ĐỈNH CAO

Hệ thống AI không nằm ở một cục code rối rắm, mà được chia thành một **Pipeline chuyên nghiệp**:

1. **Weighted Risk Engine (Trọng số Rủi ro):** Không phải môn nào cũng quan trọng như nhau. Rớt môn "Kỹ năng mềm" ít rủi ro hơn rớt "Lập trình C++". Engine này dùng ma trận trọng số (Dependency Tree) để tính toán điểm rủi ro.
2. **Session Memory:** Khi bạn hỏi: *"Thế điểm môn Toán của em ấy thì sao?"*, hệ thống tự ngầm hiểu chữ *"em ấy"* là Nguyễn Văn A nhờ vào Context Memory.
3. **Academic Timeline Generator:** Thuật toán duyệt qua dữ liệu 8 tuần, nội suy các điểm cảnh báo để vẽ thành đường Trendline trơn tru trên Frontend.
4. **Event System & Cache Layer:** Giữ cho hệ thống mượt mà. Thay vì mỗi lần request phải tính toán lại rủi ro của 5000 sinh viên, `jobs/train.js` sẽ chạy định kỳ mỗi đêm và lưu kết quả vào Cache.

---

## VI. SECURITY & ROLE-BASED ACCESS CONTROL (RBAC)

Hệ thống được thiết kế chặt chẽ về quyền hạn:
* **Student Role:** Đăng nhập chỉ xem được duy nhất học bạ và đồ thị phân tích của bản thân. Mọi hành vi cố tình chọc API gọi sang sinh viên khác đều bị chặn lại ở tầng Middleware.
* **Teacher / Advisor Role:** Truy cập được toàn bộ hệ thống Dashboard toàn trường. Tính năng xuất "Biên bản PDF có chữ ký" chỉ dành cho role này.

---

## VII. TECHNOLOGY STACK

* **Frontend:** React + Vite (Tốc độ build siêu nhanh với Rolldown), Zustand (Quản lý state nhẹ hơn Redux), TailwindCSS (UI hiện đại, dễ scale), Recharts (Biểu đồ tương tác).
* **Backend:** Node.js + Express (Xử lý I/O non-blocking cực tốt), Prisma (Type-safe Database ORM chống SQL Injection), SQLite (Database nhúng, hoàn hảo cho giai đoạn Prototype/Demo mà không cần setup phức tạp).
* **AI Layer:** `@tensorflow/tfjs` (Machine Learning Neural Networks chạy trực tiếp trên môi trường JS), `node-nlp` (Xử lý xử lý ngôn ngữ tự nhiên cực nhẹ và offline).
* **Tối ưu hóa (Enterprise):** `react-window` (Virtualized Render danh sách hàng ngàn sinh viên), `concurrently` (Khởi chạy đồng thời 2 server cực kỳ thanh lịch).

**Tại sao chọn Stack này?** 
Nó mang lại sự thống nhất hoàn toàn bằng **JavaScript/TypeScript từ Front đến Back đến AI**, tối đa hóa tốc độ phát triển và triệt tiêu độ trễ giao tiếp giữa các hệ thống ngôn ngữ khác nhau.

---

## VIII. WHY THIS PROJECT IS IMPORTANT (TẦM QUAN TRỌNG)

1. **Tính nhân văn & Giáo dục:** Không bỏ rơi bất kỳ sinh viên nào. Một lời nhắc nhở đúng lúc từ AI có thể cứu vãn cả một kỳ học của sinh viên.
2. **Quản trị rủi ro Doanh nghiệp:** Giúp ban giám hiệu trường học tối ưu nguồn lực, Cố vấn học vụ chỉ tập trung vào "Top 10% rủi ro cao" thay vì mông lung rà soát toàn bộ.
3. **Khả năng thương mại hóa:** Có thể dễ dàng đóng gói (SaaS) và bán cho các trung tâm tiếng Anh, trường đại học, hệ thống LMS (như Moodle, Canvas).

---

## IX. ENTERPRISE FEATURES (DẤU ẤN DOANH NGHIỆP)

Đây không phải là một "Đồ án sinh viên cơ bản". Điểm làm nên chất Enterprise của EduGuard:
* **Decoupled Architecture:** Tách bạch Frontend (Port 5173) và Backend (Port 3000), giao tiếp hoàn toàn qua REST API.
* **Production Build Mode (`npm run boot`):** Không dùng chế độ Dev để biểu diễn. Hệ thống được Minify, Lazy Load chunk js, khử code thừa và chạy qua local Production Server siêu tốc trên port 5173.
* **Explainable AI:** AI không phải hộp đen (Black-box). Mọi dự đoán rủi ro đều truy xuất ngược ra được bằng chứng (ví dụ: do rớt môn XYZ với điểm số 4.0).
* **Virtualized Rendering:** Xử lý danh sách lớn không bao giờ bị giật lag trình duyệt.

---

## X. CURRENT LIMITATIONS (HẠN CHẾ HIỆN TẠI)

* Dữ liệu huấn luyện hiện đang là Dữ liệu giả lập (Mock data / Seeders) theo luật Phân phối chuẩn. Chưa có dữ liệu hàng chục năm của trường để train Deep Learning.
* SQLite cực kỳ tuyệt vời cho Demo, nhưng khi lên Scale lớn (1 triệu truy vấn/ngày) sẽ bị lock (Database locked).
* Mới chỉ dừng ở NLP Chatbot xử lý Text, chưa tích hợp Voice-to-Text.

---

## XI. FUTURE ROADMAP (ĐỊNH HƯỚNG TƯƠNG LAI)

**Phase 4 (Scale to Cloud):**
* Chuyển đổi SQLite sang PostgreSQL / CockroachDB (Database phân tán).
* Đưa Docker vào triển khai tự động qua Kubernetes (K8s).
* Tích hợp Redis Pub/Sub để làm hệ thống thông báo Push Notification theo thời gian thực mỗi khi có sinh viên tụt chuyên cần (điểm danh hụt).
* Triển khai Mobile App (React Native) cho phụ huynh theo dõi.

---

## XII. SLIDE PRESENTATION FORMAT (OUTLINE GỢI Ý CHO SLIDE)

* **Slide 1 - Giới thiệu:** Tên dự án "EduGuard AI - Hệ thống DSS cảnh báo sớm học vụ". Tên SV, GVHD.
* **Slide 2 - Vấn đề (Pain Point):** Đưa hình ảnh 1 GV phải gánh 300 SV, sinh viên rớt môn không ai hay.
* **Slide 3 - Giải pháp (Solution):** EduGuard DSS - Chủ động dự báo thay vì bị động giải quyết.
* **Slide 4 - Kiến trúc Hệ thống (Architecture):** Chèn sơ đồ Client -> Backend -> AI Engine -> DB.
* **Slide 5 - Pipeline AI thông minh:** Mô tả sơ đồ `Orchestrator -> Intent Router -> Decision Engine`.
* **Slide 6 - Dashboard Analytics:** Chụp ảnh màn hình thật của Heatmap và Trend Chart đẹp mắt.
* **Slide 7 - Demo Flow:** Khẳng định: "Xin mời thầy cô xem Demo trực tiếp hệ thống xử lý thời gian thực".
* **Slide 8 - Tính năng Doanh nghiệp:** Khoe tốc độ mượt mà nhờ React-Window, chuẩn hóa code, Lazy Loading.
* **Slide 9 - Tương lai & Kết luận:** Định hướng App phụ huynh, đổi sang Cloud. Lời cảm ơn.

---

**[EduGuard AI DSS - END OF ARCHITECTURE REPORT]**
