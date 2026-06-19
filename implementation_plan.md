# Cập nhật Score Integrity, Career Evidence & DSS Consistency

Mục tiêu là đảm bảo "Single Source of Truth", 100% dữ liệu xuất phát từ Database chính xác. Loại bỏ các dữ liệu "giả" (null, 0 giả) khỏi quá trình Training, Evaluation, và Analytics, đồng thời loại bỏ "ảo giác" (hallucination) trong tính năng Career Matching. Cập nhật Tra Cứu Học Vụ cho toàn bộ sinh viên trong DB.

## User Review Required

- **Xóa rủi ro 0 điểm giả**: Hệ thống import hiện tại sẽ không bao giờ tự gán 0 cho các giá trị rỗng (`null`). Các dữ liệu cũ nếu đã bị gán 0 giả (fake 0) có thể cần làm sạch thủ công bằng script (ví dụ: `UPDATE Score SET value = null, status = 'NOT_STARTED' WHERE value = 0 AND ...`), AI không tự động cập nhật lại các điểm 0 đã tồn tại để tránh rủi ro mất dữ liệu thật nếu sinh viên thực sự thi được 0 điểm. Nếu bạn muốn tự động xóa điểm 0 cũ, vui lòng xác nhận.

## Open Questions

- Không có.

## Proposed Changes

---

### Môn học & Điểm số (Score Integrity & Analytics)

#### [MODIFY] [import.controller.js](file:///e:/my-project/eduguard-ai/server/src/modules/data/import.controller.js)
- Cập nhật hàm `calculateScore` để không trả về 0 nếu không có thành phần điểm nào thực sự tồn tại.
- Đảm bảo các ô trống không bao giờ bị ép thành `FAILED` với `score = 0`. Nếu giá trị điểm là rỗng, `status` mặc định là `NOT_STARTED` hoặc `STUDYING`.

#### [MODIFY] [analyticsService.js](file:///e:/my-project/eduguard-ai/server/src/services/analyticsService.js)
- Tại hàm `getTopBottlenecks` (Top Môn Tạch), thêm bộ lọc cứng để chỉ lấy các môn thỏa mãn: `status === 'FAILED'`, `value !== null`, `value < 5.0`.
- Chặn hoàn toàn môn `PRO116` (Thực tập tốt nghiệp) và các môn điều kiện khỏi thống kê môn trượt (Top Fail Subjects) bằng hàm `isConditionalCourse`.

---

### AI Evaluation & Training (Ground Truth Only)

#### [MODIFY] [api.js](file:///e:/my-project/eduguard-ai/server/src/modules/api.js)
- Tại endpoint `/evaluate-model`: Sửa logic `Leave-One-Out Cross Validation (LOOCV)`. Bỏ qua hoàn toàn các môn có `score === null` hoặc `status` là `STUDYING`/`NOT_STARTED`. Chỉ tính `MAE`, `RMSE` cho các môn thực sự có Ground Truth.

---

### Career Matching & DSS Engine (No Hallucination)

#### [MODIFY] [dssReportEngine.js](file:///e:/my-project/eduguard-ai/server/src/ai/engines/dssReportEngine.js)
- Sửa hàm `generateDetailedDSSReport` phần `careerImpactAnalysis`.
- Chuyển `isPossessed` từ `boolean` sang `possessionState` gồm 3 trạng thái:
  - `POSSESSED`: Khi sinh viên đã học và đạt điểm >= 5.0.
  - `FAILED`: Khi sinh viên tạch môn hoặc yếu.
  - `UNKNOWN`: Khi môn học chứa kỹ năng này chưa được học (điểm `null`, `NOT_STARTED`...).
  
#### [MODIFY] [StudentProfile.jsx](file:///e:/my-project/eduguard-ai/client/src/pages/StudentProfile.jsx)
- Đọc `possessionState` và thay đổi UI hiển thị danh sách kỹ năng Career Matching.
  - Nếu `POSSESSED` -> hiển thị biểu tượng `✓` (Màu xanh).
  - Nếu `FAILED` -> hiển thị biểu tượng `✗` (Màu đỏ).
  - Nếu `UNKNOWN` -> hiển thị biểu tượng `?` (Màu cam/xám, đánh dấu là "Chưa có dữ liệu").

---

## Verification Plan

### Automated Tests
- Import một file Excel có chứa học sinh mới, với điểm để trống hoặc môn học `PRO116`. Chạy API để chắc chắn điểm được lưu là `null` với trạng thái `NOT_STARTED`.

### Manual Verification
1. Truy cập trang `Tra Cứu Học Vụ`, tìm kiếm và mở hồ sơ một sinh viên.
2. Tại mục Career, kiểm tra xem các kỹ năng chưa học có đang hiện dấu `?` thay vì `✓` hay không.
3. Chạy đánh giá mô hình (AI Evaluation Dashboard) và xác minh số môn có Ground Truth được tính toán đúng, không bị ảnh hưởng bởi điểm `null`.
4. Xem danh sách Môn học khó nhất (Top Fail Subjects) trong Dashboard Lecturer, đảm bảo `PRO116` không xuất hiện và số lượng rớt không lấy điểm 0 ảo.
