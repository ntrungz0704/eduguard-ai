# Career Match Hallucination Audit

**STATUS:** ✅ PASS (with minor display caveats)

## 1. Architecture Analysis
The Career Engine (`server/src/modules/advisor/career-engine.js`) evaluates student readiness using an exclusively deterministic calculation.
1. The engine checks the required skills for the target career.
2. It maps the skills back to standard courses in the curriculum using `coursesDb`.
3. The match percentage is calculated strictly based on Evidence:
   - **Academic Score (40%):** Derived from passed prerequisite courses.
   - **Industry Score (45%):** Derived from acquired skills (via passed courses or verified manual skills).
   - **Portfolio Score (15%):** Derived from matching technologies in projects.

## 2. Evidence Chain Verification
The `Course → CLO (Skills) → Career` constraint is actively enforced.
- **Lines 159-165 (`career-engine.js`):** The system strictly adds skills to the `studentAcquiredSkills` Set ONLY IF the course status is explicitly `PASSED`.
- **Line 282:** The `readinessScore` is calculated using weighted metrics (no external AI logic is injected).
- **Line 286:** Behavior analytics are used to apply a penalty (deduction), but cannot artificially boost the score.

## 3. Hallucination Points
- **LLM Usage:** External LLMs (like OpenAI/Gemini) are **NOT** used to generate the percentage score. The LLM only receives the calculated integer score from the engine and explains it. Thus, the numerical value is purely deterministic.
- **Insufficient Data Check:** The engine successfully computes an `insufficientEvidence` flag if the student has 0 completed courses. 

## 4. FINDINGS
1. **Fabrication is Blocked:** The system cannot invent a "92% match" if the student failed the prerequisite courses, because failed courses grant zero Academic and Industry weight.
2. **Insufficient Data Enforcement:** `careerService.js` (Lines 20-38) sets `score = 0` and sets `insufficientEvidence = true` when there is no data. 
   - *Note for Frontend:* The frontend properly checks `insufficientEvidence` to display warnings, but could be stricter in masking the 0% as "N/A".

## VERDICT: PASS
The engine strictly relies on the exact mathematical mapping of Course → Skills. No AI "guessing" is involved in computing the suitability percentage.
