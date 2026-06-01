# Kịch bản Bảo vệ Đồ án (Q&A Defense Strategy)

Tài liệu này chứa các kịch bản trả lời phản biện dành riêng cho Ban Giám khảo (BGK) tại kỳ thi SmartGen AI 2026.

## 1. Vấn đề "Dữ liệu & Tính chân thực" (Tử huyệt của các đồ án AI)
**Giám khảo hỏi:** *"Dữ liệu đào tạo của các em lấy từ đâu? Độ chính xác như thế nào? Có phải các em đang dùng dữ liệu fake (mock data) để demo không?"*

**Chiến thuật phòng thủ (Slide: Current Limitations):**
Dũng cảm thừa nhận giới hạn và biến nó thành tầm nhìn.
**Trả lời:** 
*"Dạ thưa BGK, trong khuôn khổ một đồ án học thuật hiện tại (Phase 1: Prototype DSS), chúng em gặp khó khăn trong việc tiếp cận cơ sở dữ liệu thật của trường vì lý do bảo mật thông tin sinh viên.*
*Do đó, **Current Limitations (Giới hạn hiện tại)** của hệ thống là một số tham số như Điểm danh (Attendance) hoặc Điểm thành phần (Quiz) đang được sinh ra dựa trên nội suy phân phối chuẩn (Normal Distribution).*
*Tuy nhiên, kiến trúc của hệ thống đã được thiết kế sẵn sàng ở tầng Repository Layer. Nếu dự án được đầu tư bước sang Phase 2, chúng em chỉ cần cắm API của LMS trường vào Repository là hệ thống sẽ chạy Realtime với dữ liệu thật 100% mà không cần sửa đổi bất kỳ logic AI nào."*

## 2. Vấn đề "Thuật toán Dự báo" (AI Prediction)
**Giám khảo hỏi:** *"Các em dùng mô hình Machine Learning / Deep Learning gì để dự báo tương lai sinh viên? Dataset để huấn luyện mô hình này là bao nhiêu?"*

**Chiến thuật phòng thủ (Khái niệm Trend-based Risk Forecasting):**
Tuyệt đối không dùng từ "AI Prediction" hay "Machine Learning" để tránh bị xoáy sâu vào Model Architecture và Loss Function.
**Trả lời:**
*"Dạ, module dự báo của chúng em không sử dụng Machine Learning truyền thống (như Random Forest hay LSTM), mà chúng em xây dựng một mô hình gọi là **Trend-based Risk Forecasting (Dự báo Rủi ro theo Xu hướng tuyến tính)**.*
*Vì dữ liệu học vụ trong một học kỳ khá ngắn (khoảng 15 tuần), việc dùng ML/DL sẽ dẫn đến tình trạng Overfitting do thiếu Data. Do đó, Forecast Engine của chúng em đánh giá tốc độ giảm sút của GPA qua 2 nửa học kỳ và tỷ lệ trượt môn để suy ra gia tốc rủi ro (Risk Increment). Việc áp dụng quy tắc Toán học thay vì Hộp đen (Blackbox) của ML giúp dự án đạt được tính XAI (Explainable AI) - giải thích được chính xác tại sao lại dự báo rớt."*

## 3. Vấn đề "Đây là Chatbot hay là AI?"
**Giám khảo hỏi:** *"Thầy thấy cái này giống một con Chatbot dùng NLP bình thường trả lời tự động, điểm khác biệt của Decision Support System (DSS) ở đây là gì?"*

**Chiến thuật phòng thủ (Quy trình 5 Bước Enterprise DSS):**
Mở ngay slide Architecture Diagram.
**Trả lời:**
*"Dạ thưa thầy/cô, NLP chỉ đóng vai trò như một Lễ tân (Router) để nghe người dùng. Trái tim của dự án nằm ở quy trình 5 bước sau đó:*
1. **Analytics:** Hệ thống đo lường (Risk Engine).
2. **Diagnosis:** Hệ thống tự giải thích tại sao rủi ro (XAI Engine).
3. **Forecast:** Hệ thống tự dự báo xu hướng tương lai (Forecast Engine).
4. **Scenario:** Hệ thống cho phép cố vấn chạy mô phỏng "Nếu - Thì" (Scenario Engine).
5. **Prescriptive:** Hệ thống chủ động đề xuất giải pháp theo mức độ Ưu tiên (Recommendation Engine).
*Tất cả mọi thao tác đều được hệ thống lưu vết (Audit Trail). Đây là một hệ thống hỗ trợ ra quyết định (DSS) toàn diện, chứ không đơn thuần là một hệ thống trả lời tự động FAQ ạ."*
