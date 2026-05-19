# EduGuard AI

EduGuard AI là một dự án tích hợp Chatbot AI hỗ trợ giáo dục, bao gồm Backend bằng Node.js/Express và Frontend bằng React/Vite, kết hợp cùng cơ sở dữ liệu SQLite thông qua Prisma ORM.

---

## 📊 Tổng quan cấu trúc dự án
* **Backend**: Node.js / Express Server — chạy ở thư mục gốc (**Cổng 3000**).
* **Frontend**: React / Vite SPA — nằm trong thư mục `client/` (**Cổng 5173**).
* **Database**: SQLite (`dev.db` đã được tích hợp sẵn trong mã nguồn, không cần cài đặt thêm MySQL hay Postgres).
* **ORM**: Prisma Client (Cần được tạo trước khi khởi chạy Backend).

---

## 🛠 Yêu cầu hệ thống (Prerequisites)
Môi trường hệ thống đã được kiểm tra và xác minh hoạt động ổn định:
* **Node.js**: v22.18.0
* **npm**: 10.8.2

---

## ⚙️ Cấu hình Biến môi trường (.env)

⚠️ **LƯU Ý QUAN TRỌNG:**
* Repository này **không có sẵn** file `.env.example`, bạn phải tự tạo một file tên là `.env` bằng tay.
* File `.env` này bắt buộc phải được đặt tại **thư mục gốc** của dự án (`d:\smartgenai\eduguard-ai`).
* Hệ thống backend sẽ **bị crash ngay lập tức khi khởi động** nếu thiếu cấu hình `GROQ_API_KEY`.

### Nội dung file `.env` mẫu tại thư mục gốc:

```env
# =================================================================
# 1. CẤU HÌNH BẮT BUỘC (MẶC ĐỊNH ĐỂ KHỞI ĐỘNG HỆ THỐNG)
# =================================================================
DATABASE_URL="file:./dev.db"
GROQ_API_KEY=your_groq_api_key_here

# =================================================================
# 2. CẤU HÌNH NÂNG CAO (Kích hoạt đầy đủ tính năng Chatbot/AI)
# =================================================================
PORT=3000
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_MODEL=qwen/qwen3-32b
GEMINI_MODEL=gemini-2.0-flash
