# Implementation Plan: Onboarding & Profile Setup Wizard

## Architecture
- **Frontend Layer**: `OnboardingWizard.jsx` -> 3-Board Step Manager -> `userApi.updateProfile()`.
- **Backend Layer**: `userRoutes.js` -> `userController.js` -> `userService.js` -> Prisma ORM (`User` model).

## 3-Board Step Mapping
- **Board 1**: Full Name ("Bạn muốn mọi người gọi mình là gì?"), Gender, DOB, City/Location.
- **Board 2**: Interest Tags selection, Bio text area, Height (cm).
- **Board 3**: Photo Uploads & Gallery (5 Photo slots).
