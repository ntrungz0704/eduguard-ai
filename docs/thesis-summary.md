# Tóm Tắt Đồ Án (Thesis Summary)

**Tên đề tài:** EduGuard AI DSS - Hệ thống Hỗ trợ Ra quyết định Học vụ ứng dụng Trí tuệ Nhân tạo

## 1. Bài toán (Problem Statement)
- Sinh viên rớt môn thường được phát hiện khi quá muộn (sau thi cuối kỳ).
- Cố vấn học tập (CVHT) quá tải, không thể theo dõi hàng trăm sinh viên thủ công.
- Dữ liệu học tập rời rạc, các hệ thống truyền thống chỉ làm nhiệm vụ hiển thị (Descriptive) mà thiếu đi khả năng dự đoán (Predictive) và phân tích nguyên nhân.

## 2. Giải pháp Đề xuất (Proposed Solution)
Xây dựng một hệ thống EduGuard AI DSS, là sự kết hợp giữa Xử lý ngôn ngữ tự nhiên (NLP) và Hệ thống hỗ trợ ra quyết định (DSS). Hệ thống biến các dữ liệu thô thành các quyết định có thể hành động (Actionable Insights) cho giảng viên.

## 3. Các Điểm Nổi Bật Kỹ Thuật (Key Technical Features)
1. **Explainable AI (XAI):** AI không chỉ xuất ra điểm rủi ro (Risk Score) mà còn giải thích các nguyên nhân gốc rễ dẫn đến rủi ro (Nợ môn tiên quyết, Chuyên cần tụt giảm).
2. **Context-aware Chatbot:** Trợ lý ảo sử dụng NLP để hiểu ý định người dùng (Intent Classification), có khả năng nhớ phiên làm việc (Session Memory) và phân quyền bảo mật (RBAC).
3. **Academic Risk Engine:** Động cơ đánh giá rủi ro kết hợp Hồi quy (Regression) và Tập luật Sư phạm (Rule-based).
4. **Class-level Analytics:** Các bảng điều khiển (Dashboard) trực quan hóa tiến trình leo thang cảnh báo (Timeline Escalation) và Bản đồ nhiệt rủi ro (Risk Heatmap).

## 4. Ý Nghĩa Thực Tiễn (Practical Impact)
Hệ thống cho phép phát hiện sớm nguy cơ từ tuần thứ 3-4, hỗ trợ CVHT có danh sách ưu tiên can thiệp khẩn cấp. Mô hình giúp giảm thiểu tình trạng rớt dây chuyền, giữ lại sinh viên và tối ưu hóa công tác quản lý đào tạo. Mặc dù ở giai đoạn Prototype/Demo, kiến trúc hệ thống đã được thiết kế phân tầng chuẩn mực, mở ra hướng tích hợp sâu với LMS của nhà trường trong tương lai.
