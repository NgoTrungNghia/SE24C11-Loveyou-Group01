# Feature Specification: AI Rule-Based Matching & User Preferences (007)

**Feature Branch**: `007-ai-matching-preferences`

**Created**: 2026-08-12

**Status**: Completed

**Input**: User description: "Implement rule-based AI compatibility algorithm for candidate sorting (Interests, Distance, Age, Activity) and configurable User Preferences for matching criteria."

## User Scenarios & Acceptance Criteria

### User Story 1 - Rule-Based AI Compatibility Scoring (Priority: P1)
Users see candidate cards sorted by an AI Compatibility Score (0-100%). Score is computed based on 4 weighted criteria:
1. **Interests Overlap (40%)**: Jaccard similarity between interest tags.
2. **Distance Proximity (25%)**: Haversine distance formula using GPS coordinates vs user max distance preference.
3. **Age Preference (20%)**: Candidate age fit within configured min/max age range.
4. **Activity Recency (15%)**: Recency of candidate's last active timestamp.

### User Story 2 - Customizable Search Preferences (Priority: P1)
Users can configure their match search criteria (gender preference: MALE, FEMALE, OTHER, ALL; age range: min 18 to max 70; max distance: 5km to 200km). AI candidate sorting respects these preferences.

### User Story 3 - AI Mode Toggle on Swiping Deck (Priority: P2)
Users can switch between `🤖 AI Match` (sorted by compatibility score) and `📋 Normal` candidate modes on the Dashboard.

## Requirements

- **FR-01**: System MUST store search preferences in `UserPreferences` table (`genderPreference`, `minAge`, `maxAge`, `maxDistance`).
- **FR-02**: System MUST calculate Haversine spherical distance between coordinates.
- **FR-03**: System MUST calculate total compatibility score out of 100% and sort candidates descending.
- **FR-04**: System MUST exclude swiped users and blocked users from candidates list.
- **FR-05**: System MUST provide API endpoints `GET /api/ai/ai-candidates`, `GET /api/ai/preferences`, `PUT /api/ai/preferences`.
