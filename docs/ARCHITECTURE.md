# Kiến trúc Hệ thống EduGuard AI (Decision Support System)

Tài liệu này mô tả chi tiết kiến trúc của **EduGuard AI** - Hệ thống Cố vấn Học vụ Thông minh được thiết kế theo chuẩn Enterprise Decision Support System (DSS).

## 1. System Architecture Diagram

Sơ đồ dưới đây mô tả luồng dữ liệu (Data Flow) từ lúc người dùng thao tác trên giao diện cho đến khi hệ thống AI đưa ra quyết định.

```mermaid
graph TD
    %% Frontend Layer
    subgraph "Presentation Layer"
        UI[React Dashboard]
        Dash[Visual Analytics Charts]
        UI --> Dash
    end

    %% Backend Layer
    subgraph "Node.js API & Orchestrator"
        API[Express Controllers]
        UI -- HTTP REST --> API
        
        Orchestrator[aiDecisionEngine.js]
        API --> Orchestrator
        
        %% NLP Layer
        subgraph "NLP Layer"
            Router[intentRouter.js]
            Entity[entityExtractor.js]
        end
        Orchestrator <--> Router
        Router <--> Entity
    end

    %% AI Engines Layer
    subgraph "Modular AI Engines (The DSS Core)"
        Risk[riskEngine.js\n(Base Risk Calculation)]
        XAI[xaiEngine.js\n(Explainable AI)]
        Priority[priorityEngine.js\n(Priority Matrix)]
        Recommend[recommendationEngine.js\n(Prescriptive Actions)]
        Forecast[forecastEngine.js\n(Trend Forecasting)]
        Scenario[scenarioEngine.js\n(What-if Analysis)]
        Audit[auditEngine.js\n(System Logging)]
        
        Orchestrator --> Risk
        Orchestrator --> XAI
        Orchestrator --> Priority
        Orchestrator --> Recommend
        Orchestrator --> Forecast
        Orchestrator --> Scenario
        Orchestrator --> Audit
    end

    %% Configuration & Data Layer
    subgraph "Configuration & Persistence Layer"
        Config[riskRules.js\n(Rule Registry)]
        Repo[studentRepository.js\n(Repository Pattern)]
        DB[(PostgreSQL / SQLite\nPrisma ORM)]
        
        Risk -.-> Config
        Recommend -.-> Config
        
        Orchestrator --> Repo
        Repo --> DB
    end

    %% Data Flow Styling
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef orchestrator fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef engine fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef database fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff;

    class UI,Dash frontend;
    class API,Orchestrator,Router,Entity orchestrator;
    class Risk,XAI,Priority,Recommend,Forecast,Scenario,Audit engine;
    class Config,Repo,DB database;
```

## 2. Giải thích Luồng Xử Lý (Decision Support Flow)

Khi một giảng viên đặt câu hỏi: *"Sinh viên PS47261 có nguy cơ rớt môn không?"*

1. **User Input:** React Dashboard gửi câu hỏi tới Node.js API.
2. **NLP Routing:** `intentRouter` phân tích ngôn ngữ tự nhiên, xác định Intent là `STUDENT_ANALYTICS_INTENT` và Entity là `PS47261`.
3. **Data Retrieval:** Nhạc trưởng `aiDecisionEngine` yêu cầu `studentRepository` lấy dữ liệu sinh viên. Repository chọc vào Prisma Database.
4. **Analytics (Diagnostic):** `aiDecisionEngine` đẩy dữ liệu vào `riskEngine` để tính điểm rủi ro gốc dựa trên `riskRules.js`.
5. **Explanation (XAI):** `xaiEngine` dịch điểm rủi ro thành nguyên nhân bằng chữ.
6. **Prescriptive (Actionable):** `recommendationEngine` tạo danh sách hành động hỗ trợ (HIGH, MEDIUM, LOW).
7. **Auditing:** `auditEngine` lưu vết toàn bộ quá trình truy vấn.
8. **Response:** Dữ liệu được trả về React hiển thị lên biểu đồ.

## 3. Tại sao lại dùng Micro-Engine Pattern?
- **Khả năng Bảo trì:** Mỗi file Engine chỉ làm đúng 1 nhiệm vụ (Single Responsibility Principle).
- **Tránh Hardcode:** Lõi tính toán `riskEngine` không chứa các con số cố định. Mọi trọng số được tải lên từ Rule Registry (`riskRules.js`).
- **Bất khả tri cơ sở dữ liệu (Database Agnostic):** AI Engine hoàn toàn mù với Database nhờ tầng trung gian `studentRepository`. Dễ dàng chuyển đổi từ SQLite sang PostgreSQL.
