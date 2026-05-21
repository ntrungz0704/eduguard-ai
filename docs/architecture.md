# EduGuard AI - Architecture & Diagrams

Tài liệu này cung cấp cái nhìn tổng quan về Kiến trúc hệ thống, Luồng xử lý AI (AI Pipeline), Luồng ra quyết định (AI Decision Flow) và Mô hình Triển khai (Deployment) của Nền tảng EduGuard AI.

## 1. System Architecture Diagram

Cấu trúc tổng thể của hệ thống tuân theo chuẩn Enterprise, tách bạch Frontend, Backend, AI Workers và Database.

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend [Presentation Layer - Vercel / Netlify]
        UI[React.js SPA]
        Tailwind[Tailwind CSS UI]
        State[Zustand State Manager]
        UI --> State
        State --> Tailwind
    end

    %% Backend Layer
    subgraph Backend [Application Layer - Render / Docker]
        API[Node.js Express API]
        Auth[JWT Authentication]
        Router[Intent Router]
        API --> Auth
        API --> Router
    end

    %% Local AI Pipeline
    subgraph LocalAI [AI Intelligence Layer]
        NLP[Node-NLP Intent Classifier]
        Predictor[Predictive ML Engine]
        XAI[Explainable AI Module]
        NLP --> Router
        Predictor --> XAI
    end

    %% Data Layer
    subgraph DatabaseLayer [Data Persistence]
        SQLite[(SQLite / PostgreSQL)]
        Prisma[Prisma ORM]
        Prisma --> SQLite
    end

    %% Connections
    Frontend -- HTTP/REST --> API
    Router -- Extract Intent --> NLP
    Router -- Query Data --> Prisma
    API -- Call ML --> Predictor
    XAI -- Results --> Prisma
```

## 2. AI Decision Flow Diagram (Cốt lõi Trí tuệ Nhân tạo)

Mô tả cách dữ liệu thô biến thành một quyết định hành động thông qua hệ thống Học máy, thể hiện tính "AI Systems Engineering" đích thực.

```mermaid
graph TD
    A[Student Historical Score] --> C(Feature Engineering)
    B[Attendance Records] --> C
    C --> D{Pearson Correlation Analysis}
    D -- Môn tiên quyết tương quan mạnh --> E[Linear Regression Model]
    E --> EVAL{Model Evaluation Layer}
    EVAL -- RMSE / Precision / Recall --> F[Risk Classification Engine]
    F -- Dự báo: Yếu kém --> G[High Risk Flag]
    F -- Dự báo: Trung bình --> H[Medium Risk Flag]
    F -- Dự báo: Tốt --> I[Low Risk Flag]
    G --> J(Explainable AI Module)
    H --> J
    I --> J
    J --> K[Academic Dashboard + XAI Reason]
```

## 3. Deployment Diagram (Enterprise Scalability)

Mô hình triển khai nhắm tới mở rộng hệ thống (Scalability) với Worker độc lập và Hàng đợi (Queue), không bị sập khi phải Training hàng nghìn dữ liệu sinh viên.

```mermaid
graph TD
    User((Giảng viên)) -->|HTTPS| Frontend[Vercel: UI / SPA]
    Frontend -->|REST API| LoadBalancer[Nginx Load Balancer]
    LoadBalancer --> NodeAPI[Node API: Orchestration Layer]
    NodeAPI -->|Push Task| RedisQueue[(Redis: Message Broker)]
    RedisQueue -->|Pop Task| AIWorker[AI Worker: Async Prediction Jobs]
    
    NodeAPI --> DB[(PostgreSQL: Persistent Storage)]
    AIWorker -->|Write Predictions| DB
    
    subgraph Observability [Monitoring & Governance]
        Prometheus[Prometheus Metrics]
        Grafana[Grafana Dashboard]
    end
    
    NodeAPI -.-> Prometheus
    AIWorker -.-> Prometheus
```

## 4. AI Pipeline Sequence Diagram (Local NLP)

Luồng xử lý khi người dùng trò chuyện với hệ thống Chatbot. Mọi xử lý đều được thực hiện 100% Offline (Local AI) để đảm bảo Quyền riêng tư Dữ liệu (Privacy).

```mermaid
sequenceDiagram
    autonumber
    participant U as Giảng viên (User)
    participant UI as React UI (Frontend)
    participant API as Express (Backend)
    participant NLP as Local NLP Engine (node-nlp)
    participant Router as Intent Router (Logic)
    participant DB as Prisma (Database)

    U->>UI: "Khóa này lớp WD18301 có ai nguy cơ rớt không?"
    UI->>API: POST /api/chat { message }
    API->>NLP: Xử lý ngôn ngữ tự nhiên (Tokenize, Stemming)
    NLP-->>API: Trả về Intent: "student.query.high_risk"
    API->>Router: Ánh xạ Intent vào Data Query
    Router->>DB: SELECT * FROM Prediction WHERE risk='HIGH'
    DB-->>Router: Trả về 5 sinh viên (kèm XAI Reasons)
    Router->>API: Format kết quả (Natural Language)
    API-->>UI: "Lớp này có 5 em rủi ro cao, đặc biệt là PS12345 do điểm C thấp."
    UI-->>U: Hiển thị kết quả & Đề xuất Can thiệp
```

## 5. Database ERD (Entity-Relationship Diagram)

Sơ đồ thực thể liên kết (ERD) mô tả cách dữ liệu được tổ chức để phục vụ Predictive Academic Analytics.

```mermaid
erDiagram
    USER ||--o{ INTERVENTION : "Thực hiện"
    USER {
        string id PK
        string email
        string name
        string role "ADMIN / ADVISOR"
    }

    STUDENT ||--o{ SCORE : "Sở hữu"
    STUDENT ||--o{ PREDICTION : "Có"
    STUDENT ||--o{ INTERVENTION : "Nhận"
    STUDENT {
        string mssv PK
        string name
        string classCode
    }

    COURSE ||--o{ SCORE : "Chứa"
    COURSE ||--o{ PREDICTION : "Gắn với"
    COURSE {
        string id PK
        string name
        int credits
        string prerequisites
    }

    SCORE {
        int id PK
        string mssv FK
        string courseId FK
        float value
        float attendance "Feature Engineering"
        string semester
        string status "PASSED / FAILED"
    }

    PREDICTION {
        int id PK
        string mssv FK
        string courseId FK
        float predictedScore
        string risk "HIGH / LOW"
        float confidence "Độ tin cậy %"
        string explanation "Explainable AI Text"
        json reasons "Chi tiết XAI Array"
    }

    INTERVENTION {
        int id PK
        string mssv FK
        string courseId FK
        string advisorId FK
        string action "Ghi chú can thiệp"
        string status "PENDING / RESOLVED"
    }
```
