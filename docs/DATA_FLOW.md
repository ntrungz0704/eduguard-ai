# Data Flow and Validation

## Single Source Rules
- SQLite is the source of truth for live student profile data, completed scores, predictions, and interventions.
- Neo4j is the source of truth for prerequisite relationships.
- `training_data.json` is a fallback source for progression data when SQLite does not yet contain the needed course evidence.
- `curriculum.json` is the source of truth for semester placement in the risk graph.

## Academic Risk Map Flow
1. Frontend calls `GET /api/v1/graph/student-risk/:mssv`.
2. Backend loads the student profile from SQLite.
3. Backend falls back to `training_data.json` when the student or some score evidence is missing.
4. Backend pulls prerequisite edges from Neo4j.
5. Backend resolves course aliases and names so score data maps onto graph nodes correctly.
6. Backend returns:
   - real student overview metrics
   - grouped `riskChains`
7. Frontend renders summary cards first and waits for a teacher click before mounting the graph.

## No Fake Data Policy
- No hardcoded risk chains are allowed.
- No placeholder KPI counts are allowed.
- `riskScore`, `attendance`, and similar fields must return `null` when real data does not exist.
- If a student has no dependency chains, the UI must render an empty state instead of inventing values.

## Validation Rules
- Missing or blank MSSV returns a backend error immediately.
- Unknown students return a backend error immediately.
- Missing score values are interpreted as `Not Started`, not as a fabricated pass/fail score.
- Dependency graphs must be derived from Neo4j edges only.

## Rendering Rules
- Never render the entire curriculum graph by default.
- Render only one selected risk chain at a time.
- `fitView()` must run whenever a new chain is selected.
- Graph nodes must expose real:
   - course code
   - course name
   - score
   - semester
   - status
