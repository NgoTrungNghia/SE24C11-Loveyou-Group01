# Tasks: 007 AI Matching & Preferences

- [x] Add `UserPreferences` model to `schema.prisma`
- [x] Run `npx prisma migrate dev`
- [x] Create `aiMatchingService.js` (Haversine formula, 4-tier score calculation, candidate querying & sorting)
- [x] Create `aiMatchingController.js` and `aiMatchingRoutes.js` under `/api/ai`
- [x] Export `aiMatchingApi` in `api.js`
- [x] Add AI mode toggle switch (`🤖 AI Match` / `📋 Normal`) on `Dashboard.jsx`
- [x] Render `🤖 XX% ăn ý` score badge on candidate cards
- [x] Add preference controls (gender, age slider, distance slider) in `OnboardingWizard.jsx`
