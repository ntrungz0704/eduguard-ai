# Graph Processing Pipeline

## Overview
The Academic Risk Map now behaves as a guided decision-support workflow instead of a full technical graph dump.

Request flow:
1. Teacher searches and selects a student.
2. `GET /api/v1/graph/student-risk/:mssv` returns a student overview plus grouped `riskChains`.
3. The UI shows summary cards first.
4. React Flow renders only the selected chain.

## Data Sources
- Neo4j stores prerequisite edges with `PREREQUISITE_FOR`.
- `training_data.json` stores curriculum progression and cached student score maps.
- SQLite stores the live student profile, completed scores, predictions, and interventions.
- `data/curriculum.json` is used to map courses to semester placement.

## Backend Generation Flow
Implemented in `server/src/modules/graph/service.js`.

1. Load student data from SQLite when available.
2. Fallback to cached training data if the student is not fully present in SQLite.
3. Read prerequisite edges from Neo4j.
4. Merge score evidence from:
   - database score rows
   - training-data score maps
5. Normalize course names and code aliases so graph nodes can resolve real score values.
6. Mark node status:
   - `Failed` when score `< 5`
   - `Warning` when `5 <= score < 6.5`
   - `Passed` when score `>= 6.5`
   - `Not Started` when no real score exists
7. Build risky edges only from prerequisite nodes that are `Failed`, `Warning`, or `Not Started`.
8. Expand risky paths into grouped `riskChains`.

## API Contract
`GET /api/v1/graph/student-risk/:mssv`

Response shape:

```json
{
  "student": {
    "mssv": "PS47261",
    "name": "Sinh vien PS47261",
    "classCode": "WD18301",
    "gpa": 8.7,
    "attendance": null,
    "totalFailedSubjects": 0,
    "currentSemester": 6,
    "riskScore": null,
    "riskLevel": "MEDIUM",
    "riskChainCount": 4,
    "interventionCount": 0
  },
  "riskChains": [
    {
      "id": "CHAIN_1",
      "title": "JavaScript Pathway Risk",
      "riskLevel": "MEDIUM",
      "summary": "WEB206 blocks progression toward WEB208 across 1 dependent course(s).",
      "affectedCount": 1,
      "rootCause": "WEB206",
      "blockedPath": "WEB206 -> WEB208",
      "nodes": [],
      "edges": [],
      "explanation": {
        "why": "",
        "impact": "",
        "recovery": "",
        "interventions": []
      }
    }
  ]
}
```

## Frontend Rendering Architecture
Implemented in `client/src/pages/AcademicRiskMap.jsx`.

1. Left panel renders:
   - student search
   - student overview
   - risk chain cards
2. Center panel:
   - remains empty until a chain is selected
   - renders only the selected chain graph
   - calls `fitView()` after every chain change
3. Right panel:
   - renders the selected chain narrative
   - updates when the selected chain changes
   - optionally highlights the currently selected node

## Performance Rules
- The graph is hidden until a chain is selected.
- Each chain is rendered independently.
- Node components are memoized through React Flow `nodeTypes`.
- The service returns chain-sized subgraphs rather than the entire curriculum DAG.
