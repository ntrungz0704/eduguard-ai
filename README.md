# EduGuard AI

EduGuard AI là một dự án tích hợp Chatbot AI hỗ trợ giáo dục. Hệ thống sử dụng kiến trúc phân tách với Backend Node.js/Express và Frontend React/Vite, kết hợp cùng cơ sở dữ liệu SQLite thông qua Prisma ORM.

## 1. Tổng quan kiến trúc (Tech Stack)
* **Backend:** Node.js / Express Server (Chạy tại cổng `3000`).
* **Frontend:** React / Vite SPA (Nằm trong thư mục `client/`, chạy tại cổng `5173`).
* **Database:** SQLite (File `dev.db` tích hợp sẵn, tối ưu cho môi trường phát triển cục bộ).
* **ORM:** Prisma Client.
* **AI Providers:** Hỗ trợ linh hoạt Groq và Google Gemini.

## 2. Yêu cầu hệ thống (Prerequisites)
Môi trường đã được xác minh hoạt động ổn định:
* Node.js: `v22.18.0` trở lên
* npm: `10.8.2` trở lên

## 3. Hướng dẫn cài đặt (Installation Steps)

Thực hiện lần lượt các lệnh sau tại thư mục gốc của dự án để cài đặt thư viện và chuẩn bị kết nối cơ sở dữ liệu:

1.  **Cài đặt dependencies cho Backend:**
    ```bash
    npm install
    ```
2.  **Cài đặt dependencies cho Frontend:**
    ```bash
    cd client
    npm install
    cd ..
    ```
3.  **Khởi tạo Prisma Client:**
    *Tại sao cần bước này?* Backend sử dụng Prisma Client để giao tiếp với file `dev.db`. Bạn bắt buộc phải generate client từ schema trước khi khởi động server, nếu không tiến trình Node.js sẽ báo lỗi thiếu module database.
    ```bash
    npx prisma generate
    ```

## 4. Cấu hình biến môi trường (.env)

Dự án không cung cấp sẵn file `.env.example`. Bạn cần tự tạo một file tên là `.env` tại **thư mục gốc** của dự án. 

Hệ thống đã được tối ưu cơ chế khởi tạo trễ (lazy-initialization) cho AI Client. Việc thiếu API Key sẽ không làm crash hệ thống lúc khởi động, nhưng các tính năng AI sẽ không hoạt động cho đến khi cấu hình đầy đủ.

**Nội dung file `.env` tham khảo:**
```env
# =========================================================
# 1. CẤU HÌNH HỆ THỐNG CƠ BẢN
# =========================================================
PORT=3000
DATABASE_URL="file:./dev.db"

# =========================================================
# 2. CẤU HÌNH AI TÍCH HỢP (CẦN THIẾT ĐỂ CHẠY CHATBOT)
# =========================================================
AI_PROVIDER=gemini # Có thể đổi thành 'groq' tùy nhu cầu sử dụng

# Cấu hình Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Cấu hình Groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3-32b
