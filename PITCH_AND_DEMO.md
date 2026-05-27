# EduGuard AI — Pitch Narrative & Demo Flow

Tài liệu này cung cấp kịch bản chi tiết để thuyết trình (pitching) và demo dự án EduGuard AI trước ban giám khảo, nhà tuyển dụng hoặc khách hàng. Trọng tâm của kịch bản này là **kể một câu chuyện giải quyết vấn đề (storytelling)** thay vì chỉ liệt kê tính năng kỹ thuật.

---

## 1. The Pitch Narrative (Câu chuyện cốt lõi)

**The Hook (Vấn đề):**
"Chào ban giám khảo, chúng ta đều biết một thực trạng đáng buồn ở các trường đại học: tỷ lệ sinh viên bỏ học hoặc rớt môn luôn ở mức cao. Các Cố vấn học tập (CVHT) phải quản lý hàng trăm sinh viên cùng lúc. Họ chỉ có thể can thiệp *sau khi* sinh viên đã rớt môn hoặc bị cảnh cáo học vụ — lúc đó đã quá muộn. Chúng tôi gọi đây là 'Sự can thiệp bị động'."

**The Solution (Giải pháp - EduGuard AI):**
"Hôm nay, chúng tôi mang đến EduGuard AI — Hệ thống Cảnh báo sớm và Hỗ trợ Quyết định học tập. EduGuard AI chuyển đổi quy trình quản lý từ 'bị động' sang 'chủ động'. Thay vì chờ sinh viên rớt môn, hệ thống sử dụng thuật toán AI để phân tích dữ liệu lịch sử và thói quen học tập, từ đó dự đoán nguy cơ rớt môn của từng cá nhân *ngay từ giữa học kỳ*, giúp CVHT kịp thời can thiệp."

**The Enterprise Difference (Điểm khác biệt - Nhấn mạnh Kỹ thuật):**
"Không chỉ dừng lại ở một AI Model dự đoán, chúng tôi xây dựng EduGuard AI với tư duy của một hệ thống Enterprise thực thụ. 
- **Security & RBAC:** Phân quyền chặt chẽ giữa Admin, Cố vấn và Sinh viên.
- **Explainable AI (XAI):** Không chỉ đưa ra con số rủi ro, hệ thống giải thích rõ *tại sao* sinh viên đó gặp rủi ro, tạo niềm tin cho người ra quyết định.
- **Audit Logging & Tracing:** Mọi thao tác truy cập dữ liệu nhạy cảm của sinh viên đều được tracking chặt chẽ.
- **Local NLP:** Xây dựng một engine NLP nội bộ, không phụ thuộc 100% vào API bên ngoài, đảm bảo bảo mật dữ liệu sinh viên và tối ưu chi phí."

---

## 2. The Flawless Demo Flow (Kịch bản Demo Từng bước)

**Thời gian dự kiến:** 4-5 phút.
**Mục tiêu:** Thể hiện luồng người dùng mượt mà, nhấn mạnh vào giá trị nghiệp vụ (Business Value) và sự trưởng thành của UI/UX (Maturity).

### Step 1: Đăng nhập (Authentication & RBAC)
- **Hành động:** Mở trang Login. Đăng nhập bằng tài khoản Cố vấn học tập (Advisor).
- **Thoại:** "Tôi sẽ đăng nhập vào hệ thống với vai trò Cố vấn học tập. Hệ thống được bảo vệ bởi cơ chế xác thực JWT và Role-Based Access Control, đảm bảo chỉ những người có thẩm quyền mới được truy cập dữ liệu học thuật."

### Step 2: Tổng quan Dashboard (The Value)
- **Hành động:** Màn hình chuyển vào Dashboard. Trỏ chuột vào các chỉ số Analytics (Tổng SV, Số SV Rủi ro cao).
- **Thoại:** "Ngay khi đăng nhập, CVHT có ngay một bức tranh toàn cảnh. Thay vì lặn ngụp trong các file Excel, hệ thống đã tự động lọc ra những sinh viên đang ở mức rủi ro CRITICAL (Nguy cấp) và HIGH (Cao)."

### Step 3: Phân tích Sinh viên (Explainable AI & Risk Panel)
- **Hành động:** Click vào một sinh viên ở mức CRITICAL (VD: PS47261). Màn hình chuyển sang trang chi tiết sinh viên, hiển thị Risk Panel.
- **Thoại:** "Khi click vào sinh viên Nguyễn Văn A, chúng ta không chỉ thấy cảnh báo màu đỏ. Đây là điểm khác biệt của EduGuard: Explainability (Tính giải thích). Hệ thống chỉ ra rõ ràng nguyên nhân rủi ro là do: *Nghỉ học quá 20%* và *Điểm giữa kỳ dưới 4*. Điều này giúp CVHT ngay lập tức hiểu vấn đề mà không cần tra cứu thủ công."

### Step 4: Gợi ý Can thiệp (Recommendation Layer)
- **Hành động:** Trỏ chuột vào phần "Suggested Interventions" (Gợi ý can thiệp) trên UI.
- **Thoại:** "Dựa trên mức độ rủi ro CRITICAL, hệ thống tự động đưa ra các gợi ý can thiệp (Rule-based recommendation). Trong trường hợp này, hệ thống đề xuất: 'Gọi điện khẩn cấp cho phụ huynh' và 'Đặt lịch hẹn tư vấn học tập ngay trong tuần'."

### Step 5: Hỏi đáp AI (Chatbot & NLP)
- **Hành động:** Mở cửa sổ Chatbot ở góc phải. Gõ câu hỏi: "Tình hình chuyên cần của sinh viên này thế nào?"
- **Thoại:** "Đôi khi CVHT cần thông tin nhanh. Họ có thể hỏi trực tiếp Trợ lý AI. Trợ lý này sử dụng Local NLP Engine của chúng tôi để hiểu ý định (intent) và truy xuất dữ liệu ngay lập tức, trả lời chính xác số buổi vắng mà không cần phải tìm kiếm trong hệ thống phức tạp."

### Step 6: Tính minh bạch & Bảo mật (Audit Log)
- **Hành động:** Chuyển qua tab Terminal của backend (nếu có thể) hoặc slide chụp màn hình console log.
- **Thoại:** "Cuối cùng, ở góc độ kỹ thuật Enterprise, mỗi khi tôi xem hồ sơ sinh viên vừa rồi, hệ thống đã tự động ghi lại một Audit Log (Nhật ký kiểm toán) chi tiết: Ai đã xem, xem ai, lúc mấy giờ, từ IP nào. Điều này đảm bảo tính minh bạch và tuân thủ bảo mật dữ liệu sinh viên một cách tuyệt đối."

### Kết luận (The Ask/Wrap-up):
"EduGuard AI không chỉ là một bài tập áp dụng AI. Nó là một giải pháp Enterprise-ready, giải quyết một pain-point có thật của các cơ sở giáo dục, với kiến trúc có thể mở rộng và bảo mật cao. Xin cảm ơn ban giám khảo."
