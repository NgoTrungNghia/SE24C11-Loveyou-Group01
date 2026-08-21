# LoveYou - PA5-2026 Test Cases

Execution date for this cycle: 2026-08-20. Expected results follow the written specifications; where implementation differs, the execution is Fail and the defect is linked in `BugReport.md`.

## UC1 - Registration, Login and Password Recovery

| ID | Scenario / steps | Expected result | Type |
|---|---|---|---|
| TC-AUTH-01 | Register with valid unique username, email and 8-character password | `201`, account created | Positive |
| TC-AUTH-02 | Register with duplicate username | `409`, duplicate-user error | Negative |
| TC-AUTH-03 | Register with duplicate email | `409`, duplicate-email error | Negative |
| TC-AUTH-04 | Register with malformed email | `400`, validation error | Boundary |
| TC-AUTH-05 | Register with password length 5 | `400`, password validation error | Boundary |
| TC-AUTH-06 | Register with password length 7 | `400` because NFR-12 requires at least 8 | NFR |
| TC-AUTH-07 | Register with password length 8 | `201`, account created | Boundary |
| TC-AUTH-08 | Login with valid email and password | `200`, access token and user data | Positive |
| TC-AUTH-09 | Login with wrong password | `401`, invalid credentials | Negative |
| TC-AUTH-10 | Login by username with valid password | `200`, token returned | Positive |
| TC-AUTH-11 | Login as banned account | `403`, `ACCOUNT_BANNED` | Authorization |
| TC-AUTH-12 | Access protected endpoint without bearer token | `401`, authentication required | Authorization |
| TC-AUTH-13 | Access protected endpoint with forged/expired token | `401`, invalid token | Security |
| TC-AUTH-14 | Six consecutive failed logins, then correct password | Fifth failure starts 15-minute lock; correct login remains blocked (NFR-13) | NFR |
| TC-AUTH-15 | Request password OTP for known email | `200`, generic confirmation; OTP never in response/log | Positive |
| TC-AUTH-16 | Request password OTP for unknown email | Same `200` generic confirmation as known email (FR-004) | Security |
| TC-AUTH-17 | Request fourth OTP within one hour | `429`, rate limit | Boundary |
| TC-AUTH-18 | Submit valid OTP | `200`, reset authorization returned | Positive |
| TC-AUTH-19 | Submit wrong, expired, missing or exhausted OTP | One generic `401 INVALID_OTP` response | Negative |
| TC-AUTH-20 | Use invalid/expired reset token | Generic `401 INVALID_TOKEN` response | Negative |

## UC2 - Discover and Smart Matching

| ID | Scenario / steps | Expected result | Type |
|---|---|---|---|
| TC-MATCH-01 | Get candidate list as authenticated member | `200`, `data.candidates` array | Positive |
| TC-MATCH-02 | Get candidates anonymously | `401` | Authorization |
| TC-MATCH-03 | Apply valid age, gender and distance filters | Only candidates satisfying all filters returned | Positive |
| TC-MATCH-04 | Apply invalid filter values | `400` validation error | Negative |
| TC-MATCH-05 | Swipe right on an eligible candidate | `200`, swipe recorded | Positive |
| TC-MATCH-06 | Swipe left on an eligible candidate | `200`, candidate excluded from future feed | Positive |
| TC-MATCH-07 | Swipe same candidate twice | Idempotent/conflict response; no duplicate relation | Boundary |
| TC-MATCH-08 | Mutual right swipes | Match created and returned in `data.matches` | Positive |
| TC-MATCH-09 | Calculate compatibility for shared interests | Deterministic score increases with shared interests | Smart matching |
| TC-MATCH-10 | Calculate compatibility for distant/old-inactive user | Distance and recency reduce score deterministically | Smart matching |
| TC-MATCH-11 | List matches | `200`, only current matches returned | Positive |
| TC-MATCH-12 | Unmatch an existing match | `200`, match no longer active | Positive |
| TC-MATCH-14 | Request VIP-only discovery feature as non-VIP | Paywall/VIP-required response; no privileged data leaked | Authorization |

## UC3 - Realtime Chat and AI Red-Flag Analysis

| ID | Scenario / steps | Expected result | Type |
|---|---|---|---|
| TC-CHAT-01 | Open conversation for current match | `200`, conversation object returned | Positive |
| TC-CHAT-02 | Open conversation with non-participant | `403`, authorization error | Security |
| TC-CHAT-03 | Send normal text to current match | Message persisted and emitted to participants | Positive |
| TC-CHAT-04 | Send empty/overlong message | `400`, validation error | Boundary |
| TC-CHAT-05 | List messages with default pagination | `200`, latest page returned in documented order | Positive |
| TC-CHAT-06 | Clear conversation for one user | Cleared user's view hides prior messages; partner still sees them | State |
| TC-CHAT-07 | Send after unmatching | `409`/business error requiring a new match | State |
| TC-CHAT-08 | Send to a user who blocked the sender | `403`/business denial; no message persisted | Security |
| TC-CHAT-09 | Analyze empty conversation | Exact deterministic `SAFE`, score `100`, no flags | AI/domain |
| TC-CHAT-10 | Analyze benign hobby conversation | `SAFE`, high score, no red flags, green flags present | AI/directional |
| TC-CHAT-11 | Analyze investment scam with OTP/transfer request | `DANGER` or non-SAFE, low score, non-empty precise red flags | AI/directional |
| TC-CHAT-12 | Analyze coercive control/gaslighting conversation | `DANGER` or non-SAFE, low score, red flags identify control | AI/directional |
| TC-CHAT-13 | Analyze when Gemini unavailable | Safe fallback response, no crash, no false AI-success claim | AI/degradation |
| TC-CHAT-14 | Reconnect Socket.io after transient disconnect | Client reconnects and conversation remains usable | Realtime |

## UC4 - AI Mini-Games

| ID | Scenario / steps | Expected result | Type |
|---|---|---|---|
| TC-GAME-01 | Start WYR game | Session created with 10 Gemini-generated questions | AI |
| TC-GAME-02 | Start SPIN game | Session created with 10 valid questions | AI |
| TC-GAME-03 | Inspect generated question schema | Every item has prompt/options required by game UI | AI/schema |
| TC-GAME-04 | Gemini unavailable during generation | Session does not start; documented retry/error response | AI/degradation |
| TC-GAME-05 | Submit all matching answers | Result includes score, feedback and completion state | AI |
| TC-GAME-06 | Submit all opposing answers | Score is lower than matching-answer case | AI/metamorphic |
| TC-GAME-07 | Submit incomplete answer set | `400`, game cannot complete early | Boundary |
| TC-GAME-08 | Submit answer twice for same question | Duplicate submission rejected or ignored | Boundary |
| TC-GAME-09 | Evaluate 4/4 agreement | High score near upper range and `aiPowered` truthful | AI |
| TC-GAME-10 | Evaluate 0/4 agreement | Lower score than 4/4; explanation reflects disagreement | AI |
| TC-GAME-11 | Evaluate free-text SPIN answers | Valid result object, no crash, bounded score | AI |
| TC-GAME-12 | Finish nonexistent/expired session | `404`/documented session error; no result fabricated | Negative |

## UC5 - Admin Management

| ID | Scenario / steps | Expected result | Type |
|---|---|---|---|
| TC-ADMIN-01 | Admin lists users | `200`, paginated `data.users` | Positive |
| TC-ADMIN-02 | Member calls user-management endpoint | `403` | Authorization |
| TC-ADMIN-03 | Admin searches by username/email | Matching rows only | Positive |
| TC-ADMIN-04 | Admin bans active user | User becomes banned; future auth blocked | State |
| TC-ADMIN-05 | Admin unbans user | User can authenticate again | State |
| TC-ADMIN-06 | Admin changes user role | Role persists and permissions change | Positive |
| TC-ADMIN-07 | Admin deletes user | User removed/anonymized per policy | Destructive |
| TC-ADMIN-08 | Admin reviews pending verification | Pending records listed with correct status | Positive |
| TC-ADMIN-09 | Admin approves verification | Status becomes APPROVED and user notified | Positive |
| TC-ADMIN-10 | Admin rejects verification with reason | Status becomes REJECTED and reason stored | Positive |
| TC-ADMIN-11 | Admin saves Gemini configuration | Config stored masked; key not returned in plaintext | Security |
| TC-ADMIN-12 | Non-admin reads Gemini configuration | `403`; secret not disclosed | Security |

## UC6 - Citizen ID Verification

| ID | Scenario / steps | Expected result | Type |
|---|---|---|---|
| TC-VERIFY-01 | Submit front and back ID photos | `201`/pending verification created | Positive |
| TC-VERIFY-02 | Submit missing front photo | `400` validation error | Negative |
| TC-VERIFY-03 | Submit missing back photo | `400` validation error | Negative |
| TC-VERIFY-04 | Submit unsupported/non-image file | `400`, file validation error | Negative |
| TC-VERIFY-05 | Submit oversized image | `413`/validation rejection | Boundary |
| TC-VERIFY-06 | Submit duplicate pending verification | Existing pending record returned or duplicate rejected | Boundary |
| TC-VERIFY-07 | Get own verification status | `200`, only caller's status returned | Positive |
| TC-VERIFY-08 | Member gets another user's verification | `403` | Security |
| TC-VERIFY-09 | Admin approves pending record | Status transitions to APPROVED | Positive |
| TC-VERIFY-10 | Admin rejects pending record | Status transitions to REJECTED with reason | Positive |
| TC-VERIFY-11 | Unauthenticated submission | `401` | Authorization |
| TC-VERIFY-12 | OCR-readable ID image | Extracted fields are shown for review; unreadable OCR is handled gracefully | UI/OCR |

## NFR cases

| ID | Requirement and method | Expected threshold |
|---|---|---|
| TC-NFR-01 | Matching response benchmark | <1 s (NFR-01) |
| TC-NFR-02 | Non-AI and AI endpoint latency benchmark | <300 ms non-AI, <2 s AI (NFR-03) |
| TC-NFR-03 | TTFB benchmark | <500 ms (NFR-04) |
| TC-NFR-07 | Access token and refresh-token lifetime inspection | 1 hour access, 7 days refresh (NFR-11) |
| TC-NFR-08 | Password policy inspection | Minimum 8 characters (NFR-12) |
| TC-NFR-09 | Failed-login lockout | 5 failures cause 15-minute lock (NFR-13) |
| TC-NFR-10 | Automated coverage report | At least 60% (NFR-19) |
| TC-NFR-11 | Production bundle gzip size | <500 KB (NFR-23) |
| TC-NFR-12 | Time to interactive / onboarding workflow | TTI <4 s and onboarding <5 min (NFR-16/NFR-24) |
