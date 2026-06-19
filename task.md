# Task List

- `[x]` Update `import.controller.js`
  - Fix `calculateScore` to preserve `null` and avoid fake 0 or 1s incorrectly.
  - Fix `status` determination so missing scores correctly map to `STUDYING` or `NOT_STARTED` without triggering `FAILED`.
- `[x]` Update `analyticsService.js`
  - Refine `getTopBottlenecks` to strictly filter out conditional courses (`PRO116`, etc.) and only count `status === 'FAILED'` and `score < 5.0` and `score !== null`.
- `[x]` Update `api.js` (Evaluation Engine)
  - In `/evaluate-model`, skip any scores that are `null` or missing ground truth. Only calculate errors and LOOCV for valid existing scores.
- `[x]` Update `dssReportEngine.js` (Career Engine)
  - Modify `careerImpactAnalysis` to compute `possessionState` as `POSSESSED`, `FAILED`, or `UNKNOWN`.
- `[x]` Update `StudentProfile.jsx`
  - Update the UI to render `POSSESSED` as `✓`, `FAILED` as `✗`, and `UNKNOWN` as `?`.
- `[/]` Review and Verify changes.
- [ ] Build client, commit, and push.
