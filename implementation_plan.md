# Mục tiêu

Triển khai bản cập nhật lớn cho **DSS Academic Intervention Center**, chuyển đổi từ một công cụ "báo động" thành một hệ thống Hỗ trợ Ra Quyết Định (Decision Support System) thực thụ. Các tính năng cốt lõi:
1. **Explainable AI (XAI)**: Cung cấp Evidence & Confidence thay vì phán đoán cảm tính (như Burnout).
2. **Human-in-the-loop (Luồng can thiệp chuẩn)**: Giảng viên duyệt/sửa nội dung trước khi gửi.
3. **Workflow CRM Học thuật**: Quản lý vòng đời sinh viên (HIGH RISK → MONITORING → STABLE → CLOSED).
4. **Audit Log & Undo**: Truy xuất lịch sử thay đổi trạng thái và hỗ trợ hoàn tác.

## User Review Required

> [!IMPORTANT]
> Việc tạo luồng CRM và Audit Log cần thay đổi bảng trong Database.
> Tôi sẽ thêm model `AuditLog` vào `schema.prisma`. 
> Các trạng thái của `InterventionRoadmap` (hiện tại là PENDING, OPENED, IN_PROGRESS, COMPLETED) sẽ được định nghĩa lại thành `HIGH_RISK`, `MONITORING`, `STABLE`, `CLOSED` để khớp với quy trình mà bạn mong muốn.
> Bạn có đồng ý với việc thay đổi cấu trúc trạng thái này không?

## Proposed Changes

### 1. Database Schema
#### [MODIFY] `server/prisma/schema.prisma`
- **Thêm model `AuditLog`**: Lưu vết chi tiết (action, lecturer, studentId, details JSON, timestamp).
- Cập nhật model `Student` để có quan hệ với `AuditLog`.
- Cập nhật comment trạng thái của `InterventionRoadmap` sang: `HIGH_RISK`, `MONITORING`, `STABLE`, `CLOSED`.

### 2. Backend APIs
#### [MODIFY] `server/src/modules/api.js`
- **Thêm API `POST /interventions-management/change-status`**: Cho phép đổi trạng thái của 1 sinh viên (kèm tính năng lưu `AuditLog` và hỗ trợ Undo dựa trên JSON chi tiết).
- **Thêm API `GET /interventions-management/audit-logs`**: Lấy danh sách lịch sử.
- **Sửa API `GET /interventions-management`**:
  - Trả về cấu trúc DTO mới: `highRisk`, `monitoring`, `stable`, `closed`.
  - Số liệu tổng SV được tính động bằng `COUNT(DISTINCT MSSV)` (`students.length` trong DB).
  - Tích hợp thêm **Confidence** (VD: 0.82) và **Evidence** (dựa vào `reasons` hoặc điểm của các môn tiên quyết).

### 3. Frontend - Giao diện Academic Intervention Center
#### [MODIFY] `client/src/pages/Interventions.jsx`
- **Đổi tên các nhãn (Labels)**:
  - Bỏ hoàn toàn các từ ngữ như: "Burnout", "Hổng Kiến Thức Nền", "Khẩn cấp".
  - Đổi thành: `Nguy cơ học thuật cao`, `Nền tảng môn tiên quyết yếu`, `Điểm số thấp kéo dài`.
  - Thay đổi hệ thống màu từ cảnh báo gắt sang các gam màu chuyên nghiệp (Academic color scheme).
- **Cấu trúc Tab**: 
  - Đổi "Top 20 nguy hiểm" thành "Top 20 Priority Cases".
  - Các Tab chính: `HIGH RISK`, `MONITORING`, `STABLE`, `CLOSED`.
- **Flow Can Thiệp (Human-in-the-loop)**:
  - Khi bấm **[Đề xuất can thiệp ưu tiên]** (Thay cho "AI Gửi Khẩn Cấp"), hệ thống chỉ **Sinh Roadmap** và hiển thị trên màn hình.
  - Cung cấp tính năng **[Chỉnh sửa]** cho Giảng viên.
  - Nút **[Gửi cho Sinh viên]** (Send) sẽ đẩy tin nhắn vào inbox của sinh viên, đồng thời:
    - Chuyển trạng thái sang `MONITORING`.
    - Ghi log vào `AuditLog`.
- **Hiển thị XAI (Explainable AI)**:
  - Cột Predicted Score sẽ đính kèm `Confidence` (VD: 82%).
  - Bổ sung cột/tooltip `Evidence` chỉ rõ cơ sở (VD: `WEB2041 = 5.8`, `Pearson r=0.63`).
- **Undo functionality**:
  - Tích hợp Snackbar / Nút Undo khi chuyển trạng thái nhầm, gọi ngược API `change-status` kèm log Undo.

## Verification Plan

### Automated/Manual Verification
- Khởi động lại hệ thống và truy cập trang Interventions.
- Kiểm tra các số liệu sinh viên (Top numbers) phải hiển thị dựa vào dữ liệu thực (Không hardcode 658).
- Thử nghiệm chức năng "Đề xuất can thiệp ưu tiên": AI sinh nháp -> GV sửa -> Bấm Gửi -> Chuyển sang Tab "Cần theo dõi" (MONITORING) -> Kiểm tra Audit Log.
- Bấm "Ổn định" cho 1 sinh viên -> Kiểm tra hiển thị nút "Undo" -> Bấm Undo để sinh viên quay lại tab MONITORING.
