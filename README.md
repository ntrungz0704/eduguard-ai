# EduGuard AI: Academic Intelligence Platform 🎓

> "Không để bất kỳ sinh viên nào bị bỏ lại phía sau."

EduGuard AI là một Nền tảng Phân tích Học vụ (Academic Intelligence Platform) được thiết kế cho Cố vấn học tập và Ban giám hiệu. Hệ thống sử dụng **Máy học Minh bạch (Explainable AI - XAI)** và **Xử lý Ngôn ngữ Tự nhiên (Local NLP)** chạy hoàn toàn Offline (bảo mật dữ liệu 100%) để dự đoán sớm nguy cơ rớt môn của sinh viên ngay từ tuần thứ 3 của học kỳ.

![EduGuard AI Architecture](docs/architecture/system_design.png)

---

## 🚀 Hướng dẫn Cài đặt & Chạy Dự án (Dành cho Lập trình viên)
Dự án này đã được tối ưu cấu hình để bất kỳ ai clone về cũng có thể chạy thành công 100% chỉ với vài lệnh đơn giản.

**Yêu cầu hệ thống:**
- Đã cài đặt Node.js (Phiên bản 18 trở lên).
- Đã cài đặt Git.

### Bước 1: Tải mã nguồn và Cài đặt thư viện
Mở Terminal / Command Prompt và chạy các lệnh sau:

```bash
# 1. Clone source code từ Github
git clone https://github.com/ntrungz0704/eduguard-ai.git
cd eduguard-ai

# 2. Cài đặt các thư viện cần thiết cho Backend (Server)
npm install
cd server
npm install
cd ..

# 3. Cài đặt các thư viện cần thiết cho Frontend (Client)
cd client
npm install
cd ..

# 4. Khởi tạo Cơ sở dữ liệu nội bộ (SQLite)
cd server
npx prisma db push
cd ..
```

### Bước 2: Khởi động Toàn bộ Hệ thống (Chỉ 1 lệnh)
Chúng tôi đã tích hợp sẵn một lệnh tự động dọn dẹp cổng, huấn luyện AI, và khởi chạy toàn bộ server + client. Bạn chỉ cần gõ đúng 1 lệnh này ở thư mục gốc (`eduguard-ai`):

```bash
npm run boot
```

**Lệnh này sẽ:**
1. Dọn dẹp kẹt cổng (cổng 3000, 5173).
2. Chạy thuật toán học máy dự báo điểm (`npm run train`).
3. Chạy thuật toán xử lý ngôn ngữ tự nhiên Chatbot (`npm run train:chat`).
4. Bật giao diện Web.

Sau khoảng 10 giây, bạn hãy mở trình duyệt và truy cập: **[http://localhost:5173](http://localhost:5173)**

---

## 🗄️ Hướng dẫn Xem & Sửa Dữ liệu Database
Dự án sử dụng Prisma ORM và SQLite. Bạn có thể xem trực quan toàn bộ dữ liệu điểm số, thông tin sinh viên cực kỳ dễ dàng bằng công cụ Prisma Studio.

Mở một Terminal **MỚI** (nhớ giữ nguyên terminal đang chạy hệ thống), và gõ lệnh:

```bash
cd server
npx prisma studio
```

Lệnh này sẽ tự động mở một tab mới trên trình duyệt (thường là `http://localhost:5555`). Tại đây bạn có thể xem các bảng `Student`, `Course`, `Score`, `Prediction`, `Intervention` y như dùng Excel!

---

## 🌟 Điểm nổi bật về Kỹ thuật (Technical Highlights)

- 🧠 **Predictive Academic Analytics**: Tích hợp mô hình hồi quy tuyến tính (Linear Regression) và hệ số tương quan Pearson, tìm ra quy luật "Môn tiên quyết" để dự báo nguy cơ rớt môn.
- 📊 **Explainable AI (XAI)**: AI giải thích trực quan nguyên nhân rủi ro (Ví dụ: *Do điểm môn tiên quyết C++ thấp và nghỉ học 3 buổi*).
- 🔒 **100% Offline & Data Privacy (FERPA)**: Trợ lý ảo Chatbot sử dụng Lightweight Local NLP (`node-nlp`), không phụ thuộc API ChatGPT/Gemini, đảm bảo dữ liệu sinh viên không bao giờ rò rỉ ra ngoài.
- 🎛️ **Materialized Prediction View**: Logic tính toán AI nặng được thiết kế để chạy nền (Background Worker) và lưu vào Database, giúp truy xuất API đạt tốc độ `O(1)`.
- 🚀 **Enterprise Mindset**: Kiến trúc mã nguồn sạch (Domain-Driven Design), tách biệt Frontend (React/Vite) và Backend (Node/Express), tích hợp Zod Validator, JWT, Rate Limiting và Prisma ORM.

---

## 🔭 Lộ Trình Nâng Cấp Hệ Thống Trong Tương Lai
Nếu muốn phát triển dự án này từ "Đồ án xuất sắc" thành một sản phẩm khởi nghiệp (Startup/SaaS) thực thụ, team đang triển khai các bước sau:

1. **Docker hóa dự án**: Viết file `Dockerfile` và `docker-compose.yml` để đóng gói toàn bộ server + DB vào container, chạy trên mọi VPS chỉ bằng 1 lệnh.
2. **PostgreSQL Migration**: Chuyển đổi từ SQLite sang PostgreSQL để chịu tải song song.
3. **Caching Layer**: Tích hợp Redis để tối ưu hóa truy xuất dữ liệu mô hình.
4. **Auto-Deployment**: Kết nối GitHub với Vercel (cho Frontend) và Render / Railway (cho Backend) để tự động deploy bản live mỗi khi merge PR.
5. **AI Pipeline Versioning**: Sử dụng DVC để quản lý lịch sử các phiên bản mô hình AI (Model Registry).

---

*Phát triển bởi đội ngũ Kỹ sư EduGuard AI - Nâng tầm trí tuệ giáo dục.*
*(Xem hướng dẫn dành cho người đóng góp tại [CONTRIBUTING.md](CONTRIBUTING.md))*
