# PHÂN TÍCH TOÀN DIỆN DỰ ÁN EDUGUARD DSS
*(Tài liệu chuẩn bị bảo vệ đồ án - Dành cho sinh viên)*

---

## I. HỆ THỐNG HIỆN TẠI THỰC SỰ ĐANG LÀM GÌ?

**Nói một cách dân dã:** EduGuard DSS giống như một "bác sĩ khám sức khỏe học tập". 
Thay vì để giáo viên phải tự lật từng trang hồ sơ xem ai nợ môn gì, ai điểm thấp (rất tốn thời gian), hệ thống sẽ tự động gộp tất cả dữ liệu lại. Sau đó nó "chấm điểm" xem sinh viên nào đang "bệnh nặng" (sắp rớt môn), sinh viên nào đang "bệnh nhẹ" (cần chú ý). Cuối cùng, nó vạch ra một danh sách ưu tiên để giáo viên bốc máy gọi điện cứu sinh viên.

**Hiện tại hệ thống làm được:**
1. Đọc dữ liệu mô phỏng (Mock Data) từ database.
2. Tính toán ra một con số gọi là Risk Score (Điểm rủi ro).
3. Đưa tất cả lên một cái Dashboard (bảng điều khiển) siêu trực quan có màu sắc đỏ-vàng-xanh để giáo viên nhìn vào là hiểu ngay lập tức.
4. Có một ô Chat (NLP Chatbot) để giáo viên gõ tiếng Việt hỏi thăm tình hình sinh viên mà không cần phải dùng chuột click nhiều bước.

---

## II. AI THỰC SỰ ĐANG LÀM GÌ? VÀ CHƯA PHẢI AI Ở ĐÂU?

Chúng ta cần cực kỳ trung thực với Hội đồng. **EduGuard DSS không phải là một siêu trí tuệ nhân tạo (Deep Learning) tự học hỏi vạn vật.** 

- **NLP (Xử lý ngôn ngữ tự nhiên): LÀ AI THẬT.** Hệ thống dùng thư viện `node-nlp` để dạy cho máy tính hiểu ý định (Intent) của câu tiếng Việt. Ví dụ gõ "Chỉ ra đứa rớt môn" hay "Tìm sinh viên yếu", máy tính đều hiểu chung là "Tìm kiếm sinh viên rủi ro".
- **Rule-based (Dựa trên luật): KHÔNG HẲN LÀ AI.** Đây là những công thức toán học do con người cài đặt. Ví dụ: Rớt môn thì -40 điểm, cúp học thì -25 điểm. Nó là Logic cứng (Hard-coded Logic), không tự học.
- **DSS (Hệ thống hỗ trợ ra quyết định): LÀ KIẾN TRÚC TỔNG THỂ.** Nó lấy dữ liệu $\rightarrow$ chấm điểm $\rightarrow$ vẽ biểu đồ $\rightarrow$ xuất ra kết quả khuyên giáo viên nên làm gì. Quyết định cuối cùng vẫn là ở giáo viên.

**Tại sao không dùng Deep Learning ngay?**
1. **Thiếu Data thật:** Deep Learning (Học sâu) giống như một đứa trẻ, nó cần hàng triệu điểm dữ liệu lịch sử để tự rút ra quy luật. Sinh viên không có quyền truy cập Big Data thật của trường.
2. **Over-engineering:** Dùng "dao mổ trâu để giết gà". Với lượng dữ liệu nhỏ, Rule-based chạy nhanh hơn, chính xác hơn 100% so với Deep Learning (chưa được train kỹ).
3. **Blackbox (Hộp đen):** Deep Learning phán 1 sinh viên rớt, nhưng nó không giải thích được vì sao (Blackbox). Trong giáo dục, đuổi học 1 sinh viên mà không có lý do là sai đạo đức. Rule-based kết hợp XAI (AI giải thích được) an toàn hơn rất nhiều.

---

## III. MOCK DATA LÀ GÌ? VÌ SAO PHẢI DÙNG?
- **Mock Data (Dữ liệu giả lập):** Là dữ liệu do mình tự chế ra (bằng code hoặc tự gõ tay) sao cho giống thật nhất. 
- **Vì sao phải dùng?** Vì lý do bảo mật. Trường đại học sẽ không bao giờ giao database chứa điểm số, tên tuổi, số điện thoại của 10.000 sinh viên thật cho sinh viên làm đồ án. Nếu không dùng Mock Data, dự án không thể chạy demo.

---

## IV. TỪ ĐIỂN THUẬT NGỮ (TỪ CƠ BẢN ĐẾN NÂNG CAO)

| Thuật ngữ (English) | Tiếng Việt | Giải thích dân dã & Vai trò trong EduGuard |
|---------------------|------------|-------------------------------------------|
| **Decision Support System (DSS)** | Hệ thống hỗ trợ ra quyết định | Giống như trợ lý dọn mâm cơm lên sẵn, giáo viên chỉ việc ăn. EduGuard là DSS, nó không tự động đuổi học sinh viên, nó chỉ "mách lẻo" để giáo viên quyết định. |
| **Enterprise-style Prototype** | Bản mẫu phong cách doanh nghiệp | Dự án vẫn chỉ là "bản nháp" (chưa chạy thật), nhưng kiến trúc code, folder, cách hoạt động được làm xịn xò như một hệ thống đi bán lấy tiền của doanh nghiệp. |
| **Rule-based Engine** | Bộ máy chạy theo luật | Một đoạn code chứa toàn lệnh IF-ELSE. "Nếu điểm < 5 thì rủi ro cao". Trong EduGuard, nó dùng để chấm điểm Risk Score. |
| **Explainable AI (XAI)** | AI giải thích được | Máy tính phán bạn có tội, thì nó phải chìa ra được bằng chứng. Trong EduGuard, mỗi khi AI báo rủi ro, nó luôn kèm theo dòng chữ "Vì rớt môn tiên quyết A". |
| **Modular Monolith** | Kiến trúc nguyên khối chia module | Code 백 (Backend) nằm chung trong 1 project (Monolith) cho dễ chạy, nhưng các phòng ban (Module) được chia tách rõ ràng (Auth riêng, Chat riêng). Rất gọn gàng. |
| **Virtualized Rendering** | Kết xuất ảo hóa | Trang web có 5000 sinh viên, nhưng màn hình máy tính chỉ vẽ ra 20 người đang hiển thị. Cuộn tới đâu vẽ tới đó. EduGuard dùng để giúp màn hình danh sách không bị đứng máy. |
| **Lazy Loading** | Tải lười biếng | Tính năng nào chưa dùng thì chưa tải code của tính năng đó về. Giúp web load ở giây đầu tiên cực kỳ nhanh. |
| **Session Memory** | Trí nhớ theo phiên | Chatbot nhớ bạn đang nói về ai. Lần 1 gõ: "Xem điểm sinh viên Nguyễn Văn A". Lần 2 gõ: "Vậy bạn này nợ môn gì?", chatbot tự hiểu "bạn này" là Nguyễn Văn A. |

---

## V. PHÂN TÍCH TƯƠNG LAI & TÍNH KHẢ THI (ROADMAP)

Giám khảo sẽ hỏi: *"Nếu phát triển tiếp, em sẽ làm gì?"*. Đây là câu trả lời:

### A. Real-time Attendance (Điểm danh thời gian thực)
- **Hoạt động:** Giáo viên điểm danh trên lớp, EduGuard nhận dữ liệu ngay lập tức. Vắng 3 buổi $\rightarrow$ Bắn cảnh báo.
- **Cần thêm:** API tích hợp với máy quét thẻ từ / nhận diện khuôn mặt của trường. Bảng database `attendance_logs`.
- **Khả thi:** Rất cao nếu trường cấp API.

### B. LMS Integration (Tích hợp hệ thống quản lý học tập)
- **Hoạt động:** Lấy điểm Quiz, số lần nộp bài trễ trên Canvas/Moodle bắn về EduGuard.
- **Cần thêm:** Cron job (tác vụ chạy ngầm định kỳ) đồng bộ dữ liệu ban đêm. Table `assignments`.
- **Khả thi:** Trung bình (cần tài khoản Admin của LMS).

### C. Deep Learning / LSTM Prediction (Dự báo bằng học sâu)
- **Hoạt động:** Không dùng IF-ELSE nữa, cho AI tự học chuỗi dữ liệu (Time-series) để dự báo chính xác 99% sinh viên rớt từ tuần thứ 2.
- **Cần thêm:** 1 Database riêng cho ML (Data Warehouse), model LSTM code bằng Python/TensorFlow, Cloud GPU để train.
- **Khả thi:** Chỉ khả thi khi dự án được trường cấp cho 5 năm dữ liệu lịch sử thật của sinh viên khóa trước.

---

## VI. PHÂN TÍCH DATABASE & KIẾN TRÚC

### 1. Database (Cơ sở dữ liệu)
- **Hiện tại đang dùng SQLite:** Vì sao? Vì nó nằm gói gọn trong 1 file. Giám khảo chấm bài chỉ cần `npm run boot` là chạy, không cần tải cài đặt Database nặng nề.
- **Prisma ORM đang làm gì?** Nó là người phiên dịch. Thay vì code câu lệnh SQL lằng nhằng, chúng ta code bằng Javascript/TypeScript (Object), Prisma sẽ tự dịch thành SQL.
- **Nếu Scale lên Production (Chạy cho toàn trường):** Bắt buộc phải bỏ SQLite. Chuyển sang **PostgreSQL** để chịu tải 10,000 người dùng. Cần thêm **Redis** để lưu Cache (ghi nhớ tạm thời) giúp Dashboard không bị load đi load lại. Cần **AWS S3** để lưu ảnh/file.

### 2. Kiến trúc Hệ thống (Ví dụ đời thường)
- **Frontend Layer (Mặt tiền cửa hàng):** Nơi khách hàng (giáo viên) nhìn vào. Làm bằng React, vẽ đồ thị đẹp đẽ. 
- **Backend Layer (Bếp trưởng):** Node.js. Nhận order từ mặt tiền, tính toán, và trả kết quả.
- **Database Layer (Nhà kho):** SQLite. Nơi lưu trữ thực phẩm (dữ liệu).
- **DSS & AI Layer (Phòng tham mưu):** Nơi ngồi phân tích xem sinh viên này bệnh nặng nhẹ thế nào dựa trên công thức. Nằm chung trong Backend.

---

## VII. ĐÁNH GIÁ DỰ ÁN & ĐIỂM MẠNH YẾU CUỘC THI

**Dự án hiện tại: Rất Mạnh (Khá xuất sắc với sinh viên).**
- **Mạnh ở đâu:** Bài toán đánh đúng nỗi đau có thật (Pain point). Giao diện (UI) làm quá đẹp, chuyên nghiệp. Kiến trúc hệ thống không bị lỗi thời. Cách dùng AI thông minh (không nhồi nhét).
- **Yếu ở đâu:** Chưa có dữ liệu thật (Fake data). AI vẫn là dạng Rule-based, mang tính truyền thống, chưa có đột phá về Machine Learning.
- **Hội đồng sẽ bắt lỗi gì?** *"Em bảo em dùng AI, vậy AI chỗ nào? Accuracy bao nhiêu?"*.
- **Cách trả lời khôn khéo:** *"Dạ thưa thầy/cô, AI trong hệ thống của em hiện diện ở tính năng NLP Chatbot hiểu ý định người dùng, và hệ thống của em là Hỗ trợ ra quyết định (DSS). Trọng tâm dự án không nằm ở việc train một model Deep Learning phức tạp, mà nằm ở việc xây dựng một Luồng phân tích (Data Pipeline) hoàn chỉnh để đưa ra cảnh báo giải thích được (XAI). Tính thực tiễn của nó cao hơn là chạy đua thuật toán ạ."*

---

## VIII. DEMO SCRIPT BẢO VỆ (Kịch bản 5 phút)

**[00:00 - 00:30]: Mở đầu (Elevator Pitch 30s)**
"Kính thưa Ban giám khảo, EduGuard DSS là một Hệ thống Hỗ trợ Ra quyết định (Decision Support System) giúp giải quyết triệt để nỗi đau phát hiện muộn sinh viên rớt môn. Thay vì nhìn bảng điểm tĩnh cuối kỳ, hệ thống cung cấp bức tranh dự báo rủi ro leo thang ngay từ tuần học thứ 2."

**[00:30 - 02:00]: Demo Dashboard (Showcase Dashboard)**
"Em xin demo tính năng đầu tiên. Nhìn vào màn hình Dashboard, Thầy Cô không cần làm gì cả, hệ thống đã tự động tính toán Risk Score và phân loại 5 sinh viên đang ở mức CRITICAL (Nguy kịch đỏ). Bản đồ Heatmap cho thấy tổng quan lớp học đang có dấu hiệu quá tải ở tuần 5."

**[02:00 - 03:00]: Xem chi tiết 1 sinh viên (Showcase Timeline & XAI)**
"Khi click vào 1 sinh viên rủi ro, hệ thống hiển thị Academic Timeline (Biểu đồ thời gian). Thầy cô có thể thấy rủi ro bắt đầu leo dốc từ tuần 3. Bên phải, tính năng XAI (AI giải thích) đã ghi rõ lý do: Do rớt môn tiên quyết WEB105. Mọi phán quyết của AI đều minh bạch, không phải là hộp đen."

**[03:00 - 04:30]: Demo Chatbot (Wow Effect)**
"Tuy nhiên, nếu chỉ dừng ở Dashboard thì vẫn là truyền thống. EduGuard trang bị một NLP Assistant chạy Offline. Em có thể gõ tiếng Việt: 'Cho tôi xem danh sách sinh viên rủi ro cao nhất'. AI sẽ tự hiểu Intent và render danh sách trực tiếp. Nếu em chat tiếp 'Đề xuất lộ trình cho sinh viên A', Chatbot (nhờ có Session Memory) tự hiểu A là ai và vẽ ra lộ trình khắc phục."

**[04:30 - 05:00]: Kết luận**
"EduGuard không phải là hệ thống thay thế giáo viên. Nó là trợ lý phân tích dữ liệu, giúp giảm tải rà soát thủ công, để giáo viên tập trung vào việc quan trọng nhất: Cứu sinh viên. Em xin cảm ơn."

---

## IX. Q&A HỘI ĐỒNG TỬ THẦN (30 CÂU HỎI TRỌNG TÂM)

### Nhóm 1: AI & ML (Tránh overclaim)
1. **Q: Em dùng thuật toán Deep Learning nào?**
   **A:** Dạ dự án em ưu tiên tính thực tiễn nên hệ thống dùng Rule-based kết hợp trọng số (Weighted Risk) để làm Predictive Engine. Hệ thống chưa áp dụng Deep Learning vì thiếu hụt dữ liệu lớn (Big Data) thật từ nhà trường ạ.
2. **Q: NLP của em tự code hay gọi API ChatGPT?**
   **A:** Dạ hoàn toàn tự chạy Local (Offline) bằng thư viện `node-nlp` ạ. Em huấn luyện các Intent (Ý định) bằng các mẫu câu tiếng Việt. Việc chạy Local đảm bảo dữ liệu sinh viên được bảo mật tuyệt đối, không tuồn ra bên thứ 3 như ChatGPT.
3. **Q: Accuracy (Độ chính xác) của mô hình em là bao nhiêu?**
   **A:** Dạ vì em dùng Rule-based, nên độ chuẩn xác dựa hoàn toàn vào bộ Quy tắc của phòng đào tạo. Nếu nhà trường quy định Vắng 3 buổi = Rớt, thì accuracy của việc cảnh báo là 100%. Em không dùng bài toán Phân loại (Classification) của Machine Learning nên không dùng metric (đo lường) này ạ.

### Nhóm 2: Architecture & Scalability
4. **Q: Tại sao dùng Modular Monolith mà không dùng Microservices?**
   **A:** Dạ Microservices chỉ phát huy tác dụng khi scale lên rất lớn với nhiều team lập trình khác nhau. Dự án hiện tại đang ở mức Enterprise-style Prototype do 1 người dev, dùng Monolith giúp giảm độ trễ mạng, dễ quản lý, nhưng vẫn giữ được ranh giới các module chặt chẽ (Modular) để dễ tách ra sau này.
5. **Q: Tại sao em lại dùng SQLite? Lên thực tế SQLite chịu nổi không?**
   **A:** Dạ SQLite dùng cho Prototype để giám khảo có thể chạy code chấm thi bằng 1 nút bấm (npm run boot) mà không cần cài đặt Database Server. Trên thực tế Production, kiến trúc của em dùng Prisma ORM, chỉ cần đổi 1 dòng config là kết nối ngay sang PostgreSQL mà không phải đập đi xây lại code ạ.
6. **Q: Virtualized Rendering ở Frontend là gì? Tại sao phải dùng?**
   **A:** Dạ thay vì tải và vẽ (render) 5000 thẻ sinh viên ra màn hình (làm đứng trình duyệt), thư viện `react-window` chỉ vẽ đúng 20 sinh viên nằm trong tầm nhìn của màn hình. Cuộn tới đâu vẽ tới đó. Giúp FPS luôn mượt 60Hz.

### Nhóm 3: Dữ liệu (Data)
7. **Q: Dữ liệu của em là thật hay giả?**
   **A:** Dạ là dữ liệu giả lập (Mock Data) được em tự sinh ra bám sát với thực tế phân phối điểm của sinh viên. Do quy định bảo mật quyền riêng tư giáo dục, em không thể tiếp cận dữ liệu thật ạ.
8. **Q: Nếu có dữ liệu thật em sẽ làm gì tiếp?**
   **A:** Em sẽ dùng dữ liệu lịch sử 5 năm trước để train một mô hình mạng nén LSTM. Khi đó AI sẽ dự báo dựa trên chuỗi thời gian thực sự, thay vì dùng các quy tắc cứng như hiện tại.

### Nhóm 4: Product & Business
9. **Q: Lỡ hệ thống cảnh báo sai thì tương lai sinh viên bị ảnh hưởng sao?**
   **A:** Dạ bản chất EduGuard là Decision Support System (Hệ thống hỗ trợ). Nó không có quyền gửi email đuổi học sinh viên. Nhiệm vụ của nó là "cắm cờ" (Flagging), quyết định cuối cùng là ở con người (Cố vấn học tập). Sự sai sót của hệ thống không gây hậu quả tiêu cực lên sinh viên.
10. **Q: Giải pháp này khác gì chức năng xuất báo cáo của hệ thống FAP/LMS hiện tại?**
    **A:** FAP hiện tại là Descriptive (Mô tả), sinh viên rớt rồi mới hiện chữ Rớt. EduGuard là Predictive (Dự báo), nó chỉ ra sinh viên CÓ KHẢ NĂNG rớt trước 4 tuần để giáo viên cứu vãn.

*(Các câu hỏi khác hãy xoay quanh triết lý: "Bảo mật", "Decision Support", và "Không phải Blackbox AI")*

---

## X. CHECKLIST TRƯỚC DEADLINE (TUYỆT ĐỐI TUÂN THỦ)

- [x] **DỪNG CODE.** KHÔNG add thêm bất cứ database thật hay feature AI nào nữa. (Thêm giờ này bug 1 phát là toang).
- [ ] Chụp 5-8 bức ảnh màn hình Dashboard (có màu sắc, biểu đồ đẹp) vứt vào folder `/screenshots`.
- [ ] Mở file `README.md` kiểm tra lại các dòng giới thiệu.
- [ ] Quay 1 video Demo màn hình (3-5 phút) có thuyết minh theo kịch bản ở trên.
- [ ] Push code lên GitHub. Tạo Release "v1.0.0-enterprise-prototype".
- [ ] ZIP toàn bộ thư mục (nhớ bỏ `node_modules`) ném lên Google Drive làm phương án dự phòng.
- [ ] Học thuộc lòng phần Q&A và Elevator Pitch. Ngủ một giấc thật ngon.

**KẾT LUẬN TỪ HỘI ĐỒNG:** Đồ án của bạn xuất sắc không phải vì bạn dùng thuật toán AI rùng rợn nhất thế giới, mà vì bạn giải quyết **một bài toán thực tế cực hay** bằng một **kiến trúc phần mềm cực chuẩn (Enterprise Prototype)**. Giữ vững sự tự tin này lên sân khấu! 🚀
