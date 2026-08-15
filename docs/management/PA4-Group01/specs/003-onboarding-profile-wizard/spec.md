# Feature Specification: Onboarding & Profile Setup Wizard

**Feature Branch**: `003-onboarding-profile-wizard`

**Created**: 2026-08-07

**Status**: Completed

**Input**: User description: "Implement a 3-board Onboarding & Profile Setup Wizard for new users upon logging in. The wizard guides users through 3 structured boards: Board 1 (Name - 'Bạn muốn mọi người gọi mình là gì?', Gender, Date of Birth, City/Location), Board 2 (Interest Tags, Bio text area, Height), and Board 3 (Photo Uploads & Gallery). A prominent percentage progress bar (0% to 100%) at the top updates in real-time as information is supplied. Upon clicking 'OK / Continue' on each board, the user advances until completing Step 3, persisting profile data and redirecting to the Dating App Dashboard."

## Clarifications

### Session 2026-08-07
- Q: How does the progress bar calculate completion? → A: Increases dynamically from 0% to 100% based on field entries: Name (+15%), Gender & DOB (+15%), City & Height (+15%), Bio (+20%), Interest Tags (+15%), Photos (+20%).
- Q: Can users revisit the wizard or edit profile later? → A: Yes, existing users can re-open the wizard or edit their profile at any time from Dashboard.

## Actors

- **New User**: A newly registered user filling out their profile setup wizard for the first time.
- **Existing User**: A user updating their profile details or completing missing information.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Board 1: Basic Info (Priority: P1)

A new user logs in and is presented with Board 1 asking for display name ("Bạn muốn mọi người gọi mình là gì?"), Gender, Date of Birth, and Home City.

**Why this priority**: Essential identity information required before matching.

**Acceptance Scenarios**:
1. **Given** a new user logging in, **When** they reach Board 1, **Then** entering name, gender, DOB, and city updates the progress bar and enables the "Tiếp tục →" button.

---

### User Story 2 - Board 2: Bio & Interests (Priority: P1)

User proceeds to Board 2 to pick interest tags, write a bio, and specify height.

**Acceptance Scenarios**:
1. **Given** user on Board 2, **When** selecting interest tags and typing bio, **Then** progress bar increments towards 100% and clicking "Tiếp tục →" navigates to Board 3.

---

### User Story 3 - Board 3: Photo Gallery & Finalize (Priority: P1)

User adds photo URLs to 5 photo slots and completes onboarding.

**Acceptance Scenarios**:
1. **Given** user on Board 3, **When** adding photo URLs and clicking "Hoàn thành & Bắt đầu Hẹn hò 💖", **Then** the system saves all profile data to PostgreSQL, sets `isProfileComplete: true`, and redirects to the Dating App Dashboard.

## Requirements *(mandatory)*

- **FR-01**: System MUST support a 3-Board profile wizard.
- **FR-02**: System MUST display a 0% - 100% real-time progress bar at the top of the wizard.
- **FR-03**: System MUST persist profile data via `PUT /api/users/me`.
- **FR-04**: System MUST store `height`, `location`, `interests` (JSON array), and `photos` (JSON array).
