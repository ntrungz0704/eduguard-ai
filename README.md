<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/brain-circuit.svg" alt="EduGuard AI Logo" width="120" height="120" />

  # EduGuard AI 🛡️
  
  **Explainable Academic Risk Intelligence System**

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

  *A Production-Ready Enterprise Prototype for Academic Learning Analytics.*
</div>

---

## 🌟 Giới thiệu (Overview)

**EduGuard AI** không chỉ là một bảng điều khiển sinh viên (Admin Panel) thông thường. Đây là một nền tảng **Learning Analytics & Decision Support System** toàn diện. 

Hệ thống giải quyết bài toán cốt lõi của các cơ sở giáo dục đại học: **Sự can thiệp bị động**. Thay vì đợi sinh viên rớt môn hoặc bị cảnh cáo học vụ, EduGuard AI sử dụng phân tích dữ liệu lịch sử để dự báo rủi ro từ sớm, giải thích nguyên nhân (Explainable AI), và đề xuất hành động can thiệp ngay lập tức cho Cố vấn học tập (CVHT).

### 🚀 Tính năng cốt lõi (Core Features)
- **Predictive Analytics:** Ước lượng rủi ro học thuật dựa trên dữ liệu lịch sử môn học (Low, Medium, High, Critical).
- **Explainable AI (XAI) / Rule-based System:** Không phải là "Hộp đen". Hệ thống giải thích minh bạch lý do dẫn đến rủi ro (do vắng mặt, do hổng kiến thức dây chuyền từ các môn tiên quyết).
- **Intervention Recommendation:** Tự động đề xuất các hành động can thiệp sư phạm phù hợp cho Cố vấn học tập (CVHT).
- **Dependency Graph Engine:** Thuật toán duyệt đồ thị (Graph Traversal) để phát hiện lỗ hổng kiến thức tích lũy theo thời gian thực (Local processing, 0ms latency).
- **Enterprise Dashboard:** Giao diện trực quan hóa dữ liệu chuyên nghiệp, thiết kế chuẩn mực DSS (Decision Support System).

### Academic Risk Map UX
- Student search and overview load first.
- The API returns grouped `riskChains` instead of one flattened curriculum graph.
- Teachers review risk summary cards before opening a chain.
- React Flow renders only the selected chain and auto-fits the viewport.
- The right panel updates the risk narrative from the selected chain context.

---

## 🏗️ Kiến trúc Hệ thống (System Architecture)

EduGuard AI được thiết kế theo chuẩn **Modular Monolith**, sẵn sàng tách ra thành Microservices khi cần mở rộng quy mô. Hệ thống áp dụng triệt để các Best Practices về bảo mật và vận hành của Enterprise.

- **Frontend:** React + Vite, TailwindCSS, Recharts (Data Visualization).
- **Backend:** Node.js, Express, Prisma ORM.
- **Database Layer:** PostgreSQL (Primary), Redis (Caching & Rate Limiting).
- **Security & Middleware Pipeline:** 
  - `Helmet` (Security Headers)
  - `CORS` (Cross-Origin Resource Sharing)
  - `RateLimiter` (Chống DDoS/Spam)
  - `Zod Validation` (Chống NoSQL/SQL Injection)
  - `JWT Auth` + `RBAC` (Phân quyền Admin/Advisor/Student)
  - `Audit Logger` (Nhật ký kiểm toán truy cập)

*(Xem chi tiết tài liệu kiến trúc tại thư mục [docs/](./docs/))*
- [SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md)
- [GRAPH_PIPELINE.md](./docs/GRAPH_PIPELINE.md)
- [DATA_FLOW.md](./docs/DATA_FLOW.md)

### Graph API Contract
`GET /api/v1/graph/student-risk/:mssv`

Returns:
- `student`: real overview metrics only
- `riskChains`: grouped dependency chains for drill-down analysis

This endpoint no longer returns a single full-curriculum graph payload for the UI to render at once.

---

## ⚡ Cài đặt & Khởi chạy (1-Click Docker Install)

Chúng tôi cung cấp môi trường Docker Compose hoàn chỉnh (PostgreSQL + Redis + Node Backend) để đảm bảo trải nghiệm cài đặt mượt mà nhất.

### Yêu cầu hệ thống
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- Node.js >= 18 (Nếu chạy local không dùng Docker)

### Cài đặt nhanh bằng Docker (Khuyên dùng)

1. **Clone Repository:**
   ```bash
   git clone https://github.com/ntrungz0704/eduguard-ai.git
   cd eduguard-ai
   ```

2. **Cấu hình môi trường:**
   ```bash
   cp .env.example .env
   # Bạn có thể giữ nguyên cấu hình mặc định trong .env.example
   ```

3. **Khởi chạy hệ thống (1-Click):**
   ```bash
   docker-compose up -d
   ```
   *Lệnh này sẽ tự động tải image PostgreSQL, Redis, build backend image, và khởi chạy toàn bộ services.*

4. **Khởi chạy Frontend (Giao diện):**
   Mở một terminal mới:
   ```bash
   cd client
   npm install
   npm run dev
   ```

Hệ thống giờ đây đang chạy tại:
- **Client (UI):** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`

---

## 📂 Cấu trúc mã nguồn (Project Structure)

```text
eduguard-ai/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components & Charts
│   │   ├── pages/              # Dashboard, Student Profile, Chat...
│   │   ├── lib/                # API clients (Axios + Interceptors)
│   │   └── store.js            # Zustand Global State Management
│   └── ...
├── server/                     # Express Backend
│   ├── src/
│   │   ├── modules/            # Domain-driven features (Auth, Students...)
│   │   ├── middlewares/        # Security, Validation, RBAC
│   │   ├── infrastructure/     # Prisma, Redis setup
│   │   ├── shared/             # Logging (Winston), Audit Trailing
│   │   └── app.js              # Express Gateway & Middlewares Pipeline
│   └── ...
├── docker-compose.yml          # Container orchestration (Postgres, Redis)
└── ARCHITECTURE_DIAGRAMS.md    # System Design Documentation
```

---

## 🔒 Security & Compliance

Dự án chú trọng đặc biệt đến vấn đề bảo vệ Dữ liệu Định danh Sinh viên (PII).
- Toàn bộ route nhạy cảm được bảo vệ bởi **RBAC (Role-Based Access Control)**.
- Mọi thao tác truy xuất điểm hoặc gắn cờ can thiệp đều được ghi vào **Audit Log**.
- Input validation nghiêm ngặt với **Zod**, loại bỏ hoàn toàn mã độc từ Request Body/Query/Params.

---

## 🤝 Tác giả (Team)
- **EduGuard-AI** (formerly Nexus Intelligence)
- SmartGen AI Challenge 2026 — Vòng Bán kết
- Vị trí: Backend Engineering / Frontend Data-Viz / AI Prompting

> *"Explain Risk. Support Students. Improve Outcomes."*
