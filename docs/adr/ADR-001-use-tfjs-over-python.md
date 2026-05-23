# ADR 001: Use TensorFlow.js over Python

## Status
Accepted

## Context
We need a Machine Learning predictor for calculating student risk scores. The traditional approach is to build a Python microservice (Flask/FastAPI) using PyTorch or Scikit-Learn. However, introducing Python adds significant infrastructure complexity: multi-language CI/CD, IPC overhead, and deployment friction on lightweight environments.

## Decision
We chose to use `@tensorflow/tfjs` operating natively within the Node.js runtime. 

## Consequences
**Positive:**
- Monoglot architecture (JavaScript/TypeScript everywhere).
- Zero network I/O latency between the Node.js backend and the ML predictor.
- Simpler deployment story (single Docker container).

**Negative:**
- Pure JS execution (without `tfjs-node` native bindings) is significantly slower at training. 
- Ecosystem for data engineering (Pandas, Numpy) is virtually non-existent in JS, requiring manual matrix manipulation.

**Mitigation:**
We strictly separated the pipeline: Model training occurs offline via a scheduled job. The runtime server only performs inference (`loadModel()`), which executes in sub-10ms latency even in JS.
