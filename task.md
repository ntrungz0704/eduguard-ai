# Task List

- `[/]` Update Database Schema
  - `[ ]` Add `AuditLog` model to `schema.prisma`.
  - `[ ]` Update `InterventionRoadmap` status comment.
  - `[ ]` Run `npx prisma db push`.
- `[x]` Update Backend API (`api.js`)
  - `[x]` Update `GET /interventions-management` response structure and integrate `Evidence`/`Confidence`.
  - `[x]` Add `POST /interventions-management/change-status` API with Undo tracking and logging.
  - `[x]` Add `GET /interventions-management/audit-logs` API.
- `[x]` Update Frontend UI (`Interventions.jsx`)
  - `[x]` Implement new tabs: `HIGH_RISK`, `MONITORING`, `STABLE`, `CLOSED`.
  - `[x]` Replace warning jargon with academic terms.
  - `[x]` Implement `Human-in-the-loop` Roadmap generation flow (Draft -> Edit -> Send).
  - `[x]` Render `Confidence` and `Evidence` columns.
  - `[x]` Implement `Undo` UI action.
- `[x]` Verification
  - `[x]` Ensure backend compiles and Prisma schema is applied.
