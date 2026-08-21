# LoveYou - PA5-2026 Bug Report

Tester: Nguyen Cong Chien. Statuses are the disposition at the end of this test cycle. NFR gaps were deliberately left open per the agreed testing scope; no code changes were made for them.

| ID | Description, reproduction and expected vs actual | Severity | Status / linked cases |
|---|---|---|---|
| BUG-01 | Password-reset request for an unknown email: call forgot-password with an unregistered address. Expected the same generic `200` confirmation as a known address (FR-004); actual `404 EMAIL_NOT_REGISTERED`, exposing account existence. | High | Open; TC-AUTH-16 |
| BUG-02 | SMTP delivery failure during OTP request. Expected generic retryable `503 EMAIL_DELIVERY_FAILED`, request counted; actual `200` and plaintext OTP written to logs. | High | Open; TC-AUTH-15 |
| BUG-03 | Verify wrong/expired OTP. Expected generic `401 INVALID_OTP`; actual `400 INVALID_OTP`. | Medium | Open; TC-AUTH-19 |
| BUG-04 | Reset with invalid/expired token. Expected generic `401 INVALID_TOKEN`; actual `400 INVALID_TOKEN`. | Medium | Open; TC-AUTH-20 |
| BUG-05 | Login using valid username and password. Expected `200`; actual `400` because `loginSchema` accepts email only although service supports username lookup. | Medium | Open; TC-AUTH-10 |
| BUG-06 | Decode issued auth token and inspect lifetime. Expected 1-hour access + 7-day refresh; actual one token with 7-day lifetime and no refresh token. | High | Open/Deferred; TC-AUTH-14, TC-NFR-07 |
| BUG-07 | Register password `1234567`. Expected `400` under NFR-12; actual `201`. | High | Open/Deferred; TC-AUTH-06, TC-NFR-08 |
| BUG-08 | Submit six bad passwords then the correct one. Expected account lock after five for 15 minutes; actual correct login `200`, no lockout. | High | Open/Deferred; TC-AUTH-14, TC-NFR-09 |
| BUG-09 | Use chat as outsider, after unmatch, or after block. Expected `403`/`409` business response; actual plain service errors become `500 INTERNAL_ERROR`, and valid business errors carry the wrong generic code. | High | Open; TC-CHAT-02, TC-CHAT-07, TC-CHAT-08 |
| BUG-10 | Evaluate game answers with 4/4 versus 0/4 agreement. Expected strong directional separation; actual scores 98 versus 85, only 13 points apart. | Medium | Open; TC-GAME-09, TC-GAME-10 |
| BUG-11 | Finish game when Gemini evaluation falls back. Expected `aiPowered:false` and one canonical compatibility field; actual route always forces `aiPowered:true` and returns both `compatibilityPct` and `compatibilityScore`; null-check branch is unreachable because service returns a fallback object. | Medium | Open; TC-GAME-05, TC-GAME-09 |
| BUG-12 | Restart backend during an active game. Expected recoverable/persisted session; actual game state is held only in an in-memory Map and is lost. | Low | Open; design limitation |
| BUG-13 | Run Jest from a fresh install. Expected app import and tests to start; actual `Cannot find module '@payos/node'`. Fixed by `npm install` (33 packages). | High | Fixed; environment prerequisite |
| BUG-14 | Run API after schema adds latitude/longitude. Expected Prisma queries to work; actual stale generated client rejects `latitude`. Fixed by `npx prisma generate`. | High | Fixed; environment prerequisite |
| BUG-15 | Measure response-time targets against documented NFRs. Expected NFR-01/03 thresholds; actual cloud-backed matching 4,882 ms, AI candidates 4,891 ms and other measured endpoints above thresholds. Load/stress and query-instrumentation cases were removed from this PA5 scope. | High | Open/Deferred; TC-NFR-01..03 |
| BUG-16 | Run Jest coverage. Expected >=60%; actual 44.42% statements, 46.53% lines, 31.88% branches, 38.58% functions. | Medium | Open/Deferred; TC-NFR-10 |
| BUG-17 | Run `vite build` and inspect gzip output. Expected bundle under 500 kB; actual main JS 653.13 kB minified (174.08 kB gzip) and Vite emits chunk-size warning. | Medium | Open/Deferred; TC-NFR-11 |
| BUG-18 | Update preferences repeatedly through API. Expected deterministic persistence; isolated repeat probe passed 6/6, but the broad run had one intermittent failure. Reproduction is not currently reliable. | Low | Open for monitoring; TC-MATCH-03 |
| BUG-19 | Inspect authenticated request path. Expected one maintained activity-update implementation; controller calls optional `authService.updateLastActive`, which is not exported, while middleware separately updates `lastActiveAt`. No observed functional failure. | Low | Open/cleanup; code quality observation |
| BUG-20 | Rapidly press Like on the matching board. Expected one guarded action for the visible candidate; actual each click advances `candidateIdx` after its request, so repeated clicks can like subsequent candidates before the first action settles. The database upsert only prevents duplicate rows for the same target. | High | Open; TC-MATCH-07 |
| BUG-21 | Analyze a non-empty conversation with an invalid or unavailable Gemini key. Expected an explicit degraded/error result that cannot be mistaken for AI analysis; actual fallback returns `CAUTION` with `safetyScore: 70` and populated advice/flags. | Medium | Open; TC-CHAT-13 |
| BUG-23 | Use the matching board with a touch device. Expected swipe-left/swipe-right gestures; actual discovery supports button clicks only and has no touch/pointer gesture handling. | Medium | Open; UI gap |
| BUG-24 | Start a mini-game while Gemini question generation is unavailable. Expected a recoverable retry state and report to admin or system; actual the backend pauses the session and the UI displays an error message. | Medium | Open; TC-GAME-04 |
| BUG-25 | Submit an incomplete game answer set or submit the same question twice through the game service. Expected incomplete submission to be rejected and duplicate submission to be rejected or ignored; actual incomplete evaluation returned a result and the duplicate answer overwrote the first answer. TC-GAME-12 now passes because nonexistent sessions produce a Socket.io error. | Medium | Open; TC-GAME-07, TC-GAME-08 |

## Notes

The earlier generated OTP test expected `404` for an unknown email. That expected result was corrected in this document to the specification's non-enumerating `200`; the resulting implementation mismatch is BUG-01. The Gemini key is configured and was never written into this report.
