# EduGuard AI - Enterprise System Architecture

## Overview
EduGuard AI is a proactive Academic Decision Support System (DSS). It analyzes student grades, builds academic dependency graphs, predicts failure risks, and provides actionable intervention suggestions for academic advisors.

## High-Level Architecture
EduGuard AI utilizes a modular monolithic architecture, combining an Express.js/Node.js backend with a React/Vite frontend. It leverages a graph database (Neo4j) for dependency tracking and SQLite (via Prisma) for relational data persistence.

### 1. Frontend (Client)
- **Framework:** React + Vite
- **State Management:** Zustand
- **Visualization Engine:** React Flow (`@xyflow/react`) for Academic Risk Maps, Recharts for KPIs.
- **Routing:** React Router DOM

### 2. Backend (Server)
- **Framework:** Express.js
- **ORM:** Prisma
- **Databases:**
  - **SQLite (`dev.db`):** Stores user sessions, student profiles, grade updates, and intervention logs.
  - **Neo4j:** Stores the curriculum dependency graph (Courses and Prerequisite edges).
- **In-Memory Cache:** Stores parsed training datasets (`training_data.json`) to minimize disk I/O and support instant ML recalibrations.

### 3. AI & Analytics Core (`src/ai/`)
- **Regression Engine:** `regression.js` calculates FPT weighted GPAs, filters outliers via IQR, and runs linear regression for grade predictions.
- **Decision Support System (DSS):** `dssEngine.js` aggregates risk factors and generates actionable intervention suggestions.
- **NLP Engine (Chatbot):** `node-nlp` processes localized Vietnamese intents for the AI Chat interface.
- **LLM Integrations:** Connects to Gemini/Groq for fallback conversational capabilities (`aiService.js`).

## Key Modules
- **Graph Module (`src/modules/graph/`):** Queries Neo4j to build personalized risk paths by overlaying a student's current grades onto the curriculum graph.
- **Student Module (`src/modules/students/`):** Manages CRUD operations for student profiles and grades.
- **Intervention System (`/interventions`):** Tracks mentor assignments and alerts sent to students based on AI suggestions.
