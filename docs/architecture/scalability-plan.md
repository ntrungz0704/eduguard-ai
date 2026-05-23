# Scalability Plan

While the current Prototype handles isolated institutional cohorts locally, we plan for horizontal scalability as the dataset expands.

## Phase 1: Prototype (Current)
- **Database:** SQLite local file.
- **Backend:** Single Node.js thread.
- **Cache:** In-memory LRU.
- **Bottleneck:** File-system I/O locks under heavy writes.

## Phase 2: Enterprise Deployment
- **Database:** Migrate to PostgreSQL. Prisma manages this transition smoothly.
- **Backend:** Dockerized Node.js application deployed behind an Nginx Reverse Proxy or an AWS Application Load Balancer. PM2 Cluster mode can be utilized to span multiple CPU cores on bare-metal deployments.
- **Cache:** Introduce Redis to cache complex Graph traversals and Recharts payloads.
- **Task Queue:** Offload transcript ingestion and model retraining to BullMQ workers to prevent blocking the main HTTP loop.
- **Monitoring:** Implement Prometheus and Grafana for system telemetry (CPU, Memory, Req/Sec).

## Phase 3: Distributed Inference
If the Machine Learning model grows from a simple Sequential Network to a larger distributed ensemble, we will isolate the `predict()` function into a dedicated gRPC microservice, allowing independent auto-scaling of the ML tier vs the HTTP API tier.
