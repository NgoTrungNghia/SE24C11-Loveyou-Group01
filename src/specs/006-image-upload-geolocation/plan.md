# Implementation Plan: 006 Image Upload & Geolocation

## Architecture
- **Storage Layer**: Local filesystem under `src/public/uploads/{avatars,photos}` using UUID filenames.
- **Backend Layer**: `uploadService.js` to decode Base64 image streams and write to disk, `uploadController.js` & `uploadRoutes.js` (`/api/upload/avatar`, `/api/upload/photos`), and Express `express.static()` middleware.
- **Database Layer**: `latitude` (Float), `longitude` (Float), `photos` (Json), `profilePicture` (String) fields on `User` Prisma model.
- **Frontend Layer**: `OnboardingWizard.jsx` 2x2 grid with HTML5 Canvas compression, Base64 converter, and `navigator.geolocation.getCurrentPosition()` handler.
