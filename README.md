<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/brain-circuit.svg" alt="EduGuard AI Logo" width="120" height="120" />

  # EduGuard AI

  AI-Powered Academic Decision Support System

  🏆 Competition Project<br>
  🎯 Student Performance Prediction<br>
  🤖 NLP Academic Assistant<br>
  📊 DSS Dashboard

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  *A Competition-ready Academic DSS Prototype.*
</div>

---

## 🚀 1. Quick Start

**Cách 1: Khởi chạy bằng Docker (Khuyên dùng - Ổn định nhất)**
Cách này tự động cài đặt tất cả môi trường (Node.js, CSDL, thư viện AI). Bạn chỉ cần cài sẵn [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/ntrungz0704/eduguard-ai.git
cd eduguard-ai
docker-compose up -d --build
```

> 👉 **Truy cập `http://localhost:3000`** sau khi tiến trình hoàn tất. Hệ thống đã được nạp sẵn dữ liệu và AI!
> *(Lệnh tắt hệ thống khi không dùng: `docker-compose down`)*

---

**Cách 2: Chạy thủ công (Dành cho Developer)**
Đây là cách chạy trực tiếp trên máy tính. Bạn **BẮT BUỘC** phải cài đặt Node.js trước khi chạy:
- 📥 **Tải Node.js (Bản LTS) tại đây:** [https://nodejs.org/](https://nodejs.org/)

```bash
git clone https://github.com/ntrungz0704/eduguard-ai.git
cd eduguard-ai

# 1. Cài đặt thư viện máy chủ (Server)
npm install

# 2. Cài đặt thư viện giao diện (Client) & Khởi tạo CSDL mẫu
npm run setup

# 3. Huấn luyện AI & Khởi chạy hệ thống
npm run boot:full
```

> 👉 **Truy cập `http://localhost:5173`** sau khi lệnh cuối cùng chạy xong.
> *(Lưu ý: Lần đầu tiên chạy, bạn cần vào mục **Dự đoán & Cảnh báo** -> Chọn môn học -> Nhấn **Phân tích Rủi ro** để AI chạy thực tế, sau đó Dashboard mới có dữ liệu cảnh báo).*

**Lần chạy tiếp theo (Mở lại dự án):**
Bạn chỉ cần mở Terminal và gõ lệnh sau (hệ thống sẽ dùng lại AI đã train mà không cần khởi tạo lại từ đầu, rất nhanh):
```bash
npm run boot
```


---

## 🔐 2. Demo Credentials

Hệ thống đã được thiết lập sẵn tài khoản và dữ liệu (100+ học sinh, 1000+ bảng điểm). 

**Giảng viên / Admin (Cố vấn học tập)**
- **Tên đăng nhập:** `admin` *(Hệ thống tự ghép đuôi @fpt.edu.vn)*
- **Mật khẩu:** `admin123`

**Sinh viên**
- **Mã số sinh viên:** `PS47261` *(Hoặc nhập bất kỳ MSSV nào hợp lệ)*
- **Mật khẩu:** `123456` *(Hỗ trợ nhập bất kỳ chuỗi nào từ 4 ký tự trở lên)*

---

## 🎥 3. Demo Video
**YouTube:** (https://www.youtube.com/watch?v=_xWiC-XDT6U)

---

## 📸 4. Screenshots

### 1. Đăng nhập hệ thống (Login)
![Login](screenshots/login.png)

### 2. Dashboard Tổng Quan
![Dashboard](screenshots/dashboard.png)

### 3. Tra Cứu Sinh Viên (Student Search)
![Student Search](screenshots/student_search.png)

### 4. Mô-đun Dự Báo & Cảnh Báo Nguy Cơ (Prediction)
![Prediction & Alert](screenshots/prediction.png)

### 5. Quản Lý Can Thiệp Học Vụ (Intervention)
![Intervention Management](screenshots/intervention.png)

### 6. AI Assistant (NLP Chatbot)
![AI Chatbot](screenshots/chatbot.png)

---

## ❓ 5. Problem Statement
Current academic management systems store data but do not provide intelligent insights. 

**EduGuard AI helps:**
- Predict student performance from historical data.
- Analyze academic records and visualize dependency risks.
- Provide AI-powered consultation for academic advisors.
- Support data-driven decision making to prevent dropouts.

---

## 🌟 6. Core Features
- ✅ **Student Management**: Trực quan hóa dữ liệu sinh viên toàn diện.
- ✅ **GPA Analytics**: Phân tích phổ điểm và theo dõi tiến độ.
- ✅ **Risk Prediction**: Dự báo sớm nguy cơ trượt môn (High, Medium, Low).
- ✅ **NLP Assistant**: Chatbot hỗ trợ cố vấn học tập tra cứu thông tin nhanh.
- ✅ **DSS Dashboard**: Bảng điều khiển ra quyết định chuyên nghiệp.
- ✅ **Academic Recommendations**: Đề xuất can thiệp học vụ kịp thời.

---

## 🧠 7. AI Components
EduGuard AI không chỉ là phần mềm CRUD quản lý thông thường, mà được tích hợp sâu 3 động cơ lõi:
- **Risk Forecast Engine**: Phân tích và dự báo nguy cơ dựa trên điểm số lịch sử (Sử dụng `TensorFlow.js`).
- **Academic Assistant**: Trợ lý ảo NLP có khả năng hiểu ý định (Intent Recognition) của người dùng (Sử dụng `NLP.js`).
- **Knowledge Dependency Graph**: Phát hiện "Lỗ hổng kiến thức dây chuyền" dựa trên cấu trúc tín chỉ tiên quyết (Sử dụng `Graph Traversal Algorithm`).

---

## 🏗️ 8. Architecture
Hệ thống được thiết kế theo chuẩn Modular Monolith minh bạch, dễ dàng mở rộng.

![Architecture Diagram](docs/architecture.png)

*(Chi tiết xem thêm tại thư mục `docs/`)*

---

## 💻 9. Tech Stack
- **Frontend**: React, TailwindCSS, Recharts
- **Backend**: Node.js, Express
- **Database**: SQLite (cho bản Prototype), PostgreSQL (sẵn sàng cho Production)
- **AI**: TensorFlow.js (Dự báo), Node-NLP (Chatbot)

---

## 🛠️ 10. Troubleshooting (Common Issues)

- **Port 3000/5173 already in use (Lỗi kẹt cổng Windows):**
  ```bash
  taskkill /F /PID <PID_của_tiến_trình>
  ```
- **Node Version Requirement:** Yêu cầu Node.js `>= 18`.
- **Docker Requirement:** Yêu cầu Docker `>= 24`.

---

## 👥 11. Team EduGuard-AI
- Backend Engineering & DSS Architecture
- Frontend Development & Data Visualization

Tác giả:
- Nguyễn Phạm Thành Trung
- Nguyễn Minh Hiếu
- Mai Thị Vỹ An
<br>
<div align="center">
  <i>"Explain Risk. Support Students. Improve Outcomes."</i>
</div>
