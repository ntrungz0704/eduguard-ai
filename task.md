# Task List

- `[x]` Update `schema.prisma`
  - Add `TranscriptHistory` model.
  - Run `npx prisma db push` to sync schema.
- `[x]` Update `import.controller.js`
  - Stop using `resolveBackendCourseCode`. Map `courseCode` exactly.
  - Remove line 324-326 that wipes `calculatedScore` if `STUDYING`.
  - Add logic to backup current scores into `TranscriptHistory` before upsert.
  - Upsert logic should use the exact `courseId` and possibly overwrite regardless of `semester`.
- `[x]` Update `dataService.js`
  - Remove `resolveBackendCourseCode` functionality (just return the string as-is or keep it simple).
  - Update `calculateFptGPA` to strictly check `status === 'PASSED'` before accumulating GPA.
- `[x]` Update `StudentProfile.jsx`
  - Change `startsWith` to exact match `cleanDbId === cleanCurrId`.
  - Display `—` instead of `0.0` when `value === null`.
- `[ ]` Verify changes with DB and UI.
- `[ ]` Commit and push code.
