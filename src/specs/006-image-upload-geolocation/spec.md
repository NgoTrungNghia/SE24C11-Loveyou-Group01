# Feature Specification: Image Upload & Geolocation GPS (006)

**Feature Branch**: `006-image-upload-geolocation`

**Created**: 2026-08-12

**Status**: Completed

**Input**: User description: "Implement local filesystem image storage for user avatars and photo galleries, plus HTML5 Geolocation capture for distance-based matching."

## User Scenarios & Acceptance Criteria

### User Story 1 - Local Image Storage (Priority: P1)
Users can upload avatars and gallery photos directly from their local device. Images are compressed on client canvas and saved as files on the backend local filesystem (`/public/uploads/`).

### User Story 2 - HTML5 GPS Location Capture (Priority: P1)
Users can click a "📡 Lấy vị trí GPS của tôi" button during onboarding or profile editing to capture exact latitude and longitude coordinates via browser HTML5 Geolocation API.

## Requirements

- **FR-01**: System MUST process Base64 encoded image uploads and save them to `src/public/uploads/avatars` and `photos`.
- **FR-02**: System MUST serve uploaded static image assets under `/uploads/*` static endpoint.
- **FR-03**: System MUST update user model with `latitude` and `longitude` fields when GPS location is captured.
- **FR-04**: System MUST limit user gallery uploads to maximum 6 photos and perform client-side JPEG compression.
