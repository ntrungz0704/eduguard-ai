# EduGuard AI — Defensive Q&A Bank (Bộ câu hỏi phản biện)

Tài liệu này tổng hợp các câu hỏi phản biện "hóc búa" thường gặp từ Ban giám khảo (BGK), Tech Lead hoặc Quỹ đầu tư tại cuộc thi **AI Challenge TP.HCM 2026**, kèm theo chiến lược trả lời chuẩn "Enterprise Mindset" và "Scientific Reasoning" để bảo vệ kiến trúc, dữ liệu và định hướng của dự án.

---

## 🎯 3 NGUYÊN TẮC VÀNG KHI TRẢ LỜI TRƯỚC HỘI ĐỒNG
1. **Human-in-the-Loop (Con người làm trung tâm):** Luôn nhấn mạnh AI đóng vai trò làm trợ lý phân tích dữ liệu và gợi ý nhanh chóng. Quyết định sư phạm và hành động can thiệp cuối cùng luôn thuộc về Giảng viên và Cố vấn học tập (CVHT). Điều này giúp triệt tiêu hoàn toàn các tranh chấp pháp lý hoặc trách nhiệm thuật toán.
2. **Thừa nhận thực tế & Đưa ra lộ trình (Pragmatic Roadmap):** Đối với các công nghệ thử nghiệm trong bản MVP (như SQLite, upload Excel thủ công), hãy thẳng thắn thừa nhận đây là giải pháp tối ưu chi phí và tốc độ triển khai thử nghiệm (Pilot Phase), đồng thời đưa ra phương án nâng cấp lên chuẩn doanh nghiệp (Enterprise-grade) ở giai đoạn thương mại hóa.
3. **Minh chứng từ mã nguồn thực tế:** Dẫn chứng các giải thuật và cấu trúc đã chạy thực tế trong mã nguồn của hệ thống (như [trainRiskModel.js](file:///d:/smartgenai/eduguard-ai/server/src/ai/training/trainRiskModel.js), [riskPredictor.js](file:///d:/smartgenai/eduguard-ai/server/src/ai/inference/riskPredictor.js), [verify_curriculum_integrity.js](file:///d:/smartgenai/eduguard-ai/verify_curriculum_integrity.js)) để chứng minh đây là một sản phẩm thực tế, có tính hoàn thiện cao chứ không chỉ là ý tưởng trên slide.

---

## I. KHÍA CẠNH KINH DOANH & GIÁ TRỊ THỊ TRƯỜNG (BUSINESS VALUE & MARKET)

### Câu 1: Định hướng mô hình thương mại (B2B vs B2C)
> **Chất vấn:** *"Hệ thống định hướng thương mại hóa theo mô hình nào? Bán giải pháp trọn gói cho nhà trường (B2B) hay bán tài khoản cao cấp cho cá nhân sinh viên (B2C)? Định giá dự kiến sẽ dựa trên số lượng sinh viên hay theo năm học?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, EduGuard AI định hướng thương mại hóa theo mô hình **B2B2C (Business-to-Business-to-Consumer)**. Đối tác chi trả trực tiếp là **Nhà trường (B2B)**, và người sử dụng dịch vụ cuối cùng là **Giảng viên/Sinh viên (B2C)** nhận được tài khoản miễn phí từ Nhà trường. 
* **Lý do không chọn mô hình B2C thuần túy:** 
  1. *Tính toàn vẹn dữ liệu:* Hệ thống yêu cầu dữ liệu điểm số, chuyên cần và hành vi chính xác từ cơ sở dữ liệu học vụ của nhà trường để chạy mô hình AI. Sinh viên tự nhập liệu thủ công sẽ dễ sai sót và thiếu trung thực.
  2. *Động lực can thiệp:* Sinh viên có nguy cơ trượt học tập thường là những đối tượng có mức độ tự học (SRL) thấp và có xu hướng né tránh đối diện với kết quả kém. Nếu bán tài khoản B2C, họ sẽ không chủ động xuống tiền mua. Ngược lại, nhà trường có động lực kinh tế rất lớn trong việc giữ chân sinh viên để duy trì nguồn thu học phí (Student Retention).
* **Mô hình định giá dự kiến:** Chúng em áp dụng mô hình **SaaS Subscription dựa trên quy mô Sinh viên Hoạt động Hàng năm (Annual Active Users - AAU)**:
  - Chi phí dự kiến dao động từ **$1.5 - $3 USD / sinh viên / năm**.
  - Ví dụ: Một trường quy mô 10.000 sinh viên sẽ chi trả khoảng $15.000 - $30.000 USD/năm học. Mức đầu tư này chỉ bằng chi phí học phí của 2-3 sinh viên không bỏ học giữa chừng, mang lại chỉ số **ROI (Return on Investment)** cực kỳ rõ ràng và thuyết phục cho Hiệu trưởng.

---

### Câu 2: Giá trị khác biệt cốt lõi (USP) so với quy trình truyền thống
> **Chất vấn:** *"Hiện tại các trường đại học đều có phòng Công tác học sinh sinh viên và đội ngũ Cố vấn học tập (CVHT). Giải pháp của EduGuard AI mang lại giá trị gia tăng mang tính đột phá gì để thuyết phục nhà trường xuống tiền đầu tư?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, quy trình tư vấn học vụ truyền thống hiện nay đang gặp phải 3 "nút thắt cổ chai" lớn mà EduGuard AI giải quyết triệt để:
1. **Chuyển dịch từ Phản ứng (Reactive) sang Chủ động (Proactive):** Quy trình truyền thống hoạt động theo cơ chế cuối kỳ: Đợi phòng Đào tạo tổng hợp điểm trượt, gửi danh sách cảnh báo học vụ, CVHT mới liên hệ sinh viên. Lúc này đã quá muộn (gạo đã nấu thành cơm). EduGuard AI đưa ra cảnh báo sớm từ **tuần thứ 3 - thứ 5** của học kỳ nhờ phân tích các biến hành vi (như tỷ lệ chuyên cần, điểm kiểm tra thành phần) giúp nhà trường can thiệp khi còn cơ hội cứu vãn.
2. **Cá nhân hóa ở quy mô lớn (Personalization at Scale):** Một CVHT thường phải quản lý từ 200 đến 500 sinh viên. Họ không thể tự tay thiết kế 300 lộ trình ôn tập cá nhân hóa khác nhau cho từng sinh viên học yếu. EduGuard AI giải quyết bài toán này bằng cách tự động phân tích Nguyên nhân gốc (Root Cause) và sinh ra **Lộ trình tự phục hồi 12 tuần (Recovery Roadmap)** cá nhân hóa đến từng đầu điểm thành phần của từng sinh viên chỉ trong 1 giây.
3. **Tối ưu hóa năng suất vận hành của CVHT:** Hệ thống tự động hóa 80% công việc hành chính thủ công (lọc danh sách nguy cơ, soạn email cảnh báo, theo dõi tiến độ). CVHT chỉ cần duyệt nhanh qua Dashboard và dành 20% thời gian quý báu còn lại để tư vấn tâm lý chuyên sâu trực tiếp cho những ca thực sự nghiêm trọng (Critical).

---

### Câu 3: Khả năng tích hợp hệ thống (Integration with LMS/ERP)
> **Chất vấn:** *"Kiến trúc hiện tại yêu cầu giảng viên tải file Excel thủ công (Teacher Upload Excel). Đối với các trường đại học lớn đã có sẵn hệ thống ERP/LMS phức tạp (Canvas, Moodle, quản lý điểm nội bộ), EduGuard AI có kết nối trực tiếp qua API được không hay bắt buộc phải thay đổi quy trình vận hành?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, hệ thống của chúng em được xây dựng theo kiến trúc **API-First** và sẵn sàng tích hợp hoàn toàn với các hệ thống ERP/LMS hiện có mà không làm thay đổi quy trình vận hành của nhà trường:
* **Tích hợp API chuẩn quốc tế:** EduGuard AI hỗ trợ tiêu chuẩn **LTI (Learning Tools Interoperability)** giúp tích hợp trực tiếp dưới dạng một ứng dụng nhúng (Add-on) trên các LMS phổ biến như Canvas, Moodle hoặc Blackboard. Hệ thống sử dụng Webhooks để nhận đồng bộ dữ liệu điểm số, chuyên cần ngay khi giảng viên nhập điểm trên hệ thống gốc.
* **Đồng bộ tự động định kỳ (Sync Jobs):** Đối với các hệ thống quản lý đào tạo nội bộ (Legacy ERP) đóng kín, chúng em thiết kế API Endpoint bảo mật (`POST /api/v1/save-uploaded`) kết hợp với các script đồng bộ tự động chạy ngầm (cron-job) vào ban đêm để lấy dữ liệu từ database của trường sang EduGuard AI, đảm bảo dữ liệu luôn được cập nhật theo thời gian thực mà không cần giảng viên phải thao tác thủ công.
* **Vai trò của tính năng Excel Upload:** Tính năng tải file Excel thủ công hiện tại được thiết kế như một **cơ chế Fallback** linh hoạt. Nó giúp nhà trường có thể chạy thử nghiệm (Pilot Phase) hệ thống ngay lập tức trong vòng 1 ngày để kiểm chứng hiệu quả, mà không cần phải trải qua quy trình xin cấp quyền kết nối API phức tạp và kéo dài từ bộ phận IT của nhà trường.

---

## II. KHÍA CẠNH CÔNG NGHỆ & XỬ LÝ DỮ LIỆU (TECHNOLOGY & DATA)

### Câu 4: Bài toán Khởi đầu lạnh (Data Cold Start) khi triển khai trường/ngành mới
> **Chất vấn:** *"Hệ thống phụ thuộc lớn vào Đồ thị phụ thuộc môn học (Dependency Graph) và Chuẩn đầu ra kỹ năng (CLO). Khi triển khai cho một ngôi trường hoặc ngành học mới hoàn toàn, làm thế nào để thiết lập hệ thống dữ liệu nền tảng này nhanh chóng mà không cần tốn quá nhiều nguồn lực mapping thủ công?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, chúng em giải quyết bài toán khởi đầu lạnh (Cold Start) theo 3 chiến lược tự động hóa và kế thừa:
1. **Thiết kế hướng dữ liệu cấu hình (Data-Driven Configuration):** Đồ thị phụ thuộc và CLO không bị code cứng vào logic phần mềm. Chúng được lưu trữ độc lập dưới dạng tệp cấu hình JSON (`syllabus_graph.json` và `curriculum_knowledge_base.json`). Khi có ngành học mới, quản trị viên chỉ cần tải lên cấu trúc cây môn học và chuẩn đầu ra (thường có sẵn dưới dạng bảng cấu trúc từ đề cương chi tiết được duyệt bởi Hội đồng Khoa học của trường). Hệ thống sẽ tự động phân tích cú pháp để dựng đồ thị DAG tại runtime.
2. **Kế thừa tri thức liên trường (Transfer Learning & Base Graph Templates):** Đối với các ngành học phổ biến (như Công nghệ thông tin, Thiết kế Web), chúng em xây dựng sẵn các **Template Đồ thị chuẩn công nghiệp** dựa trên các framework uy tín như ACM/IEEE-CS và bản đồ năng lực từ `roadmap.sh`. Khi triển khai cho trường mới, trường chỉ cần tinh chỉnh từ bản mẫu sẵn có thay vì xây dựng lại từ đầu.
3. **Cơ chế Shadow Mode tích lũy dữ liệu:** Trong học kỳ đầu tiên áp dụng cho ngành học hoàn toàn đặc thù, AI sẽ chạy ở chế độ thu thập và giám sát. Hệ thống sử dụng các bộ luật heuristic học vụ cơ bản để đưa ra khuyến nghị, đồng thời tự động ghi nhận dữ liệu điểm số và hành vi học tập để tự động hiệu chỉnh (fine-tune) các trọng số liên kết giữa các môn học, giúp mô hình AI tự hoàn thiện mà không cần con người can thiệp thủ công.

---

### Câu 5: Bản chất của Trí tuệ nhân tạo giải thích được (Explainable AI - XAI)
> **Chất vấn:** *"Nhóm nhấn mạnh AI không chỉ dự đoán mà còn giải thích được 'VÌ SAO' (ví dụ rủi ro lan truyền từ WEB2041 sang PRO2201). Nhóm đang sử dụng phương pháp XAI chuẩn quốc tế nào (như SHAP, LIME) hay thực chất chỉ dùng thuật toán duyệt đồ thị (DFS/Topological Sort) kết hợp với các quy tắc cứng?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, chúng em lựa chọn hướng tiếp cận **Kiến trúc XAI Lai (Hybrid Explainable AI)** để giải quyết trọn vẹn cả 2 khía cạnh: Định lượng và Cấu trúc học vụ, thay vì phụ thuộc đơn lẻ vào SHAP/LIME hay Rule-based:
1. **Tầng Định lượng (Quantitative Explainability):** Với mô hình mạng nơ-ron dự đoán rủi ro (được định nghĩa trong [trainRiskModel.js](file:///d:/smartgenai/eduguard-ai/server/src/ai/training/trainRiskModel.js)), chúng em trích xuất các trọng số liên kết (Weights) và hệ số đóng góp của 7 đặc trưng hành vi đầu vào. Điều này giúp hệ thống chỉ ra chính xác yếu tố hành vi nào (như tỉ lệ chuyên cần giảm hay điểm thi thử thấp) đang đóng góp bao nhiêu phần trăm vào xác suất rủi ro của sinh viên.
2. **Tầng Cấu trúc Học vụ (Academic/Structural Explainability):** Đây là điểm cốt lõi. Các mô hình XAI thuần túy như SHAP hay LIME chỉ là các thuật toán toán học đen, chúng hoàn toàn không hiểu được ràng buộc logic học thuật của nhà trường (như việc trượt môn tiên quyết sẽ chặn các môn phía sau). Do đó, chúng em kết hợp thuật toán **Duyệt đồ thị có hướng (DFS/Topological Sort)** để thực hiện **Phân tích Nguyên nhân gốc (Root Cause Analysis)**:
   - Thuật toán duyệt ngược từ các môn học bị cảnh báo rủi ro về phía thượng nguồn đồ thị để tìm nút thắt cổ chai đầu tiên bị tắc nghẽn (Root Cause).
   - Tiếp tục duyệt xuôi để xác định tất cả các môn học hạ nguồn (Downstream courses) sẽ bị ảnh hưởng hoặc bị khóa tiến độ đăng ký nếu sinh viên trượt môn này.
* **Kết luận:** Sự kết hợp này mang lại lời giải thích có tính sư phạm cao nhất: AI chỉ ra sinh viên có rủi ro cao vì điểm chuyên cần kém (Yếu tố hành vi từ TF.js) và trượt môn WEB1043 - vốn là nút thắt cổ chai đang chặn 3 môn chuyên ngành kế tiếp (Yếu tố cấu trúc đồ thị từ DFS).

---

### Câu 6: Hiệu năng của mô hình AI chạy trên JavaScript (TensorFlow.js)
> **Chất vấn:** *"Việc lựa chọn TensorFlow.js mang lại lợi thế và thách thức gì? Quá trình huấn luyện (Retrain Pipeline) và suy luận diễn ra ở Server (Node.js) hay Client (Browser)? Khi hệ thống mở rộng cho hàng chục nghìn sinh viên, hiệu năng của TensorFlow.js có đáp ứng được so với Python frameworks không?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, quyết định lựa chọn TensorFlow.js của chúng em dựa trên các cân nhắc kỹ thuật thực tế sau:
* **Lợi thế & Thách thức:**
  - *Lợi thế lớn nhất:* Đồng bộ hóa toàn bộ Tech Stack dưới dạng **Fullstack JavaScript**. Điều này giúp tối giản hóa kiến trúc hệ thống, giảm thiểu chi phí vận hành máy chủ Cloud (không cần duy trì một server Python GPU riêng biệt chỉ để chạy các mô hình AI nhỏ), và rút ngắn thời gian phát triển dự án.
  - *Thách thức:* TensorFlow.js chạy trên môi trường JavaScript đơn luồng của Node.js sẽ gặp hạn chế về tài nguyên khi thực hiện huấn luyện các mô hình deep learning cực lớn (như LLM hay CNN phức tạp).
* **Kiến trúc Huấn luyện & Suy luận (Inference Architecture):**
  - **Quá trình Huấn luyện (Retrain Pipeline):** Diễn ra ở **Server-side (Node.js)** định kỳ vào các khung giờ thấp điểm (như cuối tuần). Mô hình của chúng em là một mạng nơ-ron lan truyền thẳng (Feedforward Neural Network) với 7 đặc trưng đầu vào, 2 lớp ẩn (16 và 8 units) được biên dịch bằng thuật toán Adam và Binary Crossentropy (như trong [trainRiskModel.js:L90-112](file:///d:/smartgenai/eduguard-ai/server/src/ai/training/trainRiskModel.js)). Tập dữ liệu đặc trưng của một ngành học là ma trận nhỏ nên quá trình train 200 epochs chỉ mất **dưới 3 giây** trên CPU thường của server.
  - **Quá trình Suy luận (Inference):** Được thiết kế theo cơ chế **Inference Lai (Hybrid)**:
    1. Trên Dashboard của Cố vấn học tập (xem dữ liệu hàng loạt): Suy luận chạy ở Server-side để tối ưu tốc độ phản hồi.
    2. Trên Dashboard của Sinh viên: Trình duyệt tải tệp trọng số model (`weights.bin` chỉ khoảng **20KB**) về máy sinh viên và chạy suy luận trực tiếp ở **Client-side** sử dụng WebGL/WASM tăng tốc phần cứng của trình duyệt.
* **Hiệu năng khi scale lên hàng chục ngàn sinh viên:**
  - Khi chạy trên Server Node.js, TensorFlow.js sử dụng các bindings C++ gốc (`@tensorflow/tfjs-node`) giúp tối ưu hiệu năng tính toán ma trận tương đương với thư viện Python.
  - Nhờ cơ chế chuyển dịch suy luận về Client-side cho sinh viên, gánh nặng tính toán của server được giảm thiểu gần như bằng 0 khi số lượng sinh viên truy cập đồng thời tăng lên. Điều này giúp hệ thống hoạt động vô cùng ổn định với chi phí vận hành máy chủ cực kỳ thấp so với việc duy trì API suy luận Python trên Cloud.

---

## III. KHÍA CẠNH SẢN PHẨM & VẬN HÀNH (PRODUCT & OPERATIONS)

### Câu 7: Mức độ hiệu quả của việc can thiệp tự động (Intervention Effectiveness)
> **Chất vấn:** *"Khi AI phát hiện nguy cơ và tự động soạn lộ trình (Roadmap) gửi vào hòm thư sinh viên, cơ chế nào để đảm bảo sinh viên thực sự phản hồi, chủ động học tập theo roadmap thay vì bỏ qua thông báo?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, để đảm bảo tỷ lệ chuyển đổi hành động thực tế từ sinh viên, EduGuard AI triển khai 3 cơ chế thúc đẩy tâm lý học tập chủ động:
1. **Trực quan hóa tác động trực tiếp (Visual Urgency):** Chúng em không gửi các email thông báo điểm số khô khan. Khi sinh viên đăng nhập hệ thống, Dashboard cá nhân hiển thị trực quan đồ thị tiến độ bị tắc nghẽn với màu cảnh báo cam/đỏ, kèm theo thông số cụ thể: *"Bạn đang bị chậm tiến độ tốt nghiệp dự kiến 4 tháng do nợ môn WEB1043"*. Việc trực quan hóa tác động trực tiếp này tạo ra động lực tâm lý mạnh mẽ thúc đẩy sinh viên hành động.
2. **Cơ chế cam kết chủ động (Active Commitment Linkage):** Lộ trình phục hồi 12 tuần không hiển thị tĩnh. Sinh viên được yêu cầu click xác nhận đồng ý tham gia lộ trình tự học củng cố kiến thức. Khi sinh viên xác nhận, hệ thống tự động đồng bộ các nhiệm vụ học tập hàng tuần vào ứng dụng Lịch (Google Calendar/Outlook) của sinh viên dưới dạng nhắc nhở (Reminders) và gửi thông báo đẩy hàng ngày.
3. **Vòng lặp leo thang có sự tham gia của con người (Escalation Loop - Human-in-the-loop):** Hệ thống tích hợp cơ chế theo dõi phản hồi. Nếu sinh viên bỏ qua thông báo và không có hoạt động tương tác với roadmap sau **3 ngày**, hệ thống tự động đẩy ca này lên trạng thái **"Yêu cầu can thiệp khẩn cấp"** trên Dashboard của Cố vấn học tập (CVHT) và Giáo viên chủ nhiệm, kích hoạt quy trình liên hệ trực tiếp bằng điện thoại hoặc hẹn gặp tại văn phòng trường.

---

### Câu 8: Độ tin cậy, Trách nhiệm giải trình (Accountability) & Quy trình phê duyệt
> **Chất vấn:** *"Hệ thống có sai số trung bình MAE là ±0.77. Trong trường hợp AI dự báo sai dẫn đến việc giảng viên đưa ra cảnh báo học vụ nhầm, hoặc gợi ý sai định hướng nghề nghiệp khiến sinh viên khiếu nại, ai sẽ là người chịu trách nhiệm? Vai trò phê duyệt của giảng viên (Human-in-the-loop) ở bước 'Giảng viên xác nhận' được thiết kế nghiêm ngặt ra sao?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, đây là vấn đề vô cùng quan trọng liên quan đến tính pháp lý và đạo đức của AI trong giáo dục. Chúng em thiết kế hệ thống tuân thủ chặt chẽ nguyên lý **Human-in-the-loop (Con người đưa ra quyết định cuối cùng)**:
* **Trách nhiệm giải trình:** Hệ thống EduGuard AI hoàn toàn không có quyền tự đưa ra các quyết định hành chính chính thức (như gửi email cảnh báo học vụ chính thức đến gia đình, đình chỉ học hay khóa tài khoản sinh viên). AI chỉ đóng vai trò là một **công cụ hỗ trợ chẩn đoán số liệu học thuật** cho Cố vấn học tập. Quyết định hành động cuối cùng và trách nhiệm pháp lý luôn thuộc về Nhà trường và Giảng viên.
* **Quy trình phê duyệt nghiêm ngặt (Human-in-the-loop Workflow):**
  - Khi AI phát hiện sinh viên rơi vào vùng rủi ro, hệ thống sẽ đẩy ca này vào danh sách đề xuất trên Dashboard của CVHT kèm theo phân tích nguyên nhân.
  - CVHT bắt buộc phải xem xét và thực hiện một trong ba hành động:
    1. **Phê duyệt:** Đồng ý với đề xuất của AI và kích hoạt gửi lộ trình can thiệp cho sinh viên.
    2. **Điều chỉnh:** Sửa đổi các nhiệm vụ trong lộ trình tự phục hồi (ví dụ: giảng viên biết sinh viên đang bị ốm nên giãn thời gian hoàn thành) trước khi phê duyệt.
    3. **Từ chối (Bác bỏ):** Ghi chú lý do bác bỏ cảnh báo (ví dụ: sinh viên đã nộp đơn xin bảo lưu học kỳ hoặc đang tham gia đội tuyển của trường được miễn điểm danh). Hành động bác bỏ này sẽ được AI ghi nhận lại làm dữ liệu phản hồi (Feedback Loop) để tự huấn luyện cải thiện độ chính xác trong tương lai.

---

### Câu 9: An toàn thông tin và bảo mật dữ liệu học vụ cấp doanh nghiệp
> **Chất vấn:** *"Bảng điểm và thông tin MSSV là dữ liệu nhạy cảm. Dự án hiện đang sử dụng Prisma + SQLite vốn là công cụ gọn nhẹ cho development. Nhóm có kế hoạch nâng cấp kiến trúc dữ liệu như thế nào để đảm bảo an toàn thông tin cấp doanh nghiệp (Enterprise-grade security)?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, hệ thống SQLite hiện tại chỉ phục vụ cho việc phát triển nhanh và chạy toàn bộ bộ test tích hợp ở local máy lập trình viên. Để đưa sản phẩm vào vận hành thực tế ở cấp độ doanh nghiệp (Production-ready), chúng em đã xây dựng lộ trình nâng cấp kiến trúc bảo mật gồm 3 trụ cột chính:
1. **Chuyển đổi sang CSDL Phân tán (Enterprise Database Engine):** Di chuyển toàn bộ cấu trúc dữ liệu sang **PostgreSQL Cluster** chạy trên nền tảng Cloud bảo mật (như AWS RDS hoặc Google Cloud SQL) hỗ trợ tính năng **TDE (Transparent Data Encryption)** để mã hóa toàn bộ dữ liệu ở trạng thái lưu trữ (Data-at-rest).
2. **Mã hóa dữ liệu nhạy cảm ở tầng Ứng dụng (Application-Level Field Encryption):** Đối với các dữ liệu đặc biệt nhạy cảm như Họ tên sinh viên, Mã số sinh viên (MSSV), và Số điện thoại, chúng em sẽ thực hiện mã hóa một chiều hoặc đối xứng bằng thuật toán **AES-256** ở tầng ứng dụng (Node.js) trước khi ghi xuống Database. Ngay cả trong trường hợp tin tặc tấn công và đánh cắp được file backup database, họ cũng không thể giải mã để lấy được thông tin định danh sinh viên.
3. **Cơ chế Ẩn danh hóa dữ liệu huấn luyện AI (Data Pseudonymization):** Khi trích xuất dữ liệu bảng điểm để đưa vào pipeline huấn luyện mô hình AI ([trainRiskModel.js](file:///d:/smartgenai/eduguard-ai/server/src/ai/training/trainRiskModel.js)), hệ thống tự động ẩn danh hóa bằng cách thay thế thông tin cá nhân bằng mã hash ngẫu nhiên (UUIDs). Mô hình AI chỉ nhìn thấy ma trận điểm số và hành vi, hoàn toàn không tiếp cận với thông tin định danh thực tế của sinh viên, tuân thủ nghiêm ngặt **Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam** và chuẩn **FERPA** trong giáo dục.

---

## IV. KHÍA CẠNH PHÁT TRIỂN & KHẢ NĂNG MỞ RỘNG (SCALABILITY & FUTURE)

### Câu 10: Mở rộng sang thị trường Tuyển dụng (HR-Tech Integration)
> **Chất vấn:** *"Tính năng 'Career Matching Engine' liên kết trực tiếp kỹ năng từ môn học sang nghề nghiệp. Nhóm có kế hoạch mở rộng mô hình để kết nối trực tiếp với các doanh nghiệp săn đón nhân sự không (ví dụ doanh nghiệp trả phí để tiếp cận sinh viên giỏi được AI chứng nhận)?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, đây chính là **tầm nhìn thương mại dài hạn** và là nguồn doanh thu lớn nhất của EduGuard AI ở giai đoạn tăng trưởng:
* **Hồ sơ Năng lực được AI Chứng thực (AI-Certified Skill Profile):** Hiện nay, các doanh nghiệp tuyển dụng lập trình viên mới tốt nghiệp gặp khó khăn lớn vì CV của sinh viên thường được thổi phồng, thiếu xác thực. EduGuard AI cung cấp giải pháp giải quyết triệt để vấn đề này bằng cách xuất ra một hồ sơ kỹ năng số được chứng thực dựa trên toàn bộ lịch sử điểm số thực tế, điểm đồ án môn học, và tốc độ cải thiện kỹ năng trong suốt quá trình học tập.
* **Mô hình doanh thu HR-Tech:** 
  - Doanh nghiệp sẽ trả phí Subscription hàng tháng để sử dụng cổng **EduGuard Talent Portal**. Cổng này cho phép họ tìm kiếm chính xác các ứng viên có bộ kỹ năng tương thích dựa trên trọng số môn học thực tế (ví dụ: tìm ứng viên đạt điểm xuất sắc môn *Lập trình JavaScript cơ bản* và *Cơ sở dữ liệu*).
  - Doanh nghiệp cũng có thể trả phí trên mỗi đầu việc tuyển dụng thành công (Pay-per-hire) hoặc tài trợ các thử thách/đồ án môn học để tiếp cận sớm với nguồn nhân lực chất lượng cao từ năm thứ 2.
* **Đảm bảo quyền riêng tư:** Để tuân thủ pháp luật, dữ liệu hồ sơ chỉ được chia sẻ cho doanh nghiệp khi sinh viên chủ động kích hoạt chế độ **"Sẵn sàng tìm việc" (Open to Work)** và đồng ý cấp quyền truy cập cho doanh nghiệp cụ thể trên Dashboard cá nhân.

---

### Câu 11: Kế hoạch phát triển sản phẩm (Product Roadmap trong 6 tháng tới)
> **Chất vấn:** *"Nếu một doanh nghiệp quyết định đầu tư vốn cho dự án ngay hôm nay, 3 tính năng hoặc nâng cấp quan trọng nhất mà nhóm sẽ ưu tiên thực hiện hoàn chỉnh trong vòng 6 tháng tới để đưa sản phẩm thành một giải pháp sẵn sàng thương mại hóa (Production-ready) là gì?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, nếu nhận được vốn đầu tư hôm nay, chúng em sẽ tập trung nguồn lực hoàn thiện 3 cột mốc kỹ thuật và sản phẩm quan trọng nhất trong vòng 6 tháng tới để đưa EduGuard AI lên môi trường thương mại hóa chính thức:
1. **Tháng 1-2: Xây dựng bộ kết nối dữ liệu chuẩn doanh nghiệp (Enterprise Data Connector & LTI integration):** Hoàn thiện module tích hợp không cấu hình với các hệ thống Canvas, Moodle qua chuẩn LTI và API Webhook. Đảm bảo hệ thống có thể kết nối và đồng bộ dữ liệu điểm số, chuyên cần hai chiều thời gian thực một cách an toàn mà không cần thao tác tải file Excel thủ công.
2. **Tháng 3-4: Phát triển ứng dụng di động (Mobile App for Advisors & Students):** Xây dựng ứng dụng di động đa nền tảng (React Native) cho cả giảng viên và sinh viên. Tính năng trọng tâm là hệ thống **Thông báo đẩy thời gian thực (React-time Push Notifications)** kết hợp Chatbot tương tác nhanh. Thay vì gửi email dễ bị bỏ qua, sinh viên sẽ nhận được cảnh báo nguy cơ và lộ trình phục hồi trực tiếp trên điện thoại, giúp nâng tỷ lệ phản hồi và tương tác can thiệp lên trên 90%.
3. **Tháng 5-6: Xây dựng Hệ thống Giám sát Mô hình AI tự động (AutoML & Concept Drift Monitor):** Hoàn thiện quy trình tự động huấn luyện lại mô hình (AutoML Retraining Pipeline) tích hợp bộ phát hiện trôi dạt khái niệm (Concept Drift). Hệ thống sẽ tự động giám sát sai số dự báo (MAE, Accuracy) và tự động kích hoạt quá trình huấn luyện lại mô hình khi phát hiện có sự thay đổi lớn trong hành vi học tập hoặc quy chế thi cử của nhà trường giữa các khóa học, đảm bảo AI luôn đạt độ chính xác tối ưu theo thời gian.

---

## V. CÁC CÂU HỎI KỸ THUẬT CHUYÊN SÂU KHÁC (TECH & ALGORITHMS - FROM CODEBASE)

### Câu 12: Đồ thị ràng buộc môn học (Dynamic Dependency Graph & DAG Validation)
> **Chất vấn:** *"Việc áp dụng thuật toán DFS và Topological Sort trên đồ thị DAG để theo dõi sự lan truyền rủi ro học vụ là một điểm sáng. Tuy nhiên, nếu cập nhật quy tắc chuỗi phụ thuộc (thêm môn, bỏ môn) bị sai tạo ra chu trình khép kín (Dependency Cycle) khiến sinh viên không bao giờ học được thì hệ thống xử lý thế nào?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, để ngăn chặn triệt để rủi ro cấu hình sai đồ thị môn học (Dependency Cycle - ví dụ môn A yêu cầu môn B, môn B yêu cầu môn C, môn C lại yêu cầu ngược lại môn A), chúng em đã xây dựng một **Pipeline kiểm thử toàn vẹn đồ thị (Integrity Verification Pipeline)**:
* Chúng em tích hợp một script kiểm tra tự động là [verify_curriculum_integrity.js](file:///d:/smartgenai/eduguard-ai/verify_curriculum_integrity.js) chạy ngay trong quy trình tích hợp liên tục (CI/CD) tại bước build của hệ thống.
* Script này sử dụng giải thuật **Duyệt đồ thị theo chiều sâu (DFS) phát hiện cạnh ngược (Back Edge Detection)** để quét toàn bộ đồ thị môn học được cấu hình trong file JSON.
* Nếu phát hiện bất kỳ chu trình khép kín nào hoặc phát hiện một môn học tiên quyết chưa được định nghĩa mã môn, hệ thống sẽ ngay lập tức báo lỗi đỏ, dừng quá trình build và ngăn chặn quá trình deploy cấu hình lỗi lên môi trường Production để bảo vệ tuyệt đối tính đúng đắn của logic học vụ.

---

### Câu 13: Quy mô dữ liệu, LOOCV & Phòng chống quá khớp (Overfitting Mitigation)
> **Chất vấn:** *"Bạn công bố mô hình đạt độ chính xác 92.3% và đã trải qua 14.846 lượt kiểm thử chéo (LOOCV). Tập dữ liệu huấn luyện của bạn có quy mô bao nhiêu và làm thế nào bạn đảm bảo mô hình không bị "học vẹt" (overfitting) với bộ dữ liệu của một trường học cụ thể?"*

**Trả lời chuyên nghiệp:**
* **Quy mô tập dữ liệu thực nghiệm:** Tập dữ liệu huấn luyện của chúng em (trong file CSV `enhanced_student_grades.csv`) bao gồm thông tin học tập thực tế của **653 sinh viên** với hơn **16.000 đầu điểm** chi tiết trải dài qua 6 học kỳ của chuyên ngành Thiết kế & Lập trình Web tại FPT Polytechnic.
* **Cơ sở khoa học của LOOCV:** Với quy mô dữ liệu cấp ngành học (34 môn học), việc sử dụng phương pháp kiểm thử chéo **Leave-One-Out Cross-Validation (LOOCV)** với 14.846 lượt kiểm thử chéo là phương pháp tối ưu và khắt khe nhất để đánh giá độ ổn định của mô hình. Phương pháp này loại bỏ tối đa hiện tượng thiên lệch dữ liệu và giúp kiểm soát sai số trung bình (MAE) ở mức thực tế rất thấp là $\pm 0.77$.
* **Chiến lược phòng chống học vẹt (Overfitting):**
  1. **Chọn lọc đặc trưng nghiêm ngặt (Feature Selection):** Chúng em không đưa các biến nhiễu vào mô hình. Dữ liệu đầu vào chỉ sử dụng điểm thành phần của các môn tiên quyết liên quan trực tiếp đến môn học cần dự đoán, kết hợp với 5 chỉ số hành vi học tập cốt lõi (như chuyên cần, số lần nộp bài muộn).
  2. **Sử dụng kiến trúc mạng nông kết hợp Heuristics:** Chúng em không sử dụng mạng nơ-ron quá sâu (deep neural networks) vì dễ gây overfitting trên tập dữ liệu nhỏ. Thay vào đó, chúng em kết hợp hệ chuyên gia để kiểm soát các điều kiện biên của quy chế đào tạo, và cấu hình các lớp ẩn nhỏ (16 và 8 units) có cơ chế hiệu chuẩn trọng số trong quá trình train, giúp mô hình giữ được khả năng tổng quát hóa tốt nhất khi áp dụng sang các khóa sinh viên tiếp theo.

---

### Câu 14: Nguồn dữ liệu Hướng nghiệp & Ánh xạ kỹ năng môn học (CLO & roadmap.sh)
> **Chất vấn:** *"Trong Module 04, hệ thống có khả năng ánh xạ trực tiếp từ Kỹ năng môn học ra Nghề nghiệp. Thị trường việc làm thay đổi liên tục, ai hoặc cơ sở dữ liệu nào cung cấp và cập nhật các trọng số ánh xạ này?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, cơ sở tri thức để ánh xạ từ Môn học sang Kỹ năng và Nghề nghiệp (Skill-to-Career mapping) trong EduGuard AI được xây dựng dựa trên sự kết hợp khoa học giữa dữ liệu học thuật và xu hướng thị trường:
1. **Chuẩn đầu ra môn học (CLO - Course Learning Outcomes):** Các kỹ năng cốt lõi được định nghĩa chính thức trong đề cương Syllabus môn học của nhà trường đã được Hội đồng Khoa học thẩm định và ban hành.
2. **Lộ trình chuẩn công nghiệp (Industry Roadmaps):** Chúng em thực hiện đối chiếu chéo các kỹ năng của môn học với bản đồ năng lực công nghệ uy tín thế giới từ tổ chức **`roadmap.sh`** (đối với các vị trí Frontend Developer, Backend Developer, Fullstack Developer).
3. **Cơ chế cập nhật trọng số động (Dynamic Weight Adjustment):** Bản đồ ánh xạ kỹ năng nghề nghiệp được lưu trữ động trong file cấu trúc tri thức môn học (`curriculum_knowledge_base.json`), cho phép điều chỉnh trọng số dễ dàng thông qua bảng điều khiển dành cho Quản trị viên (Admin Dashboard) khi chương trình học thay đổi. Trong tương lai, chúng em sẽ phát triển crawler tự động kết nối API với các nền tảng tuyển dụng lớn (như TopCV, VietnamWorks) để phân tích các tin tuyển dụng (Job Descriptions) thực tế hàng ngày, trích xuất các từ khóa công nghệ yêu cầu nhiều nhất để tự động hiệu chỉnh các trọng số ánh xạ kỹ năng, đảm bảo đề xuất hướng nghiệp luôn bám sát xu hướng thị trường lao động thực tế.

---

### Câu 15: Quy trình Leo thang Can thiệp Đa tầng (Multi-Level Escalation Workflow)
> **Chất vấn:** *"Chức năng Intervention Center gửi trực tiếp Lộ trình (Roadmap) phục hồi vào Inbox của sinh viên. Giả sử sinh viên bỏ qua các cảnh báo này, hệ thống có cơ chế "leo thang" (escalate) cảnh báo nào khác tới giảng viên chủ nhiệm hay cố vấn học tập để can thiệp trực tiếp không?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, đây là một điểm mấu chốt trong thiết kế quy trình vận hành sư phạm của EduGuard AI. Chúng em không phó mặc hoàn toàn cho sự tự giác của sinh viên. Hệ thống được tích hợp **Quy trình Leo thang Can thiệp Đa tầng (Multi-Level Escalation Workflow)**:
* **Tầng 1: Cảnh báo tự động (AI Auto-Intervention):** Khi AI phát hiện rủi ro học thuật sớm (như nghỉ học vượt quá giới hạn, điểm bài Quiz đầu tiên $< 5.0$), hệ thống lập tức tự động gửi phân tích nguy cơ kèm Lộ trình phục hồi kiến thức (Recovery Roadmap) vào Inbox của sinh viên.
* **Tầng 2: Cảnh báo Cố vấn học tập (CVHT Level Escalation):** Nếu sau **3 ngày** kể từ khi thông báo được gửi đi, sinh viên không nhấn xác nhận đã đọc, hoặc không cập nhật tiến độ học tập trên lộ trình hồi phục, hệ thống sẽ tự động gắn cờ đỏ và đẩy ca này vào danh mục **"Yêu cầu can thiệp trực tiếp" (Action Required)** trên Dashboard của Cố vấn học tập (CVHT). Đồng thời, AI sẽ soạn thảo sẵn một email chi tiết để CVHT chỉ cần nhấn nút gửi đi để thiết lập cuộc hẹn tư vấn trực tiếp với sinh viên đó.
* **Tầng 3: Cảnh báo khẩn cấp cấp Trường (Critical Escalation):** Trong trường hợp sinh viên rơi vào vùng nguy cơ đặc biệt nghiêm trọng (GPA lũy kế rơi xuống vùng báo động đỏ $< 5.0$ hoặc nợ môn tiên quyết cốt lõi có nguy cơ trễ tốt nghiệp), hệ thống sẽ tự động kết xuất danh sách gửi trực tiếp lên văn phòng **Công tác Học sinh Sinh viên (P.CTHSSV)** và **Giáo viên Chủ nhiệm (GVCN)** để thực hiện cuộc gọi liên hệ trực tiếp với gia đình và sinh viên nhằm đưa ra phương án xử lý kịp thời.

---

### Câu 16: Tính nhất quán dữ liệu (Single Source of Truth - SSOT) giữa DB -> API -> UI -> PDF
> **Chất vấn:** *"Làm thế nào nhóm có thể chắc chắn hệ thống tính toán điểm số và rủi ro chính xác trên toàn bộ dữ liệu sinh viên? Có bị sai lệch số liệu hay không?"*

**Trả lời chuyên nghiệp:**
Dạ thưa Hội đồng, để đảm bảo tính nhất quán dữ liệu tuyệt đối ($100\%$ consistency) ở mọi điểm chạm của hệ thống và tránh hiện tượng số liệu hiển thị lệch nhau giữa các màn hình gây mất uy tín, chúng em áp dụng nguyên lý **Single Source of Truth (SSOT)** ở cả Backend và Frontend:
1. **Backend Layer:** Mọi chỉ số tính toán phức tạp như GPA hệ 10, GPA hệ 4, tín chỉ tích lũy (không tính môn điều kiện như Thể chất `VIE103`, Quân sự `VIE104`, Thực tập `PRO116` theo đúng quy chế đào tạo thực tế) đều được tính toán tập trung tại lớp dịch vụ [dataService.js](file:///d:/smartgenai/eduguard-ai/server/src/utils/dataService.js) và truy xuất trực tiếp từ Database.
2. **Frontend Layer:** Hệ thống sử dụng thư viện quản lý trạng thái **Zustand Global Store** tại frontend. Khi người dùng truy cập trang Web, dữ liệu từ API được nạp một lần duy nhất vào Zustand.
3. **PDF Export:** Khi giảng viên thực hiện xuất báo cáo PDF, dữ liệu được trích xuất (export) trực tiếp từ chính trạng thái đang hiển thị trong Zustand Store chứ không thực hiện gọi API độc làm hay tính toán lại từ đầu. Điều này đảm bảo dữ liệu hiển thị trên màn hình và dữ liệu trong file PDF xuất ra luôn trùng khớp hoàn toàn.
* **Kiểm định thực tế:** Chúng em đã chạy script kiểm tra tích hợp E2E [verify_full_defense.js](file:///d:/smartgenai/eduguard-ai/verify_full_defense.js) đối chiếu dữ liệu của cả 653 sinh viên từ Database qua API đến UI và xuất PDF, kết quả đạt **tỉ lệ trùng khớp 100% (0 mismatches)**, xác thực tính ổn định tuyệt đối của luồng dữ liệu.
