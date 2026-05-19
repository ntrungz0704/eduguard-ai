# EduGuard AI

EduGuard AI là hệ thống dự đoán điểm sinh viên cho giảng viên, sử dụng AI (Mô hình Linear Regression kết hợp GenAI) nhằm phân tích và đưa ra các đánh giá, cảnh báo về tình trạng học tập của sinh viên.

Dự án này sử dụng cấu trúc thư mục bao gồm:
- **Backend**: Node.js/Express (tại thư mục gốc / `server`)
- **Frontend**: React/Vite (tại thư mục `/client`)
- **Database**: SQLite (qua Prisma ORM)

---

## 📋 Yêu Cầu Cần Có

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Node.js** (Khuyến nghị phiên bản 18.x trở lên)
- **Git** (Tuỳ chọn, dùng để clone project)

---

## 🚀 Hướng Dẫn Cài Đặt Chi Tiết

Vui lòng làm theo từng bước dưới đây để cài đặt và chạy dự án 100% thành công.

### Bước 1: Mở Terminal
Mở Terminal (hoặc Command Prompt / PowerShell / Git Bash) và di chuyển vào thư mục gốc của dự án (`eduguard-ai`).

### Bước 2: Cài đặt thư viện (Dependencies)
Dự án cần cài đặt thư viện cho cả Backend và Frontend.

1. **Cài đặt thư viện cho thư mục gốc (Backend):**
   ```bash
   npm install
   ```
2. **Cài đặt thư viện cho giao diện (Frontend):**
   ```bash
   cd client
   npm install
   ```
3. **Quay lại thư mục gốc:**
   ```bash
   cd ..
   ```

### Bước 3: Thiết lập Biến môi trường (.env)
Tạo một file có tên là `.env` tại thư mục gốc của dự án (nếu chưa có). Copy toàn bộ nội dung dưới đây và dán vào file `.env`:

```env
PORT=3000

# API Keys (Thay thế bằng Key thực tế của bạn)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3-32b

NODE_ENV=development

# Đường dẫn kết nối CSDL SQLite
DATABASE_URL="file:./dev.db"
```

### Bước 4: Khởi tạo Cơ sở dữ liệu (Prisma)
Dự án sử dụng SQLite nên việc thiết lập Database rất nhanh chóng. Đảm bảo bạn đang đứng ở thư mục gốc `eduguard-ai` và chạy lần lượt 2 lệnh sau:

1. Tạo Prisma Client (để mã nguồn có thể giao tiếp với Database):
   ```bash
   npx prisma generate
   ```
2. Đồng bộ cấu trúc dữ liệu (Schema) tạo ra file CSDL `dev.db`:
   ```bash
   npx prisma db push
   ```
   *(Nếu hệ thống hỏi xác nhận, hãy gõ `Y` và Enter).*

---

## 💻 Khởi Chạy Ứng Dụng

Nhờ cấu hình bằng `concurrently`, bạn chỉ cần chạy **một lệnh duy nhất** tại thư mục gốc để bật đồng thời cả Backend và Frontend:

```bash
npm run dev
```

Sau khi Terminal thông báo khởi chạy thành công:
- 🌐 **Giao diện Web (Frontend):** Truy cập [http://localhost:5173](http://localhost:5173)
- ⚙️ **API Server (Backend):** Đang chạy ngầm tại cổng `3000`.

---

## 🛠️ Xử lý lỗi thường gặp (Troubleshooting)

1. **Lỗi `EADDRINUSE` (Cổng đang được sử dụng)**
   - Nguyên nhân: Cổng 3000 hoặc 5173 đang bị chiếm bởi một tiến trình khác (hoặc do bạn chưa tắt hẳn ứng dụng ở lần chạy trước).
   - Cách khắc phục: Mở terminal mới ở thư mục gốc và chạy lệnh sau (dành cho Windows) để giải phóng cổng:
     ```bash
     npm run kill
     ```
     Sau đó chạy lại `npm run dev`.

2. **Lỗi Backend không tìm thấy Model (Prisma Client Error)**
   - Nguyên nhân: Chưa tạo Prisma Client.
   - Cách khắc phục: Chạy lại lệnh `npx prisma generate` ở thư mục gốc.

---
**Chúc bạn cài đặt và trải nghiệm hệ thống EduGuard AI thành công! 🎉**
