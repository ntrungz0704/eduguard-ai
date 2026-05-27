# BÁO CÁO KỸ THUẬT & CHIẾN LƯỢC SẢN PHẨM: EDUGUARD AI DSS
**Đội thi:** FPoly Innovators  
**Hạng mục:** Hệ thống Data Marketing (Phân tích & Giữ chân Khách hàng Nội bộ - Sinh viên)  
**Lĩnh vực ứng dụng:** AI + Education + Decision Support System  

---

## 1. GIỚI THIỆU DỰ ÁN
**EduGuard AI DSS** là một Hệ thống Hỗ trợ Ra quyết định (Decision Support System) ứng dụng Trí tuệ Nhân tạo. Dự án ra đời với sứ mệnh chuyển đổi mô hình quản lý giáo dục từ **Bị động (Reactive)** sang **Chủ động dự báo (Proactive Predictive)**. 

Thay vì tập trung vào việc quản trị điểm số đơn thuần, EduGuard tiếp cận sinh viên dưới lăng kính "Data Marketing", coi người học là khách hàng cốt lõi và mục tiêu tối thượng là tối ưu hóa tỷ lệ giữ chân (Academic Retention), giảm tỷ lệ rớt môn và nâng cao trải nghiệm học tập thông qua cá nhân hóa dữ liệu.

## 2. NỖI ĐAU THỊ TRƯỜNG & BÀI TOÁN DOANH NGHIỆP (PAIN POINTS)
Hệ thống quản lý đào tạo hiện tại (LMS, ERP, CMS) đang tồn tại những "điểm mù" dữ liệu nghiêm trọng:
- **Phát hiện quá độ trễ (Late Detection):** Hiện nay, dữ liệu chỉ mang tính "hiển thị" (Descriptive). Khi sinh viên có điểm thi cuối kỳ, hệ thống mới ghi nhận rớt môn. Lúc này, việc can thiệp không còn nhiều ý nghĩa.
- **Sự phân mảnh dữ liệu (Data Silos):** Thông tin điểm danh, điểm số thành phần, lộ trình môn học... bị rải rác. Không có một luồng đánh giá rủi ro tổng thể và liên tục.
- **Khủng hoảng quá tải ở khâu Cố vấn (Advisor Burnout):** Một cố vấn học tập không thể giám sát thủ công hàng ngàn sinh viên mỗi ngày để tìm ra ai đang có nguy cơ.
- **Thiếu cơ chế cảnh báo sớm (Lack of Early Warning):** Khi sinh viên mất động lực học tập, hệ thống không nhận diện được sự sụt giảm phong độ để hỗ trợ kịp thời.

## 3. KHÁCH HÀNG & NGƯỜI DÙNG MỤC TIÊU
EduGuard phục vụ hệ sinh thái gồm 3 nhóm người dùng chính:
- **Ban Đào tạo / Quản lý:** Có được cái nhìn toàn cảnh (Bird's-eye view) về tình hình học vụ. Tối ưu nguồn lực giảng dạy và giảm tỷ lệ sinh viên thôi học.
- **Cố vấn học tập (Academic Advisor):** Được giải phóng khỏi việc rà soát Excel thủ công. Hệ thống tự động lọc ra danh sách sinh viên cần hỗ trợ ngay từ những tuần đầu học kỳ.
- **Sinh viên:** Có một "trợ lý học tập cá nhân" đồng hành, biết chính xác mình đang ở đâu, yếu môn nào, và cần làm gì để cải thiện.

## 4. GIẢI PHÁP ĐỀ XUẤT (THE SOLUTION)
Chúng tôi xây dựng **EduGuard AI DSS** (Enterprise-style Prototype DSS) - hệ thống hỗ trợ phát hiện sớm nguy cơ học vụ dựa trên dữ liệu lịch sử, bao gồm:
- **Prototype Predictive Scoring Model:** Phân tích dữ liệu để dự báo sớm lộ trình leo thang cảnh báo học vụ, kết hợp Rule-based + probabilistic educational risk analysis.
- **Explainable AI (XAI):** Không chỉ đưa ra con số rủi ro, hệ thống giải thích rõ *nguyên nhân* bằng ngôn ngữ con người (vd: "Rủi ro do nợ 2 môn tiên quyết và GPA đang có xu hướng giảm sút").
- **NLP Academic Assistant:** Trợ lý ảo hỗ trợ hội thoại theo ngữ cảnh phiên làm việc, hoạt động nội bộ, giúp tra cứu hồ sơ và đề xuất phương án can thiệp ngay trên cửa sổ chat.

## 4.1. CÔNG THỨC TÍNH ĐIỂM RỦI RO (RISK FORMULA)
Hệ thống sử dụng cơ chế kết hợp trọng số xác suất (không phải ngẫu nhiên, có logic kiểm chứng được) để phân loại mức độ rủi ro của sinh viên. Công thức prototype cơ bản:
- **40%** Biến động GPA (GPA Trend)
- **25%** Tỷ lệ Rớt môn / Nợ tiên quyết
- **15%** Tỷ lệ Chuyên cần (Attendance)
- **10%** Độ trễ nộp bài (Assignment Delay)
- **10%** Mức độ Tương tác LMS (Login/Activity)

## 5. TÍNH NĂNG CỐT LÕI TẠO NÊN SỰ KHÁC BIỆT
- **Risk Ranking (Phân loại Nguy cơ):** Tự động phân luồng sinh viên thành 4 nhóm (CRITICAL, HIGH, MEDIUM, LOW) dựa trên thuật toán AI.
- **Bottleneck Detection (Nhận diện Điểm nghẽn):** Phân tích phổ rộng để tìm ra các môn học đang có tỷ lệ rớt cao bất thường.
- **Academic Timeline Escalation:** Theo dõi dòng thời gian rủi ro của sinh viên để đánh giá xu hướng.
- **NLP Assistant:** Trợ lý hỗ trợ hội thoại theo ngữ cảnh, ghi nhớ lịch sử hội thoại để tư vấn liền mạch.

## 6. LUỒNG TRẢI NGHIỆM NGƯỜI DÙNG (UX FLOW)
**Góc nhìn của Cố vấn học tập:**
1. Đăng nhập vào Dashboard. Nhìn thấy Heatmap tổng quan toàn khối.
2. Click vào nhóm rủi ro cao (CRITICAL).
3. Chọn sinh viên A. Mở cửa sổ Chatbot NLP.
4. Gõ: *"Phân tích chi tiết rủi ro của sinh viên này"*. AI trả về: *"Sinh viên A đang nợ môn tiên quyết WEB101, GPA giảm 1.5 so với kỳ trước"*.
5. Gõ tiếp: *"Đề xuất lộ trình can thiệp"*. AI đưa ra phương án và mẫu email nhắc nhở. Cố vấn quyết định hành động.

**Góc nhìn của Sinh viên:**
1. Đăng nhập vào ứng dụng.
2. Thấy thanh trạng thái học tập.
3. Nhận được phân tích: *"Môn Cấu trúc dữ liệu đang có điểm thành phần dưới trung bình"*.
4. Xem Roadmap cá nhân hóa để cải thiện điểm số.

## 7. ĐỊNH HƯỚNG CÔNG NGHỆ AI DƯỚI GÓC NHÌN SẢN PHẨM
EduGuard sử dụng phương pháp **Hybrid AI** (Trí tuệ nhân tạo lai), kết hợp:
- **Machine Learning (Predictive AI):** Hỗ trợ phân loại dữ liệu số (GPA, Fail Rate) để đưa ra mức độ rủi ro.
- **Natural Language Processing (NLP):** Sử dụng `node-nlp` để phân loại ý định (Intent Classification), giúp xử lý ngôn ngữ tự nhiên hiệu quả.
- **Explainable AI (XAI):** Mọi phân tích của ML đều được kết hợp với Rule-based Engine để tạo ra lời giải thích minh bạch.

> [!IMPORTANT] 
> **Mục tiêu chính của mô hình AI ở giai đoạn hiện tại là hỗ trợ sàng lọc và ưu tiên mức độ chú ý (Prioritization), thay vì thay thế hoàn toàn quá trình đánh giá của con người.** Cố vấn học tập luôn là người ra quyết định cuối cùng, AI chỉ hỗ trợ tổng hợp và phân tích.

## 8. PHÂN TÍCH KẾT QUẢ MÔ HÌNH PROTOTYPE
Hệ thống hiện tại (giai đoạn Prototype) đang cho ra kết quả dự đoán với độ chính xác cao. Nhóm nhận thức rõ điều này xuất phát từ đặc thù của pha thử nghiệm:
- **Dữ liệu phân cực:** Feature đầu vào chủ yếu là điểm số thuần túy (GPA, Tỷ lệ rớt môn), có tính phân loại rất rõ ràng.
- **Self-labeling:** Do giới hạn về dữ liệu thực tế (danh sách sinh viên đã buộc thôi học), hệ thống tạm thời dùng các rule nghiệp vụ để dán nhãn, khiến mô hình học lại các quy luật này rất nhanh.

Đây chưa phải là độ chính xác thực tế khi triển khai sản phẩm. Ở các pha tiếp theo, khi bổ sung dữ liệu hành vi (Behavioral Data) như điểm danh, hoạt động trên LMS, độ nhiễu sẽ tăng lên và mô hình sẽ phản ánh đúng thực tế hơn.

## 9. NGUỒN DỮ LIỆU VÀ XỬ LÝ
- **Nguồn:** Tập dữ liệu bảng điểm thật của hơn 650 sinh viên tại cơ sở.
- **Tiền xử lý (Preprocessing):** Mã hóa ẩn danh (Anonymization) toàn bộ thông tin định danh để bảo mật dữ liệu.
- **Feature Extraction:** Chuyển đổi dữ liệu bảng điểm thô thành các tính năng định lượng.
- **Data Privacy:** Xử lý cục bộ (Local/Offline).

## 10. GIÁ TRỊ THỰC TẾ (BUSINESS METRICS)
Hệ thống mang lại các chỉ số tối ưu vận hành rõ rệt. Trong mô phỏng thử nghiệm nội bộ, hệ thống cho thấy khả năng:
- Rút ngắn đáng kể thời gian rà soát dữ liệu thủ công của cố vấn học tập.
- Thu hẹp danh sách theo dõi dàn trải từ hàng ngàn sinh viên xuống một nhóm nhỏ có nguy cơ cao nhất.
- Hỗ trợ phát hiện nguy cơ học vụ sớm hơn so với việc chờ điểm thi cuối kỳ.
- Tối ưu ROI giáo dục bằng việc nâng cao tỷ lệ giữ chân sinh viên (Retention Rate), duy trì sự ổn định cho cơ sở đào tạo.

## 11. LỘ TRÌNH PHÁT TRIỂN
- **Giai đoạn Prototype (Hiện tại):** Hoàn thiện luồng DSS trên dữ liệu học thuật cơ bản. Chứng minh tính khả thi của kiến trúc AI Pipeline.
- **Giai đoạn Pilot:** Triển khai thử nghiệm quy mô nhỏ. Tích hợp dữ liệu hành vi học tập (Behavioral Data).
- **Giai đoạn Mở rộng:** Tích hợp trực tiếp dữ liệu thời gian thực và tự động hóa các kênh thông báo.

## 12. TẠI SAO LẠI XÂY DỰNG NLP OFFLINE THAY VÌ DÙNG CHATGPT?
Hệ thống giáo dục có những đặc thù riêng mà các API LLM public (như ChatGPT) không phải lúc nào cũng là lựa chọn tối ưu nhất. EduGuard NLP Assistant mang lại:
1. **Bảo mật dữ liệu tuyệt đối (Data Privacy):** Hồ sơ và điểm số của sinh viên là dữ liệu nhạy cảm, việc xử lý Offline đảm bảo không rò rỉ dữ liệu nội bộ ra ngoài.
2. **Kiểm soát tính chính xác:** Hạn chế tình trạng "ảo giác" (Hallucination) tư vấn sai quy chế đào tạo. AI chỉ trả lời trong phạm vi tri thức được thiết kế.
3. **Chi phí vận hành:** Tối ưu hóa chi phí khi triển khai lâu dài do không phải trả phí token API.

## 13. KẾT LUẬN
EduGuard AI DSS không chỉ là một công cụ thống kê hay chatbot vấn đáp. Đây là giải pháp hỗ trợ ra quyết định mang tư duy "Data-driven Education". 

Công nghệ không sinh ra để thay thế giảng viên hay cố vấn học tập, mà để giải phóng họ khỏi khối lượng dữ liệu khổng lồ. Từ đó, thầy cô có thêm thời gian để làm điều quan trọng nhất: **Đồng hành và hỗ trợ sinh viên vượt qua giai đoạn khó khăn.**

---
---

# PHỤ LỤC: CẨM NANG BẢO VỆ DỰ ÁN TRƯỚC HỘI ĐỒNG (Q&A)

### Q1: Dữ liệu của em có hợp pháp không?
**Trả lời:** 
*"Dạ, dữ liệu đã được ẩn danh toàn bộ thông tin định danh cá nhân và chỉ sử dụng cho mục đích nghiên cứu prototype học thuật."*

### Q2: AI thật sự học cái gì ở mô hình này?
**Trả lời:** 
*"Ở giai đoạn hiện tại, mô hình học mối liên hệ giữa các chỉ số học thuật như GPA, số môn rớt và mức độ nguy cơ học vụ được xác định theo rule nghiệp vụ. Mục tiêu chính của tụi em ở pha này là chứng minh khả năng xây dựng pipeline AI và luồng hoạt động của hệ thống DSS, chưa phải là xây dựng một mô hình AI thương mại hoàn chỉnh với độ chính xác tuyệt đối."*

### Q3: Vì sao độ chính xác (Accuracy) của hệ thống lại rất cao ở giai đoạn này?
**Trả lời:** 
*"Dạ, hệ thống đang ở pha Prototype. Hiện tại, độ chính xác cao do dữ liệu học thuật đầu vào (GPA, số môn rớt) còn khá phân cực và nhóm đang áp dụng self-labeling dựa trên rule nghiệp vụ. Nhóm hoàn toàn nhận thức đây chưa phải độ chính xác khi triển khai thực tế. Ở giai đoạn tiếp theo, khi bổ sung dữ liệu hành vi có độ nhiễu cao (điểm danh, nộp bài trễ), mô hình sẽ hội tụ ở mức thực tế hơn."*

### Q4: Tại sao không gọi API ChatGPT cho nhanh và thông minh hơn?
**Trả lời:**
*"Dạ, ChatGPT mạnh hơn về mặt giao tiếp ngôn ngữ, nhưng trong môi trường giáo dục nội bộ, vấn đề Bảo mật dữ liệu (Data Privacy) là ưu tiên số 1. Việc gửi bảng điểm sinh viên qua API bên thứ ba là rủi ro lớn. Do đó, nhóm ưu tiên tự xây dựng mô hình NLP Offline, vừa bảo mật, vừa kiểm soát được câu trả lời (không bị hallucination sai quy chế), lại tối ưu chi phí vận hành."*

### Q5: Nếu AI dự đoán sai một sinh viên (False Positive) thì sao?
**Trả lời:**
*"Đây chính là lý do dự án có tên là **Decision Support System (Hệ thống Hỗ trợ Ra Quyết định)** chứ không phải Hệ thống Tự động hóa. Mục tiêu chính của mô hình AI ở giai đoạn hiện tại là hỗ trợ sàng lọc và ưu tiên mức độ chú ý (Prioritization), thay vì thay thế hoàn toàn quá trình đánh giá của con người. Cố vấn học tập sẽ là người nhìn vào bảng phân tích rủi ro (Explainable AI) để tự ra quyết định cuối cùng."*
