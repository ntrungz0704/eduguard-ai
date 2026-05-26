# KỊCH BẢN THUYẾT TRÌNH PITCHING 5 PHÚT (HỌC THUỘC LÒNG)

## 0:00 — 0:30 (Opening Hook - Khơi gợi nỗi đau)
*"Kính chào Ban Giám Khảo. Hiện nay, phần lớn hệ thống học vụ của các trường đại học chỉ phát hiện sinh viên gặp vấn đề sau khi kỳ thi kết thúc và điểm số được công bố. Nhưng lúc đó, việc can thiệp thường đã quá muộn, sinh viên đã mất động lực hoặc rớt môn tiên quyết. Chúng em tự hỏi: **Tại sao chúng ta không dùng dữ liệu để phòng bệnh, thay vì chữa bệnh?***"

## 0:30 — 1:10 (Pain Point - Sự quá tải)
*"Một cố vấn học tập hiện tại phải quản lý hàng ngàn sinh viên, trong khi dữ liệu học tập lại bị phân mảnh. Việc rà soát Excel thủ công là bất khả thi. Hậu quả là, những sinh viên thực sự cần được giúp đỡ lại bị bỏ sót. Chúng em gọi đó là lỗ hổng của sự bị động."*

## 1:10 — 2:00 (Solution & Priority - Giải pháp)
*"Đó là lý do FPoly Innovators phát triển **EduGuard AI DSS** — Hệ thống Hỗ trợ Ra Quyết định Học vụ. Ở đây, AI không sinh ra để thay thế con người hay đưa ra những dự báo viễn tưởng. Mục tiêu lớn nhất của chúng em là **Prioritization (Sàng lọc và Ưu tiên mức độ chú ý)**, giúp cố vấn học tập khoanh vùng chính xác đối tượng rủi ro ngay từ tuần thứ 3, thứ 4 của học kỳ."*

## 2:00 — 3:00 (Demo - Trình chiếu Sản phẩm)
*"Xin mời BGK xem màn hình Dashboard. Thay vì một bảng tính khô khan, hệ thống hiển thị Heatmap toàn khối. 
*(Click)* Từ 3000 sinh viên, hệ thống khoanh vùng 52 em ở mức CRITICAL (báo động đỏ). 
*(Click)* Chọn sinh viên A. Điểm sáng của hệ thống là **Explainable AI (AI Giải thích được)**. AI chỉ rõ nguyên nhân: 'Sinh viên đang có xu hướng GPA giảm mạnh và nợ môn tiên quyết'.
*(Chuyển Slide/Thao tác)* Và đây là vòng lặp khép kín: Hệ thống không chỉ cảnh báo, mà theo dõi quá trình **Can thiệp (Intervention Tracking)** để đo lường xem rủi ro của sinh viên đó có thực sự giảm xuống hay không."*

## 3:00 — 4:00 (Technical Defense - Đánh giá AI)
*"Về mặt công nghệ, hệ thống dùng Hybrid AI (Kết hợp Rule-based và Machine Learning). Ở giai đoạn Prototype, mô hình cho kết quả phân loại rất tốt. Chúng em trung thực nhìn nhận đây là do dữ liệu bảng điểm đang khá phân cực và sử dụng self-labeling. 
Trong giáo dục, bỏ sót một sinh viên cần giúp đỡ (**False Negative**) nguy hiểm hơn rất nhiều so với báo động nhầm (**False Positive**). Do đó, thiết kế hệ thống của chúng em thà cảnh báo thừa để cố vấn tốn 1 phút kiểm tra, còn hơn bỏ sót. Khi bước sang Phase 2 với dữ liệu hành vi (Behavioral Data) từ LMS, mô hình sẽ phản ánh đúng các xu hướng rủi ro ngầm."*

## 4:00 — 5:00 (Closing - Tầm nhìn)
*"Chúng em xây dựng EduGuard NLP Assistant ưu tiên bảo mật Offline thay vì gọi API bên ngoài để tránh rò rỉ dữ liệu. EduGuard không cướp việc của ai cả. Hệ thống sinh ra để dọn dẹp hàng ngàn dữ liệu vô tri, mang lại cho thầy cô sự thảnh thơi để làm điều quan trọng nhất: **Gặp gỡ, đồng hành và hỗ trợ sinh viên kịp thời**. Xin cảm ơn BGK đã lắng nghe!"*

---
---

# BỘ CÂU HỎI Q&A PHẢN BIỆN "HẠ GỤC" BGK

**1. Đây có thật sự là AI không hay chỉ là rule-based?**
> *"Dạ ở giai đoạn hiện tại, hệ thống đang ở mô hình Hybrid AI. Rule-based được dùng để đảm bảo tính minh bạch và kiểm soát rủi ro trong môi trường giáo dục, còn Machine Learning hỗ trợ học các mối liên hệ. Nhóm không định vị đây là AGI hay AI thay thế con người, mà là một Decision Support System có khả năng ưu tiên hóa (Prioritization)."*

**2. Accuracy cao vậy có fake không?**
> *"Dạ không fake, nhưng nhóm tự nhận thức đây là hiện tượng overfitting nhẹ do dữ liệu prototype phân cực và sử dụng self-labeling. Cốt lõi của Phase này là chứng minh luồng AI Pipeline và Dashboard hoạt động tốt. Khi bổ sung Behavioral Data (dữ liệu hành vi LMS) ở Phase 2, độ chính xác sẽ hội tụ về mức thực tế."*

**3. Tại sao không dùng ChatGPT API?**
> *"Dạ đây là sự lựa chọn về kiến trúc (Privacy-first Architecture). Bảng điểm sinh viên là dữ liệu mật không được gửi qua API bên ngoài. Hơn nữa, NLP Offline cục bộ cho phép nhóm kiểm soát hoàn toàn Domain tri thức, tránh việc AI sinh ra ảo giác (Hallucination) tư vấn sai quy chế đào tạo."*

**4. False Positive và False Negative cái nào nguy hiểm hơn?**
> *"Trong bài toán giáo dục, False Negative (AI bỏ sót một sinh viên đang sắp rớt) nguy hiểm hơn rất nhiều so với False Positive (Báo động giả). Do đó threshold (ngưỡng rủi ro) của hệ thống được tinh chỉnh để thà dư còn hơn bỏ sót."*

**5. AI học cái gì? (Câu hỏi tử huyệt)**
> *"Hiện tại mô hình học mối liên hệ giữa các biến động học thuật (GPA, Tỷ lệ môn rớt) và mức độ rủi ro dựa trên cấu trúc dữ liệu lịch sử. Mục tiêu chính là ưu tiên hóa mức độ chú ý (Prioritization) thay vì dự đoán chính xác tuyệt đối điểm số tương lai."*

**6. Model Drift là gì? (Chứng tỏ hiểu biết Senior)**
> *"Hành vi sinh viên và chương trình học sẽ thay đổi qua các năm. Do đó nhóm đã có thiết kế Model Drift, nghĩa là mô hình sẽ phải được Re-train (huấn luyện lại) theo từng học kỳ để cập nhật các xu hướng rủi ro mới nhất."*

**7. Behavioral Data (Dữ liệu hành vi) mà nhóm định thêm vào là gì?**
> *"Dạ đó là Tần suất đăng nhập LMS, Tỷ lệ chuyên cần (Attendance), và Độ trễ nộp bài Assignment. Đây mới là những 'dữ liệu ngầm' báo hiệu sinh viên chán học trước cả khi họ có điểm thi."*

**8. Nếu AI sai thì sao?**
> *"Đó là lý do hệ thống tên là DSS (Hệ thống Hỗ trợ Ra quyết định). AI chỉ làm nhiệm vụ 'Sàng lọc'. Con người (Cố vấn học tập) nhìn vào lời giải thích của AI (Explainable AI) để tự xác minh và ra quyết định cuối cùng."*

**9. Tính pháp lý của dữ liệu?**
> *"Toàn bộ dữ liệu bảng điểm đã được Ẩn danh (Anonymized) tự động trước khi đưa vào huấn luyện, hoàn toàn không vi phạm quyền riêng tư."*

**10. Có thể áp dụng cho trường khác không?**
> *"Kiến trúc Modular Monolith của hệ thống hoàn toàn cho phép Re-train trên bộ dữ liệu của trường khác mà không phải đập đi xây lại core logic."*
