# Mục tiêu

Triển khai quy tắc **DATABASE INTEGRITY & SINGLE SOURCE OF TRUTH (SSOT)**. Đảm bảo dữ liệu bảng điểm gốc từ file Excel được nhập nguyên vẹn vào hệ thống mà không qua "suy đoán" (hallucination) của AI. Hệ thống tính toán (GPA, DSS) phải hoàn toàn dựa trên dữ liệu thật.

## User Review Required

> [!IMPORTANT]
> Việc lưu trữ lịch sử cập nhật bảng điểm (Snapshot) yêu cầu tạo thêm table `TranscriptHistory` trong cơ sở dữ liệu.
> Tôi sẽ thêm model `TranscriptHistory` vào `schema.prisma` và thiết lập quan hệ với `Student`. Khi upload file mới, toàn bộ bảng điểm hiện tại của sinh viên sẽ được JSON-ify và lưu vào `TranscriptHistory` trước khi ghi đè, đảm bảo tính Audit (truy xuất lịch sử). Bạn có đồng ý với việc thay đổi cấu trúc DB này không?

## Proposed Changes

### 1. Database & Schema
#### [MODIFY] `server/prisma/schema.prisma`
- Thêm model `TranscriptHistory` với các trường: `id`, `mssv`, `snapshotData` (JSON chứa danh sách điểm), `version`, `uploadedBy`, `createdAt`.
- Xóa bỏ semester khỏi Unique Constraint của Score (tùy chọn) hoặc thực hiện logic: xóa sạch Score cũ của MSSV tương ứng và chèn Score mới khi import để đảm bảo bảng điểm mới là SSOT duy nhất.

### 2. Import Parser (Dọn sạch Auto-correction)
#### [MODIFY] `server/src/modules/data/import.controller.js`
- **Tắt tính năng Auto Mapping**: Loại bỏ hoàn toàn `resolveBackendCourseCode`. File Excel ghi mã môn là gì (`COM108`, `ITI101`), DB sẽ lưu chính xác mã môn đó.
- **Cập nhật Logic Upsert (SSOT)**: Khi phát hiện 1 `MSSV` trong file import:
  1. Lấy toàn bộ `Score` hiện tại của `MSSV` đó.
  2. Tạo 1 record `TranscriptHistory` chứa bản sao lưu của các `Score` này.
  3. Xóa các `Score` cũ HOẶC thực hiện `upsert` cẩn thận dựa trên `courseId` để loại bỏ các điểm rác (ví dụ: upload lần trước có `COM108=10`, upload lần này `COM108=8.9`, ta sẽ cập nhật `COM108` thành `8.9` bất kể `semester` là gì).
- **Khôi phục điểm Studying**: Đảm bảo điểm thực (ví dụ `4.8`) của môn `STUDYING` được truyền vào DB thay vì bị filter thành `null` (đã xóa code rác nhưng cần kiểm chứng lại toàn bộ flow lưu db).

### 3. Analytics Service (Tính GPA chính xác)
#### [MODIFY] `server/src/services/analyticsService.js`
- Cập nhật hàm `calculateFptGPA`:
  - **Chỉ cộng môn Passed**: `if (status === 'PASSED')` thì mới tính vào công thức tính GPA. (Các môn `STUDYING`, `FAILED` sẽ không bị nhầm lẫn tính vào).
  - Bổ sung các môn điều kiện (PRO116, VIE103, VIE104) vào blacklist một cách tường minh để đảm bảo không lọt môn nào vào GPA.

### 4. UI Rendering (Chống fake 0.0)
#### [MODIFY] `client/src/pages/StudentProfile.jsx`
- **Tắt Fuzzy Matching**: Thay thế `cleanDbId.startsWith(cleanCurrId)` bằng đối chiếu **chính xác 100%** `cleanDbId === cleanCurrId`.
- **Sửa lỗi hiển thị `0.0`**: Với các môn có `score = null`, giao diện bắt buộc hiển thị dấu gạch ngang `—` (Chưa có điểm) thay vì tự động ép kiểu thành `0.0`.

## Verification Plan

### Automated/Manual Verification
- Chạy lại Import một bảng điểm mẫu của sinh viên `PS47261`.
- Chạy `node scratch_query.js` để đối chiếu:
  - `ENT223` phải có điểm `4.8` và status `STUDYING`.
  - `WEB1023` phải có điểm `1.0` và status `STUDYING`.
  - Không có sự xuất hiện của dữ liệu rác (VD: `COM108=10.0` nếu file mới là `8.9`).
- Vào giao diện Profile của `PS47261`:
  - GPA hệ 10 và hệ 4 phải chính xác theo quy tắc FPT (chỉ tính môn Passed, bỏ qua điều kiện).
  - Môn học hiển thị `—` thay vì `0.0`.
