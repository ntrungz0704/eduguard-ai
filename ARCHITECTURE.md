# EduGuard AI Architecture Deep Dive

## 1. The Strangler Fig Migration Pattern
EduGuard AI was originally built as a monolith prototype with a "God File" (`routes/api.js`). To prepare for enterprise-level scaling, we implemented the Strangler Fig pattern.
- **Core (`server/src/`)**: A Domain-Driven, strictly modular system.

## 2. Request Flow
1. **API Gateway (`app.js`)**: Receives the request and attaches a `TraceID` via the tracing middleware.
2. **Router (`modules/*/routes.js`)**: Maps endpoints to controllers.
3. **Validator (`middlewares/validation/`)**: Uses `Zod` to strictly validate inputs. Invalid requests are bounced here before consuming CPU.
4. **Controller (`modules/*/controller.js`)**: Extracts params and calls the appropriate service.
5. **Service (`modules/*/service.js`)**: Executes business logic and orchestrates AI/Database calls.
6. **AI Engine (`src/ai/`)**: Computes predictions or inferences locally using cached JSON models or NLP logic.

## 3. Explainable AI (XAI) Pipeline (HK-Pearson V2)
- **Problem**: Standard neural networks act as black boxes, making it impossible to tell students *why* they were warned.
- **Solution**: We built a Hybrid Knowledge-Enhanced Linear Regression model.
- **Outlier Rejection**: Using IQR (Interquartile Range) to discard statistical noise (e.g., anomalies like 0 scores).
- **SD-Stretching**: Fixes the attenuation bias in linear models by stretching predictions to match the true standard deviation of historical scores.
- **Knowledge Graph Propagation**: If a student fails a core subject (e.g., Math), the penalty ripples down to dependent subjects (e.g., Physics).

## 4. Why Offline Local AI?
We deliberately avoid relying on external AI APIs (like OpenAI) for core predictions because:
- **FERPA Compliance**: Student academic records are highly sensitive. Transmitting them to third-party APIs violates data privacy regulations.
- **Latency**: Local models perform sub-millisecond regressions compared to network round-trips.
- **Resilience**: The platform operates in offline/intranet environments seamlessly.
