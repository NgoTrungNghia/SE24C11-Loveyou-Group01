# Implementation Plan: 004 Matching

## Architecture
- **Database Layer**: `Swipe` and `Match` Prisma models.
- **Backend Service Layer**: `matchingService.js` handling candidate filtering, swipe recording, and mutual match detection.
- **Backend Controller / Route**: `matchingController.js` and `matchingRoutes.js` under `/api/matching`.
- **Frontend Layer**: `Dashboard.jsx` Tinder Swiping Stage & `matchingApi` integration.
