# EduGuard AI — Architecture Diagrams

This document contains visual representations of the system architecture, data flows, and security models for EduGuard AI. These diagrams are designed for technical pitches and architectural reviews.

## 1. System Architecture Diagram

Provides a high-level overview of the entire EduGuard AI ecosystem, illustrating the separation of concerns between the client, API gateway, core services, AI engine, and infrastructure.

```mermaid
graph TD
    %% User Interfaces
    subgraph Client ["Client Interface (React + Vite)"]
        Dashboard["Advisor Dashboard UI"]
        ChatUI["NLP Chatbot Interface"]
        ApiClient["Axios API Client\n(w/ Retry & Auth Interceptors)"]
        Dashboard --> ApiClient
        ChatUI --> ApiClient
    end

    %% API Gateway & Middleware
    subgraph Gateway ["Express API Gateway"]
        RateLimit["Rate Limiting"]
        Helmet["Helmet Security"]
        Tracing["Request Tracing"]
        Validation["Zod Validation Layer"]
        RBAC["RBAC Middleware"]
        AuditLog["Audit Logger"]
        
        RateLimit --> Helmet --> Tracing --> Validation --> RBAC --> AuditLog
    end

    %% Core Business Services
    subgraph Services ["Domain Services"]
        AuthModule["Auth & JWT Service"]
        StudentModule["Student Profile Service"]
        PredictionModule["Prediction Route Layer"]
        CommModule["Communication Service\n(Email/SMS)"]
    end

    %% AI Engine & Core Logic
    subgraph AIEngine ["AI & Analytics Engine"]
        DSS["Decision Support System\n(Pearson Correlation, IQR)"]
        NLP["Local NLP Chatbot Engine\n(Intent Routing, NER)"]
        RiskEngine["Risk Classification\n(Critical, High, Medium, Low)"]
        
        DSS <--> RiskEngine
    end

    %% Data Infrastructure
    subgraph Infra ["Infrastructure Layer"]
        Prisma["Prisma ORM"]
        Postgres[(PostgreSQL)]
        Redis[(Redis Cache)]
        Winston["Winston Logger"]
    end

    %% Connections
    ApiClient -->|HTTP REST| Gateway
    AuditLog --> AuthModule
    AuditLog --> StudentModule
    AuditLog --> PredictionModule
    AuditLog --> CommModule
    
    StudentModule --> Prisma
    AuthModule --> Prisma
    PredictionModule --> DSS
    PredictionModule --> NLP
    
    DSS --> Prisma
    NLP --> Prisma
    
    Prisma --> Postgres
    Prisma -.-> Redis
    
    Services -.-> Winston
    AIEngine -.-> Winston

    %% Styling
    classDef ui fill:#4F46E5,stroke:#312E81,stroke-width:2px,color:#fff;
    classDef gateway fill:#059669,stroke:#064E3B,stroke-width:2px,color:#fff;
    classDef core fill:#EA580C,stroke:#7C2D12,stroke-width:2px,color:#fff;
    classDef data fill:#2563EB,stroke:#1E3A8A,stroke-width:2px,color:#fff;
    
    class Client,Dashboard,ChatUI,ApiClient ui;
    class Gateway,RateLimit,Helmet,Tracing,Validation,RBAC,AuditLog gateway;
    class AIEngine,DSS,NLP,RiskEngine,Services,AuthModule,StudentModule,PredictionModule,CommModule core;
    class Infra,Prisma,Postgres,Redis data;
```

## 2. Data Flow Diagram (Prediction & Analytics)

Illustrates how academic data flows into the system and is processed by the AI engine to generate risk profiles.

```mermaid
sequenceDiagram
    participant C as Advisor Dashboard
    participant API as Prediction API
    participant DSS as Decision Support System
    participant DB as PostgreSQL (Prisma)
    
    C->>API: GET /api/v1/students/:mssv/risk
    activate API
    API->>DSS: Request Risk Evaluation
    activate DSS
    
    DSS->>DB: Fetch Academic History (Scores, Courses)
    activate DB
    DB-->>DSS: Return History Data
    deactivate DB
    
    DSS->>DSS: Filter & Pre-process Data (Outlier Detection)
    DSS->>DSS: Calculate Target Feature (Current Term)
    DSS->>DSS: Apply Pearson Correlation against Historical Model
    DSS->>DSS: Generate Risk Score (0-100)
    DSS->>DSS: Classify Risk Level (CRITICAL, HIGH, MEDIUM, LOW)
    
    DSS->>DB: Persist Prediction Result
    
    DSS-->>API: Return Risk Profile & Explainability Factors
    deactivate DSS
    API-->>C: Display Explainable Risk Panel
    deactivate API
```

## 3. NLP Chatbot Flow (Zero-API Cost Local NLP)

Highlights the efficient, local Natural Language Processing pipeline that doesn't rely on expensive external APIs (like OpenAI) for basic intents.

```mermaid
graph TD
    User["User Input"] --> Tokenizer["String Tokenization\n& Normalization"]
    Tokenizer --> IntentRouter{"Intent Router"}
    
    IntentRouter -->|Matches Regex/Keywords| IntentA["Follow-up Intent\n(e.g., 'Tại sao rủi ro?')"]
    IntentRouter -->|Matches Context| IntentB["Class Analytics Intent\n(e.g., 'Tình hình lớp IT183?')"]
    IntentRouter -->|Specific Entity| IntentC["Student Lookup Intent\n(e.g., 'Xem điểm của PS47261')"]
    IntentRouter -->|No Match| Fallback["Fallback / Generative Intent"]
    
    IntentA --> ContextMemory["Session Context Memory"]
    IntentB --> ContextMemory
    IntentC --> ContextMemory
    
    ContextMemory --> ActionEngine["Action Execution Engine"]
    ActionEngine --> DB[(PostgreSQL)]
    
    ActionEngine --> ResponseGen["Response Generator"]
    
    Fallback --> LLM["External LLM Fallback\n(Gemini/Groq)"]
    LLM --> ResponseGen
    
    ResponseGen --> Output["Chat UI Output"]

    %% Styling
    classDef process fill:#F59E0B,stroke:#78350F,stroke-width:2px,color:#fff;
    classDef decision fill:#8B5CF6,stroke:#4C1D95,stroke-width:2px,color:#fff;
    classDef storage fill:#3B82F6,stroke:#1E3A8A,stroke-width:2px,color:#fff;
    
    class Tokenizer,ActionEngine,ResponseGen,LLM process;
    class IntentRouter decision;
    class ContextMemory,DB storage;
```

## 4. RBAC & Request Lifecycle

Shows the journey of an HTTP request through the Enterprise middleware stack.

```mermaid
sequenceDiagram
    participant Client
    participant Limit as Rate Limiter
    participant Sec as Security (Helmet/CORS)
    participant Auth as JWT Auth
    participant RBAC as Role Guard
    participant Zod as Validation
    participant Ctrl as Controller
    participant Audit as Audit Logger
    
    Client->>Limit: HTTP Request
    Limit->>Limit: Check Quota
    
    alt Rate Limit Exceeded
        Limit-->>Client: 429 Too Many Requests
    else Within Quota
        Limit->>Sec: Pass Request
        Sec->>Auth: Verify Headers
        
        Auth->>Auth: Verify JWT Signature
        alt Invalid JWT
            Auth-->>Client: 401 Unauthorized
        else Valid JWT
            Auth->>RBAC: Attach req.user
            RBAC->>RBAC: Check req.user.role vs Required Role
            
            alt Role Denied
                RBAC-->>Client: 403 Forbidden
            else Role Approved
                RBAC->>Zod: Pass Request
                Zod->>Zod: Validate req.body/params/query
                
                alt Validation Failed
                    Zod-->>Client: 400 Bad Request (Field Details)
                else Validation Passed
                    Zod->>Ctrl: Execute Business Logic
                    Ctrl-->>Client: 200 OK
                    
                    %% Audit Log happens AFTER response is sent
                    Ctrl-xAudit: Response Finished Event
                    Audit->>Audit: Write Structured Log (Actor, Action, Target)
                end
            end
        end
    end
