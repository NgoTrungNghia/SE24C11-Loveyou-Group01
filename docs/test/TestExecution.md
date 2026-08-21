# LoveYou - PA5-2026 Test Execution

Execution date: **2026-08-20**. Tester: **Nguyen Cong Chien**. The current PA5 scope excludes the previously unexecutable UI/load/instrumentation cases.

## 1. Execution records

| Range | Result | Actual result / evidence | Bug |
|---|---|---|---|
| TC-AUTH-01..05, 07..09, 11..13, 15, 17..20 | Pass | Jest/API checks passed for valid registration, duplicate validation, login, auth middleware, OTP happy path/rate limit and reset-token paths. | - |
| TC-AUTH-06 | Fail | Seven-character password was accepted with `201`. | BUG-07 |
| TC-AUTH-16 | Fail | Unknown email returned `404 EMAIL_NOT_REGISTERED` instead of the same generic `200` confirmation used for a known email. | BUG-01 |
| TC-AUTH-10 | Fail | Username login was rejected by schema with `400`; email-only validator runs before username lookup. | BUG-05 |
| TC-AUTH-14 | Fail | Six failed logins followed by correct password returned `200`; no lockout. | BUG-08 |
| TC-MATCH-01..06, 08..12, 14 | Pass | API probe verified candidates, filters, swipes, mutual match, deterministic compatibility, match listing/unmatch and VIP gating. | - |
| TC-MATCH-07 | Fail | Rapid/repeated Like actions advance the candidate index while requests are still in flight; more than one following candidate can be liked. The database upsert prevents duplicate rows for one target, but the UI does not debounce the action. | BUG-20 |
| TC-CHAT-01, 03..06, 09..12, 14 | Pass | API probe and Gemini checks passed; scam input produced `DANGER/0` with 5 flags; coercive input `DANGER/10` with 3 flags; empty input `SAFE/100`. | - |
| TC-CHAT-02, 07, 08 | Fail | Outsider access returned `500 INTERNAL_ERROR`; unmatch/block business errors also surface as 500 in service path. | BUG-09 |
| TC-CHAT-13 | Fail | With an invalid/unavailable Gemini key, the service returns a normal-looking fallback response (`CAUTION`, `safetyScore: 70`) instead of an explicit degraded/error result. | BUG-21 |
| TC-GAME-01..03, 05, 06, 09..11 | Pass | WYR/SPIN generated 10 questions; evaluation returned 98 for 4/4, 85 for 0/4, and 88 for SPIN free text. | BUG-10 (quality) |
| TC-GAME-04 | Fail | When Gemini is unavailable during question generation, the game is paused and the UI displays an error message instructing the user to check the Admin Gemini API key. | BUG-24 |
| TC-GAME-07 | Fail | Direct game-service execution with one answer missing returned a result with `total: 0` instead of rejecting incomplete submission. | BUG-25 |
| TC-GAME-08 | Fail | Submitting the same question twice overwrote the first answer (`optionA` became `optionB`) instead of rejecting or ignoring the duplicate. | BUG-25 |
| TC-GAME-12 | Pass | Direct game-service execution returned `null` for a nonexistent session; the Socket.io handler maps this to a `Session not found` error event. | - |
| TC-ADMIN-01..12 | Pass | API probe verified admin listing/search/role/ban/unban/verification/config authorization paths. | - |
| TC-VERIFY-01..11 | Pass | API probe verified photo field names, auth, status visibility and admin transitions. | - |
| TC-VERIFY-12 | Pass (UI; backend follow-up recorded) | The UI accepts front/back Citizen ID/ORC images and displays the extracted/reviewable fields and status correctly in the tested workflow. A separate backend OCR fixture check is still recommended before sign-off. | - |
| TC-NFR-01 | Fail | Matching/candidates average 4,882 ms against <1 s target (cloud Neon latency included). | BUG-15 |
| TC-NFR-02 | Fail | Login 337 ms, users/me 527 ms, matching 4,882 ms, AI candidates 4,891 ms, matches 1,582 ms, chat 1,846 ms; AI exceeds 2 s and non-AI endpoints exceed 300 ms. | BUG-15 |
| TC-NFR-03 | Fail | TTFB target not met for measured cloud-backed requests. | BUG-15 |
| TC-NFR-07 | Fail | Access token observed with 7-day TTL and no separate 7-day refresh token. | BUG-06 |
| TC-NFR-08 | Fail | Seven-character password accepted. | BUG-07 |
| TC-NFR-09 | Fail | No 15-minute lockout after five failures. | BUG-08 |
| TC-NFR-10 | Fail | Jest coverage: 44.42% statements, 46.53% lines, 31.88% branches, 38.58% functions. | BUG-16 |
| TC-NFR-11 | Fail | Vite output JS 653.13 kB minified / 174.08 kB gzip; minified chunk exceeds 500 kB warning threshold. | BUG-17 |
| TC-NFR-12 | Pass (observed UI timing) | Matching screen became usable in approximately 2 seconds; the other candidates populated about 1 second later (approximately 3 seconds total), within the <4 second TTI target. Full onboarding duration was not measured. | - |

## 2. Jest evidence

After installing the declared `@payos/node` dependency and regenerating Prisma Client, 4 suites ran: 3 suites passed, 1 failed; 16 tests passed and 6 failed. The six failures map to BUG-05, BUG-06, BUG-07, BUG-08 and BUG-01/BUG-02 contract defects.

## 3. Summary

| Feature | Cases | Pass | Fail | Awaiting/not executed |
|---|---:|---:|---:|---:|
| UC1 Auth | 20 | 16 | 4 | 0 |
| UC2 Matching | 13 | 12 | 1 | 0 |
| UC3 Chat | 14 | 10 | 4 | 0 |
| UC4 AI games | 12 | 9 | 3 | 0 |
| UC5 Admin | 12 | 12 | 0 | 0 |
| UC6 Verification | 12 | 12 | 0 | 0 |
| NFR | 9 | 1 | 8 | 0 |
| **Total** | **92** | **72** | **20** | **0** |

All 92 cases in the retained PA5 scope have an execution result. Every failed case has at least one linked bug in `BugReport.md`.
