# EduGuard AI

## Overview
EduGuard AI is a predictive academic analytics platform designed to help educational institutions monitor student performance, predict academic risks using Machine Learning, and provide actionable interventions. It shifts the paradigm from reactive grading to proactive academic intelligence.

## Features
- **Predictive Risk Analytics:** TensorFlow.js-powered inference to predict student failure risks.
- **Subject Dependency Graph:** Visualizes prerequisite chains and bottleneck subjects.
- **What-if Simulation:** Simulates how improving a specific subject impacts overall GPA and graduation likelihood.
- **Root Cause Analysis:** Explains the driving factors behind high academic risk (Explainable AI).
- **Smart Intervention:** Generates actionable advice for advisors to guide students.
- **Interactive Dashboard:** Built with Recharts and modern UX principles.

## Architecture
EduGuard AI follows a Modular Monolith architecture, preparing the ground for easy microservices extraction in the future.
- **Separation of Concerns:** Distinct layers for Routing, Controllers, Services, and Data Access.
- **AI Domain Isolation:** ML models, inference pipelines, and datasets are isolated in the `src/ai` domain.
- **Infrastructure Abstraction:** Database, logger, and caching mechanisms are abstracted.

## Tech Stack
- **Frontend:** React, Vanilla CSS, Recharts
- **Backend:** Node.js, Express
- **Database:** SQLite (Prisma ORM) - *Migrating to PostgreSQL*
- **AI & ML:** TensorFlow.js (Node), node-nlp
- **Infrastructure:** Docker, GitHub Actions (CI)

## Project Structure
```
eduguard-ai/
├── client/                 # React Frontend
├── server/
│   ├── src/
│   │   ├── app.js          # Express app setup (Middlewares, Routes)
│   │   ├── bootstrap/      # Boot sequence components
│   │   ├── config/         # Environment & Constants
│   │   ├── infrastructure/ # Database, Logger, Cache
│   │   ├── middlewares/    # Custom Express Middlewares
│   │   ├── shared/         # Errors, Utils, Validators
│   │   ├── ai/             # Core AI/ML Engine
│   │   └── modules/        # Business Domains (Auth, Students, Prediction, etc.)
│   ├── tests/              # Test Suites
│   ├── prisma/             # ORM Schema
│   └── server.js           # Entry Point (Listen & Graceful Shutdown)
├── docs/                   # ADRs & Architecture Diagrams
```

## Local Setup
1. Clone the repository.
2. Install dependencies for both client and server:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. Generate Prisma Client:
   ```bash
   cd server && npx prisma generate
   ```

## Environment Variables
Create a `.env` file in the root directory:
```
PORT=3000
DATABASE_URL="file:./dev.db"
NODE_ENV=development
JWT_SECRET=your_jwt_secret
```

## Running with Docker
```bash
docker-compose up --build
```

## API Documentation
(In progress - Swagger/OpenAPI integration planned)

## AI Pipeline
1. **Training (`src/ai/training`)**: Offline processing of historical academic data.
2. **Inference (`src/ai/inference`)**: Real-time risk prediction loaded into RAM on boot.
3. **NLP (`src/ai/nlp`)**: Rule-based intent routing for chatbot queries.

## Security Features
- Express Rate Limiting
- TraceID for Request Monitoring
- Envalid for strict environment variable validation
- Centralized Error Handling

## Benchmark Results
- **API Health Check Latency**: ~11ms
- **Inference Throughput**: Handled locally via TFJS without network overhead.
- *Note: True ML inference throughput benchmarking is pending load tests.*

## Known Limitations
- Currently uses SQLite (File-based), causing write-locks under high concurrency.
- Single-threaded Node.js event loop handles both HTTP requests and ML inference.

## Roadmap
- [ ] Priority 1: PostgreSQL Migration
- [ ] Priority 2: Redis Caching
- [ ] Priority 3: BullMQ Queue Integration
- [ ] Priority 4: Swagger/OpenAPI Implementation
- [ ] Priority 5: True Knowledge Graph Integration (Neo4j / Recursive SQL)
- [ ] Priority 6: Behavioral Analytics Engine

## Contributors
- Tran Nguyen Trung (AI Solution Architect & Engineer)

## License
MIT License
