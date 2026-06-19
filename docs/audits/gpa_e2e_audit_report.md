# GPA & End-to-End Consistency Audit

**STATUS:** ✅ PASS

## 1. GPA Calculation Audit
**File:** `server/src/utils/dataService.js` (`calculateFptGPA`)
- **Formula:** Accumulates exactly `totalScoreWeight` and `gpaCredits`, using the standard `sum(score * credits) / sum(credits)`.
- **Conditional Exclusions:** Physical Education (Thể chất), National Defense (Quốc phòng/GDQP), Internship (Thực tập), Vovinam, Politics (Chính trị), and specific orientation codes (PRO116, VIE103, etc.) are strictly checked via `isConditionalCourse()`.
- **Logic Verification:** These courses contribute to `totalAccumulatedCredits` (passing criteria) but are accurately excluded from `gpaCredits` and `totalScoreWeight`.
- **Precision:** `Math.floor(((totalScoreWeight / gpaCredits) + 1e-9) * 100) / 100` truncates to exactly 2 decimal places to match the official system without floating-point overflow. 

## 2. Ground Truth Validation Audit
**File:** `server/src/modules/evaluation/evaluation.service.js` (and `validation.js`)
- The system evaluates Prediction History against real Scores exactly when `score.status` transitions to `PASSED` or `FAILED`.
- The Mean Absolute Error (MAE) and Root Mean Square Error (RMSE) are correctly calculated mathematically based strictly on valid pairs of `(ActualScore, PredictedScore)`.
- Confidence intervals are strictly data-driven based on the number of matches and MAE deviation.

## 3. End-to-End Consistency
The architecture uses Prisma as a true "Single Source of Truth".
- **API & Import:** The file uploads (`/upload-predict`) write all scores directly into the `Score` Prisma table.
- **NLP & Chatbot:** Tools pull the real-time Snapshot of the student's DB records, preventing the Chatbot from answering out of an isolated memory.
- **Risk Engine:** Triggers live queries against the Prisma dataset.
- **No Rogue Caching:** The caching layer `cache.trainingData` only caches historical curriculum distributions, not individual student scores, ensuring any grade change is immediately reflected globally.

## FINDINGS
1. All GPA math aligns 100% with standard formulas.
2. The Database is consistently queried by all front-facing components, guaranteeing synchronization across Dashboards, Advisors, and Student Portals.

## VERDICT: PASS
The architecture enforces strict consistency and handles precision mathematically correct.
