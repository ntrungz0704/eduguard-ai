# ADR 002: Use SQLite for Prototype & Early Validation

## Status
Accepted

## Context
We need a relational database to store Student profiles, transcripts, attendance, and Chat sessions. While PostgreSQL is the industry standard for production, it requires spinning up Docker containers or external cloud databases for local development, which increases friction for initial deployment and prototyping.

## Decision
We elected to use **SQLite** accessed via the Prisma ORM for the initial Prototype phase.

## Consequences
**Positive:**
- Zero setup. The database is just a local `dev.db` file.
- Extremely fast read operations for single-user workloads.
- Highly portable.

**Negative:**
- SQLite uses file-level locking during writes. If multiple concurrent requests attempt to mutate data (e.g., thousands of professors inputting grades simultaneously), it will encounter `SQLITE_BUSY` errors.
- Lack of advanced JSON querying compared to PostgreSQL.

**Mitigation:**
Because we use Prisma ORM, our application code is largely database-agnostic. When the platform is ready for horizontal scaling, we will only need to change the `provider = "sqlite"` to `"postgresql"` in `schema.prisma` and run a migration.
