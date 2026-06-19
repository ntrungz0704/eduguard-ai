# Hoàn Thành Audit & Nâng Cấp Hệ Thống

Toàn bộ các quy tắc nghiêm ngặt về Score Integrity, Ground Truth Evaluation và Career Matching đã được tích hợp thành công vào nhân hệ thống.

## Những thay đổi cốt lõi:

1. **Score Integrity (Dọn dẹp Import Parser)**
   - Cập nhật `calculateScore` trong `import.controller.js` để triệt tiêu việc trả về điểm 0 khi các trường điểm (`quiz`, `asm`, `final`) bị bỏ trống.
   - Khi điểm thực tế bằng `null`, hệ thống sẽ gắn `rowStatus` mặc định là `NOT_STARTED` thay vì ép thành `FAILED` hoặc ném ra lỗi thiếu dữ liệu.

2. **Top Fail Subjects Chính Xác**
   - Sửa logic tại hàm `getTopBottlenecks` trong `analyticsService.js`.
   - Bổ sung kiểm tra bằng `isConditionalCourse` để chặn vĩnh viễn các môn điều kiện (bao gồm `PRO116`, GDTC, GDQP) khỏi danh sách điểm liệt.
   - Thêm điều kiện bắt buộc `score.status === 'FAILED'` VÀ `score.value < 5.0` để thống kê chính xác số học sinh trượt, bỏ qua các môn chưa học hoặc chưa có điểm.

3. **Ground Truth Evaluation (LOOCV)**
   - Tại API `/evaluate-model`, quá trình đánh giá (tính MAE, RMSE) đã được loại bỏ hoàn toàn các điểm `null`.
   - Các điểm 0 thật (khi `score >= 0` và có minh chứng) được hệ thống bảo lưu và dùng để train, còn `null` được lọc bỏ để tránh làm sai số quá trình dự đoán (Regression).

4. **Career Matching Không Bịa Đặt (No Hallucination)**
   - Viết lại hàm đánh giá kỹ năng `possessionState` trong `dssReportEngine.js`. 
   - Từ nay kỹ năng sẽ có 3 trạng thái rõ rệt: `POSSESSED` (đạt), `FAILED` (kém/trượt), `UNKNOWN` (chưa học, không có điểm minh chứng).
   - Giao diện `StudentProfile.jsx` đã được thay đổi để hiển thị dấu `?` cho các kỹ năng chưa học, thay thế dấu check mark xanh mặc định như trước đây.

### Xác thực hệ thống
- Build ứng dụng React Client (`npm run build`) thành công rực rỡ, không gặp lỗi.
- Code đã được Commit và Push lên Repository. Bạn có thể kiểm thử trực tiếp trên ứng dụng.
