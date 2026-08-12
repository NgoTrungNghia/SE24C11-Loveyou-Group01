# Tasks: 006 Image Upload & Geolocation

- [x] Create directory `src/public/uploads/avatars` and `src/public/uploads/photos`
- [x] Create `uploadService.js` (Base64 file saving & old file deletion)
- [x] Create `uploadController.js` and `uploadRoutes.js` under `/api/upload`
- [x] Add `express.static('/uploads')` static file middleware in `app.js`
- [x] Add client-side HTML5 canvas image resize & JPEG compression in `OnboardingWizard.jsx`
- [x] Add GPS Geolocation capture button calling `navigator.geolocation.getCurrentPosition()`
- [x] Update profile update handler to store `latitude` & `longitude`
