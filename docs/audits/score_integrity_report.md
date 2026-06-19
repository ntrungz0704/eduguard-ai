# Score Integrity Report

**STATUS:** ✅ PASS

## Overview
An exhaustive end-to-end trace was performed to verify if any score value could be corrupted, truncated, or altered from 10 to 1 throughout the system lifecycle.

## 1. Parser Analysis (Excel Upload -> JSON)
**File:** `server/src/utils/dataService.js` (`parseScore` function)
The parser receives the raw string/number from the Excel parser (`XLSX`).
- It correctly maps "Đạt", "Passed", "Miễn" to `1.0`.
- It uses `parseFloat(s)` for numerical scores.
- `parseFloat("10")` cleanly resolves to `10`. No `substring()` or regex extraction is applied to the score string.

## 2. DB Storage Analysis
**File:** `server/src/modules/api.js` (`syncUploadedData` function)
- The score value is extracted via `value = parseFloat(scoreObj)`.
- The Prisma schema `Score` model stores `value` as `Float?`. SQLite natively supports standard double-precision floating-point format, ensuring `10.0` is exactly stored as `10.0`.
- There is NO code invoking `parseInt()` or `Math.floor()` on the stored value before insertion.

## 3. Frontend Display Analysis
**Files:** `client/src/pages/Predict.jsx`, `StudentDashboard.jsx`, `StudentProfile.jsx`
- The frontend renders scores predominantly using `.toFixed(1)`. 
- An exact 10 point score is rendered as `10.0`.
- No array access `[0]` or `.substring(0, 1)` was found truncating `"10"` into `"1"`.

## FINDINGS
1. **NO 10-to-1 Truncation Issue Found:** The reported vulnerability ("10 điểm bị lưu thành 1 điểm") does not exist in the codebase. Values are handled via `parseFloat` exclusively.
2. **Safe Fallback:** Any unrecognized string is assigned `null` and marked as `STUDYING` rather than `0` or `1`, which is the correct fail-safe behavior.

## VERDICT: PASS
The data pipeline maintains 100% integrity from the uploaded Excel bytes into the SQLite Database and out to the JSON APIs.
