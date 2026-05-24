# EDUGUARD DSS - FINAL DEFENSE BLUEPRINT
*(Tài liệu Bách khoa toàn thư bảo vệ đồ án - Dành cho Sinh viên)*

---

## PHẦN 1 — EXECUTIVE SUMMARY (TÓM TẮT DỰ ÁN DỄ HIỂU)

**1. Giải thích dự án (Ngôn ngữ bình dân)**
Tưởng tượng trường học là một bệnh viện. Giảng viên/Cố vấn học tập (CVHT) là bác sĩ, sinh viên là bệnh nhân. Hiện nay, bác sĩ chỉ biết bệnh nhân ốm khi bệnh nhân đã... nằm cáng (rớt môn, đuổi học). 
EduGuard DSS sinh ra như một chiếc "Đồng hồ thông minh đo nhịp tim". Nó liên tục thu thập điểm số, theo dõi chuyên cần và **dự báo trước** bệnh nhân nào sắp gục ngã, để bác sĩ gọi điện hỏi thăm và cho thuốc (gợi ý lộ trình) ngay lập tức. 

**2. Ví dụ đời thực**
Cậu sinh viên tên Nam mải chơi game, cúp học 2 tuần liên tiếp môn C++ và tạch bài Quiz 1. Nếu theo cách cũ, cuối kỳ Nam rớt môn C++, sau đó không được học C# (môn tiên quyết), nản quá Nam bỏ học luôn. 
Nhưng với EduGuard, hệ thống thấy điểm rủi ro của Nam tăng vọt từ Xanh sang Đỏ ngay tuần 3. CVHT nhận cảnh báo, bốc máy gọi Nam nhắc nhở, Nam tỉnh ngộ đi học lại $\rightarrow$ Cứu được 1 sinh viên.

**3. Elevator Pitch (30 giây)**
"Kính thưa hội đồng, EduGuard DSS là Hệ thống Hỗ trợ Ra quyết định học vụ. Chúng em dùng AI và Data Analytics để tìm ra những sinh viên đang mấp mé bờ vực rớt môn ngay từ giữa kỳ. Khác với phần mềm quản lý điểm truyền thống chỉ hiển thị kết quả, EduGuard dự báo tương lai và cung cấp Trợ lý ảo giúp Cố vấn học tập cứu vớt sinh viên trước khi quá muộn."

**4. Giới thiệu dự án (2 phút)**
"Thực trạng giáo dục đại học hiện nay là 'sự bị động'. CVHT quản lý hàng ngàn sinh viên bằng Excel, dẫn đến việc sinh viên rớt môn dây chuyền mà không ai hay biết cho đến khi điểm thi cuối kỳ được chốt.
EduGuard giải quyết bài toán này bằng việc chuyển hóa dữ liệu tĩnh thành Dự báo động (Predictive Analytics). Bằng cách kết hợp Rule-based Risk Engine để tính điểm rủi ro và node-nlp để tạo Trợ lý ảo giao tiếp tự nhiên, EduGuard mang đến một Dashboard toàn cảnh. Thầy cô có thể nhìn thấy độ dốc rủi ro của từng người, môn học nào đang là 'nút thắt cổ chai', và đặc biệt là hệ thống XAI sẽ giải thích minh bạch vì sao sinh viên này bị đánh giá là rủi ro. Chúng em không tạo ra một AI thay thế con người, chúng em tạo ra một công cụ DSS giúp con người ra quyết định nhân văn hơn."

**5. Vì sao chọn đề tài này?**
Vì nó giải quyết **Nỗi đau thật (Real Pain)**. Các đồ án thường chọn đề tài e-commerce, quản lý sinh viên CRUD (thêm/sửa/xóa). Đề tài này chạm đến sinh mệnh học thuật của con người và nguồn thu của nhà trường.

**6. Nỗi đau thực tế**
- **Sinh viên:** Cô đơn, học yếu không ai nhắc, rớt môn dây chuyền $\rightarrow$ Bỏ học.
- **Giảng viên / CVHT:** Quá tải (Burnout). Quản 1000 sinh viên, không thể lật Excel dò từng đứa.
- **Nhà trường:** Sinh viên bỏ học $\rightarrow$ Mất doanh thu, giảm uy tín đào tạo.

**7. Giá trị nhân văn & Doanh nghiệp**
- **Nhân văn:** Không bỏ lại sinh viên nào phía sau.
- **Doanh nghiệp:** Mô hình B2B SaaS. Trường chỉ cần cứu được 10 sinh viên khỏi việc bỏ học là đủ tiền mua bản quyền phần mềm 1 năm.

---

## PHẦN 2 — PHÂN TÍCH VẤN ĐỀ (PAIN POINT)

**1. Vấn đề cốt lõi trong giáo dục đại học**
- **Giáo dục bị động:** Giáo dục hiện nay giống như "khám nghiệm tử thi". Nghĩa là sinh viên rớt rồi mới biết là rớt. Chúng ta cần "y tế dự phòng".
- **Dữ liệu phân mảnh:** Điểm nằm ở LMS, điểm danh nằm ở FAP/ERP. Không ai gom chúng lại để nhìn thấy bức tranh tổng thể.
- **Overload CVHT:** Một CVHT quản lý quá nhiều sinh viên, sức người không thể phân tích nổi 10,000 dòng dữ liệu Excel mỗi ngày.

**2. Descriptive vs Predictive (Mô tả vs Dự báo)**
- **LMS hiện tại (Descriptive):** Cho biết: "Tuần trước Nguyễn Văn A được 3 điểm".
- **EduGuard DSS (Predictive):** Cho biết: "Nếu tuần này Nguyễn Văn A không cải thiện, tuần sau em ấy sẽ rớt môn, và học kỳ sau không thể đăng ký môn B".

---

## PHẦN 3 — GIẢI PHÁP EDUGUARD DSS

- **AI đóng vai trò gì?** Dùng NLP để biến những lệnh phức tạp (Tìm kiếm, gõ SQL) thành câu chat tiếng Việt đơn giản ("Cho tôi xem danh sách rủi ro").
- **DSS đóng vai trò gì?** Đóng vai trò tổng hợp, tính toán rủi ro và "dọn sẵn lên mâm" để CVHT đưa ra quyết định gọi điện hay gửi email cảnh báo.
- **Dashboard & Heatmap:** Thay vì nhìn 1000 con số, CVHT nhìn vào màn hình toàn màu Đỏ (nguy hiểm) và Xanh (an toàn).
- **Timeline:** Giúp nhận diện xu hướng. Rủi ro đi lên dần dần hay đột ngột tăng vọt? (Đột ngột có thể do biến cố gia đình).
- **XAI (Explainable AI):** Giúp hệ thống không bị gọi là "máy chém vô lý". Cứ cảnh báo là phải có bằng chứng: "Vì vắng 3 buổi + Điểm Quiz 1 < 5".

---

## PHẦN 4 — HỆ THỐNG HIỆN TẠI ĐANG CÓ GÌ VÀ CHƯA CÓ GÌ?

**1. Hệ thống ĐANG CÓ (Hiện tại):**
- **Frontend:** React + Vite, có Dashboard, Heatmap, Risk Chart, Timeline Chart. Dùng Virtualized Rendering cực mượt.
- **Backend:** Node.js, Express, kiến trúc Modular Monolith.
- **Database:** SQLite + Prisma ORM (Nhỏ gọn, dễ demo).
- **AI / Chatbot:** Node-nlp chạy offline. Hiểu Intent, trích xuất Entity, có Session Memory.
- **DSS:** Logic Rule-based tính điểm rủi ro. XAI giải thích lý do.

**2. Phân tích bóc tách sự thật (Cho giám khảo):**
- **Cái nào là AI thật?** NLP Chatbot (phân loại ý định, huấn luyện trước bằng text).
- **Cái nào là IF-ELSE (Không phải ML)?** Rule-based Risk Scoring (Điểm < 5 thì rủi ro +20).
- **Cái nào là Mock Data?** Toàn bộ sinh viên, điểm số hiện tại là dữ liệu giả lập dựa trên logic của trường (vì trường không cấp data thật).

**3. Hệ thống CHƯA CÓ (Và không nên chém gió là có):**
- Deep Learning / LSTM.
- Dữ liệu Real-time quét thẻ điểm danh.
- API móc trực tiếp vào LMS trường.
- App Mobile cho phụ huynh.

---

## PHẦN 5 — DATABASE & DATA FLOW

**1. Database hiện tại (SQLite):**
- Dùng cho Prototype vì siêu nhẹ, không bắt giám khảo tải PostgreSQL nặng nề.
- **Bảng đang có:** `Student` (SV), `Subject` (Môn học), `Grade` (Điểm), `RiskLog` (Lịch sử rủi ro), `ChatSession` (Phiên chat).
- **Prisma ORM là gì?** Nó là thư viện giúp code JavaScript tương tác với Database thay vì phải gõ câu lệnh SQL lằng nhằng. Đổi từ SQLite sang PostgreSQL chỉ mất đúng 1 dòng code config.

**2. Tương lai (Nếu bán cho trường - Production):**
- **Cần thêm Database:** PostgreSQL (chịu tải hàng chục ngàn SV). Redis (Cache để tải Dashboard trong 0.1s).
- **Cần thêm bảng:** `attendance_logs` (lịch sử điểm danh), `intervention_tracking` (lịch sử Thầy cô đã gọi điện nhắc nhở SV chưa).

---

## PHẦN 6 — AI & MACHINE LEARNING (BẢN CHẤT SỰ THẬT)

**1. Hiện tại (NLP & Rule-based):**
- **Node-nlp đang làm gì?** Nó nhận câu "Chỉ tôi đứa nào sắp rớt". Nó bóc tách (Entity Extraction) để hiểu không có tên cụ thể, và phân loại ý định (Intent Classification) là `search_risk`.
- **Vì sao không dùng Deep Learning (LSTM) bây giờ?**
   - Không có Big Data thật của trường. Train Deep Learning bằng Mock Data là hành động vô nghĩa và lừa dối (Over-engineering).
   - Rule-based là sự khởi đầu hoàn hảo nhất cho một Enterprise Prototype: Chính xác, dễ giải thích (XAI), và chi phí chạy bằng $0.

**2. Tương lai (Nếu có data thật của trường):**
- **Time-series Prediction (LSTM):** Đưa điểm số và điểm danh của SV trong 5 năm vào. AI sẽ tự mò ra quy luật "Những đứa có mô hình điểm giống Nguyễn Văn A, 90% sẽ rớt ở học kỳ 3".

---

## PHẦN 7 — KIẾN TRÚC HỆ THỐNG

- **Modular Monolith là gì?** Giống như một cái nhà cấp 4 bự, chia làm nhiều phòng (Phòng Chat, Phòng Điểm, Phòng Analytics).
- **Tại sao không Microservices?** Microservices là xây 5 cái nhà ở 5 tỉnh khác nhau. Rất tốn kém server và phức tạp. Hệ thống đang làm Demo Prototype cho 1 người code thì Monolith là "Best Practice" (chuẩn mực). Microservices lúc này là Over-engineering (vẽ rắn thêm chân).
- **Event-driven (Tương lai):** Khi điểm danh vắng mặt (Event), hệ thống tự động châm ngòi nổ $\rightarrow$ Tính toán rủi ro lại $\rightarrow$ Bắn tin nhắn cho Thầy cô.

---

## PHẦN 8 — TỪ ĐIỂN THUẬT NGỮ ĐỜI THƯỜNG

| English | Tiếng Việt | Giải thích dân dã | Vai trò EduGuard |
|---------|------------|-------------------|------------------|
| **DSS** | Hệ thống hỗ trợ ra quyết định | Máy móc dọn mâm cơm, con người quyết định ăn hay không. | Hệ thống cung cấp cảnh báo, CVHT gọi điện cho SV. |
| **NLP** | Xử lý ngôn ngữ tự nhiên | Dạy máy tính hiểu tiếng Việt thay vì hiểu code. | Chatbot giao tiếp với Thầy cô bằng tiếng Việt. |
| **XAI** | AI giải thích được | Phán có tội thì phải trình bằng chứng. Không giấu diếm. | Giải thích lý do vì sao SV này bị xếp loại nguy hiểm đỏ. |
| **Modular Monolith**| Nguyên khối chia mô-đun | Chung 1 cục project nhưng chia folder cực kỳ gọn gàng. | Kiến trúc Backend của dự án. Dễ chạy demo. |
| **Lazy Loading** | Tải lười biếng | Khi nào cần mới tải đồ về, không tải sẵn một nùi. | Giúp web khởi động cực nhanh ở giây đầu tiên. |
| **Rule-based** | Dựa trên luật | Luật IF-ELSE tĩnh do con người cài đặt. | Chấm điểm Risk Score hiện tại. |
| **Session Memory**| Trí nhớ theo phiên | Chatbot nhớ câu trước bạn vừa nói về ai, không hỏi lại. | UX trải nghiệm mượt mà khi thầy cô chat với hệ thống. |

---

## PHẦN 9 — FULL 20 SLIDES THUYẾT TRÌNH (CẤU TRÚC CHUẨN)

1. **Title:** EduGuard DSS - Khơi sáng dữ liệu, Cứu vớt sinh viên.
2. **The Problem:** Giáo dục bị động. Khám nghiệm tử thi thay vì Y tế dự phòng.
3. **The Pain:** Sinh viên bỏ học, CVHT kiệt sức, Trường thất thu.
4. **Why now?** Dữ liệu nhà trường đang ngủ quên. Chúng ta cần đánh thức nó.
5. **Solution:** EduGuard = Data Analytics + NLP + Risk Engine.
6. **Descriptive vs Predictive:** Khác biệt giữa LMS cũ (nhìn quá khứ) và EduGuard (nhìn tương lai).
7. **System Architecture:** Sơ đồ Modular Monolith (Để lấy điểm kỹ thuật).
8. **AI Pipeline:** `Input -> NLP Router -> Rule-based Engine -> XAI Output`.
9. **Dashboard Showcase:** Hình ảnh Heatmap & Timeline.
10. **NLP Chatbot Showcase:** Giao diện chat thông minh.
11. **Explainable AI (XAI):** Minh bạch hóa mọi quyết định rủi ro.
12. **Database & Optimization:** SQLite, Prisma, Virtualized Rendering.
13. **Business Model:** B2B SaaS. Giữ 10 SV = Thu hồi vốn hệ thống.
14. **Limitations:** Mock Data, Rule-based Engine (Trung thực ghi điểm tuyệt đối).
15. **Future Roadmap:** LSTM Deep Learning, Real-time Attendance.
16. **Demo Time:** (Chuyển sang màn hình Demo).
17. **Q&A:** Sẵn sàng đón nhận phản biện.

---

## PHẦN 10 — DEMO FLOW CỰC MƯỢT (5 PHÚT)

- **0:00 - 0:30 (Mở màn):** Mở màn hình Login. Vào thẳng Dashboard.
- **0:30 - 1:30 (WOW 1 - Heatmap):** "Thầy cô nhìn vào đây, nguyên một lớp học màu Xanh, nhưng có 5 chấm Đỏ. Không cần lật Excel, 5 sinh viên nguy kịch nhất đã hiện ra."
- **1:30 - 3:00 (WOW 2 - Timeline & XAI):** Click vào 1 sinh viên rủi ro. "Hãy nhìn độ dốc của Timeline. Bạn này đang trượt dài. Vì sao? AI giải thích: Rớt môn C++ làm đứt gãy môn Java."
- **3:00 - 4:30 (WOW 3 - Chatbot):** Mở ô Chat. Gõ: *Đề xuất lộ trình cho sinh viên này*. Chờ chữ nhảy ra. Nhấn nút "Gửi vào Hộp thư sinh viên" (Giả lập).
- **4:30 - 5:00 (Chốt):** "EduGuard đã giảm 80% thời gian tra cứu thủ công cho CVHT."

---

## PHẦN 11 — QUAY VIDEO DEMO

- **Phần mềm:** OBS Studio. (Mic thu âm to, rõ, không ồn).
- **Độ phân giải:** 1080p.
- **Nhạc nền:** Nhẹ nhàng (Lo-fi/Corporate Chill), bật rất nhỏ 5-10% volume.
- **Voice tone:** Trầm ấm, dứt khoát, chuyên nghiệp (như Apple trình bày sản phẩm). Không đọc slide, kể câu chuyện.
- **Chuyển cảnh:** Zoom nhẹ (Zoom in) vào phần Heatmap và phần Chatbot đang gõ chữ để thu hút ánh nhìn.

---

## PHẦN 12 — Q&A HỘI ĐỒNG TỬ THẦN (ĐỂ PHÒNG THỦ)

### Nhóm AI & ML
**1. Câu hỏi:** Hệ thống của em dùng Deep Learning chưa?
**Trả lời:** Dạ chưa ạ. Vì dự án dùng Mock Data, việc train Deep Learning trên dữ liệu giả là Over-engineering vô nghĩa. Em dùng Rule-based Engine kết hợp NLP để giải quyết triệt để tính năng, phù hợp với giai đoạn Enterprise Prototype.
**2. Câu hỏi:** Lỡ hệ thống tính điểm rủi ro sai thì sao?
**Trả lời:** Dạ EduGuard là Decision Support System (DSS). Hệ thống chỉ "giương cờ cảnh báo" (Flagging). Quyết định can thiệp cuối cùng thuộc về sự thấu cảm của Cố vấn học tập.

### Nhóm Database & Scalability
**3. Câu hỏi:** Tại sao dùng SQLite? Chạy cho 10,000 sinh viên nổi không?
**Trả lời:** Dạ SQLite dùng cho Prototype để Giám khảo chấm thi mở lên chạy được ngay (Zero-config). Kiến trúc em dùng Prisma ORM, lên Production chỉ đổi 1 file config là tự động connect sang PostgreSQL chạy cho 100,000 sinh viên bình thường ạ.
**4. Câu hỏi:** Danh sách sinh viên dài 5000 người load trên web có bị giật không?
**Trả lời:** Dạ không ạ. Em dùng Virtualized Rendering (`react-window`), trang web chỉ render đúng 20 sinh viên nằm trong màn hình. FPS luôn đảm bảo 60 khung hình/giây.

### Nhóm Business
**5. Câu hỏi:** LMS của trường cũng làm được vậy, khác gì?
**Trả lời:** LMS chỉ có Descriptive Analytics (SV rớt thì báo rớt). EduGuard có Predictive Analytics (SV sắp rớt thì cảnh báo ngay từ tuần 3).
**6. Câu hỏi:** Ai sẽ trả tiền cho hệ thống này?
**Trả lời:** Dạ Nhà trường ạ (B2B). Nếu hệ thống giúp giữ chân được 1% lượng sinh viên bỏ học vì nợ môn chán nản, doanh thu trường giữ lại được dư sức chi trả phí phần mềm.

---

## PHẦN 13 — ĐÁNH GIÁ TỪ GIÁM KHẢO (ĐỂ BẠN TỰ TIN)

- **Điểm mạnh vô đối:** CÂU CHUYỆN (Storytelling) cực kỳ có thật. UI/UX quá xịn. Kiến trúc phần mềm rành mạch, rõ ràng.
- **Điểm yếu dễ bị xoáy:** Chữ "AI". Nhiều giám khảo cực đoan sẽ bảo "Chỉ IF-ELSE mà gọi là AI à?".
- **Cách phòng thủ:** Ngay từ Slide giới thiệu, hãy tự nhận trước: *"Dạ hệ thống của em cốt lõi là DSS (Hỗ trợ ra quyết định) kết hợp Data Analytics. Phần AI em áp dụng ở NLP Chatbot. Tương lai có Big Data em mới làm Machine Learning ạ."* (Giám khảo nghe câu này sẽ gật gù khen bạn quá am hiểu hệ thống, không bị 'ngáo AI').

---

## PHẦN 14 — CHECKLIST DEADLINE (CẤM LÀM THÊM CODE)

- [x] STOP CODING. KHÔNG đẻ thêm feature, không thêm DB, không thêm auth thật. Bug giờ này là đền mạng.
- [ ] Render Video Demo 5 phút. Upload YouTube (Unlisted).
- [ ] Soạn Slide 20 trang. Export ra PDF (Phòng hờ máy chiếu lỗi font).
- [ ] Chụp 10 tấm Screenshot thật đẹp.
- [ ] Đẩy code lên GitHub lần cuối cùng.
- [ ] Dùng lệnh `npm run boot` thử trên 1 máy tính khác xem có chạy mượt không.
- [ ] Nén toàn bộ project (Xóa `node_modules`) sang ZIP, lưu Google Drive, copy USB. Bị hư laptop vẫn có đường sống.

---

## PHẦN 15 — LỜI KHUYÊN TÂM LÝ KHI BẢO VỆ

1. **Giữ bình tĩnh khi bị chê:** Hội đồng chê là để xem bản lĩnh của bạn. Cứ cười tươi: *"Dạ em cảm ơn Thầy/Cô đã góp ý, đây đúng là điểm hạn chế của giai đoạn Prototype. Em sẽ đưa nó vào Roadmap phát triển giai đoạn Production ạ."*
2. **Không Overclaim AI:** Nếu bị ép "Em có tự code thuật toán AI không?", hãy trả lời trung thực: *"Dạ phần NLP em tích hợp thư viện và huấn luyện Intent/Entity, phần Scoring em tự viết thuật toán Rule-based. Em không xài Deep Learning vì dữ liệu hiện tại là Mock Data."* Trung thực là vũ khí tối thượng của một Kỹ sư phần mềm xuất sắc.
3. **Mỉm cười tự hào:** Bạn đã code ra một hệ thống chạy mượt, giao diện lộng lẫy, có tính nhân văn cực cao. Hệ thống này đè bẹp rất nhiều đồ án làm CRUD (Thêm sửa xóa) thông thường. Hãy lên sân khấu như một CEO trình bày sản phẩm khởi nghiệp!

**CHÚC BẠN CHIẾN THẮNG RỰC RỠ VÀ BẢO VỆ THÀNH CÔNG ĐỒ ÁN! 🏆🚀**
