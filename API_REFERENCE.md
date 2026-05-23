# EduGuard AI: API Reference (v1)

> **Note**: This is an interim document. An OpenAPI (Swagger) specification will replace this in Phase 3.

## Base URL
`/api/v1`

---

## 1. Prediction Module

### Predict Target Subject Scores
`GET /prediction/:subject`

**Description:**
Analyzes the uploaded student transcripts and predicts their final score for a target subject based on prerequisite performance.

**Path Parameters:**
- `subject` (string, required): The target subject ID or name (e.g., `Physics`).

**Response (200 OK):**
```json
{
  "status": "success",
  "subject": "Physics",
  "predictions": [
    {
      "id": "SE123456",
      "predicted": 7.8,
      "risk": "low"
    },
    {
      "id": "SE654321",
      "predicted": 4.1,
      "risk": "high",
      "warning": "Prerequisite Math score is too low."
    }
  ]
}
```

---

## 2. Legacy Endpoints (Pending Migration)

### Chatbot / NLP
`POST /legacy/api/chat`
*(Being migrated to `src/modules/chatbot/`)*

### File Upload & Analytics
`POST /legacy/api/upload-predict`
*(Being decoupled into dedicated upload service and analytics module)*
