# Implementation Plan: 007 AI Matching & Preferences

## Architecture
- **Database Layer**: `UserPreferences` Prisma model with 1-to-1 relation to `User`.
- **Service Layer**: `aiMatchingService.js` containing `haversineDistance()`, `calculateCompatibilityScore()`, `getAICandidates()`, and preference CRUD functions.
- **Controller & Routes**: `aiMatchingController.js` & `aiMatchingRoutes.js` under `/api/ai`.
- **Frontend Integration**: `aiMatchingApi` in `api.js`, AI mode toggle switch in `Dashboard.jsx`, AI score badge (`🤖 XX% ăn ý`), and preference range controls in `OnboardingWizard.jsx` step 3.
