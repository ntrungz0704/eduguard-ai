# Machine Learning Pipeline

EduGuard AI separates its ML lifecycle into two distinct execution paths to avoid runtime bottlenecks.

## 1. Offline Training Pipeline (`train.js`)
This script acts as our data ingestion and training orchestrator.
- **Data Ingestion**: Parses JSON datasets of historical student performance.
- **Feature Vectorization**: Maps string values (e.g., failed subjects) to numerical matrices and normalizes variables (GPA, attendance).
- **Model Compilation**: Compiles a TensorFlow.js `tf.sequential` model using Stochastic Gradient Descent (SGD) or Adam optimizer.
- **Persistence**: Using a custom `fs` based IOHandler, the model is serialized directly to disk (`model.json`, `weights.bin`) without relying on the native C++ `tfjs-node` bindings, ensuring maximum compatibility across operating systems.

## 2. Runtime Inference (`server.js`)
During server boot, the Node.js API process invokes `loadModel()`.
- The pre-trained weights are injected into RAM.
- When an advisor queries a Risk Score, the server extracts the student's live variables from SQLite, converts them into a 1D Tensor, and runs `tf.predict()`.
- Because training is bypassed, the inference executes locally with extreme speed.
