# System Overview

EduGuard AI is a Production-oriented Educational Analytics System. It relies on a decoupled, stateless architecture designed for eventual containerized microservice deployment.

## Components
1. **Frontend**: React SPA (Single Page Application) powered by Vite, handling rich Recharts visualizations and real-time chat interactions.
2. **API Gateway**: Node.js/Express handling REST endpoints, JWT authentication, and request routing.
3. **NLP Router**: Uses `node-nlp` to parse raw Vietnamese utterances into deterministic intents.
4. **Expert System**: Traverses predefined Subject Dependency Graphs (Knowledge Graphs) to identify cascade risks when a student fails a foundation course.
5. **ML Predictor**: A TensorFlow.js Neural Network that executes locally to assign a quantitative Risk Score.
6. **Database**: SQLite (managed by Prisma) acting as the single source of truth for student transcripts, attendance, and system logs.

## Design Philosophy
We favor **Local-first Inference** and **Determinism** over unpredictable third-party API dependencies. The system explicitly separates statistical analytics, rule-based expert logic, and machine learning into distinct boundaries.
