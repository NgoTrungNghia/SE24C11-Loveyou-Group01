# Research: 004 Matching

- **Mutual Match Detection**: Checked when swipe action is `LIKE` or `SUPER_LIKE`. Checks if `targetId` has already swiped `LIKE`/`SUPER_LIKE` on `swiperId`.
- **Candidates Exclusion Filter**: Excludes self and user IDs in `swipes` table where `swiperId = currentUser`.
