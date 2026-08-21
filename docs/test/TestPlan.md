# LoveYou â€” PA5-2026 Test Plan

| Field | Value |
| --- | --- |
| Project | LoveYou â€” Online Dating Web Application |
| Class / Group | SE24C11 â€” Group 01 |
| Document | Test Plan (PA5-2026) |
| Version | 1.0 |
| Author | Nguyen Cong Chien |
| Test lead / Executor | Nguyen Cong Chien |
| Date | 2026-08-20 |
| Related documents | [TestCases.md](TestCases.md) Â· [TestExecution.md](TestExecution.md) Â· [BugReport.md](BugReport.md) |

---

## 1. Purpose

This document defines how the LoveYou application was tested for PA5-2026. It states what was
tested, what was deliberately left out, how the test cases were derived, and the criteria used to
decide whether a test case passed or failed.

Testing for this assessment is **manual functional testing with documented results**. Automated
testing is not a requirement, but the repository already contains a Jest + Supertest suite from
PA3/PA4, so that suite was executed as an additional evidence source rather than ignored (see
Â§6.3).

## 2. Scope

### 2.1 In scope

Six use cases were selected for functional testing. They were chosen to cover the application's
critical path (a user can register, be matched, and talk to their match), everything that is
genuinely AI-powered, and the two privileged/trust-sensitive areas (administration and identity
verification).

| ID | Use case | Spec Kit module | Test cases |
| --- | --- | --- | --- |
| UC1 | Registration, Login & Password Recovery | 001-auth-authorization, 002-password-reset-otp | 20 |
| UC2 | Discover & Smart Matching | 004-matching, 007-ai-matching-preferences | 13 |
| UC3 | Realtime Chat & AI Red-Flag Analysis | 005-realtime-chat | 14 |
| UC4 | AI Mini-Games (Gemini) | 008-mini-games | 12 |
| UC5 | Admin Management | 009-admin-management | 12 |
| UC6 | Citizen ID Verification | 011-citizen-identity-verification | 12 |
| NFR | Non-functional requirements | nfr_completed.md (retained NFR cases) | 9 |
| | **Total** | | **92** |

This satisfies the assessment minimum of 5 use cases Ã— 10 test cases = 50.

### 2.2 AI features under test

The assessment requires AI-powered features to be tested for functional correctness â€” that is,
whether the feature produces the expected output for a given input. LoveYou has **three** genuinely
AI-backed features, all served by Google Gemini through
[geminiService.js](../../../../src/loveyou-backend/src/services/geminiService.js):

| AI feature | Function | Tested in |
| --- | --- | --- |
| Chat red-flag / safety analysis | `detectRedFlags()` | UC3 (TC-CHAT-09â€¦12) |
| Mini-game question generation | `generateGameQuestions()` | UC4 (TC-GAME-01â€¦04) |
| Mini-game result evaluation | `evaluateGameResult()` | UC4 (TC-GAME-05â€¦10) |

Because AI output is non-deterministic, these test cases do **not** assert exact strings. Each one
asserts a *checkable property* of the output for a controlled input â€” schema conformance, value
domain, item count, language, and above all **directional correctness** (a documented abusive
conversation must not be classified `SAFE`). The method is described in Â§5.

> **Clarification carried into this plan.** The "AI matching" compatibility score in
> [aiMatchingService.js](../../../../src/loveyou-backend/src/services/aiMatchingService.js) is a
> deterministic weighted formula (shared interests, distance, age range, activity recency) with no
> model call. It is therefore tested in UC2 as **Smart Matching**, a normal functional feature, and
> is *not* counted as one of the AI features above. Its determinism is what makes
> TC-MATCH-08/09/10 assertable.

### 2.3 Out of scope

| Excluded | Reason |
| --- | --- |
| VIP payment settlement via PayOS (010) | Requires live PayOS merchant credentials and a real bank transfer; cannot be executed in a test environment. Link creation is covered indirectly by UC2's VIP gating. |
| Live support chat (012) | Covered by its own passing Jest suite (`support.test.js`); not selected as one of the six use cases. |
| Load / stress testing (NFR-05, NFR-06) | Needs a dedicated load-generation environment and a deployed instance, so these cases were removed from the retained PA5 suite. |
| Cross-browser and mobile-device matrix | Single browser (Chrome) was used. |
| Penetration testing | Only the specific auth/authorization properties listed in the NFR set were checked. |

## 3. Test environment

| Component | Configuration |
| --- | --- |
| OS | Windows 11 Home Single Language 10.0.26200 |
| Backend | Node.js v24.16.0, Express 5, Socket.io 4.8, run locally on port 3000 |
| Frontend | React 18 + Vite, `npm run dev` on `http://localhost:5173` |
| Database | PostgreSQL 16 hosted on **Neon Cloud**, accessed via Prisma ORM 7.9 + `@prisma/adapter-pg` |
| AI provider | Google Gemini REST API (`gemini-flash-latest` with four documented fallback models) |
| Gemini API key | Stored in the database `SystemConfig` table under key `GEMINI_API_KEY`, managed from the Admin panel. Confirmed present and live before AI execution. The key value is never reproduced in any test document. |
| Browser | Google Chrome (latest) |
| API-level harness | Jest 30 + Supertest 7 against the in-process Express app (no network listener required) |

**Environment caveat that affects NFR timing.** The database is a *cloud* instance reached over the
public internet from a local machine. Every request that touches Prisma therefore carries network
round-trip latency that a co-located deployment would not. All response-time measurements in
[TestExecution.md](TestExecution.md) were taken under this condition, and the NFR-03 findings are
reported with that caveat stated explicitly rather than presented as pure application cost.

### 3.1 Test data

All accounts in the current database are test accounts. Rather than depend on existing rows, the
API-level runs create their own fixtures under a unique run tag (`pa5<timestamp>`) and delete them
afterwards, so runs are repeatable and leave no residue:

| Fixture | Role | Purpose |
| --- | --- | --- |
| `<tag>_alice` | MEMBER, female, 26, HCMC coords, interests `coffee/reading/running` | Primary actor |
| `<tag>_bob` | MEMBER, male, 27, HCMC coords, interests `coffee/reading/gaming` | Match partner (2 shared interests, ~1.4 km away) |
| `<tag>_carol` | MEMBER, female, 28, Hanoi coords, interests `music` | Third party â€” used for outsider/authorization checks and VIP checks |
| `<tag>_admin` | ADMIN | Admin-panel and moderation actions |

## 4. Test approach

### 4.1 How the test cases were derived

The assessment requires that previously Spec Kit-generated test cases be reviewed, understood, and
refined rather than resubmitted as-is. The prior generated document was reviewed and then rebuilt,
because auditing it against the code showed its expected results could not be trusted: every one of
its ~59 cases was marked `Pass` with a placeholder `Actual results: ...`, and at least one expected
result was demonstrably wrong (it expected `123@abc.com` to be rejected as malformed, whereas the
frontend regex `/\S+@\S+\.\S+/` in [Signup.jsx](../../../../src/loveyou-frontend/src/pages/Signup.jsx)
accepts it â€” the test case, not the code, was incorrect).

Each test case in this cycle was therefore derived by reading the implementation and the Spec Kit
specification **together**:

1. **Trace the path.** route â†’ middleware â†’ controller â†’ service â†’ Prisma, to establish what the
   code actually does.
2. **Read the contract.** The matching `specs/<module>/spec.md` and `contracts/*.md`, to establish
   what the code is *supposed* to do.
3. **Write the expected result from the contract, not from the code.** This is the deliberate choice
   that makes the exercise meaningful. Where the two disagree, the specification wins, the test case
   fails, and a bug is raised. Copying the code's behaviour into the "expected result" column would
   have produced a document where everything passes and nothing is validated.
4. **Add the edge cases the generated set omitted** â€” authorization boundaries (a third party
   touching someone else's conversation), state-transition guards (messaging after unmatch, after a
   block), idempotence (re-submitting a rejected verification), and AI failure/fallback paths.

Point 3 is why UC1 contains failing test cases. Six of them encode the published contract in
[password-reset-api.md](../../../../src/specs/002-password-reset-otp/contracts/password-reset-api.md)
(HTTP 401 on invalid OTP, 503 on mail-delivery failure, an identical 200 response for unknown
emails) which the implementation does not currently honour.

### 4.2 Execution split

| Layer | Method | Executor |
| --- | --- | --- |
| API, service, database, AI | Supertest against the real Express app, direct Gemini service calls, and Prisma assertions on resulting rows. Recorded status codes, payloads, DB state, and wall-clock timings. | Nguyen Cong Chien |
| Existing regression suite | `npx jest --runInBand --forceExit` (+ `--coverage`) | Nguyen Cong Chien |
| Browser UI | Manual walkthrough in Chrome | Nguyen Cong Chien |

Test cases whose behaviour exists only in the browser â€” Tesseract.js OCR of a Citizen ID photo,
jsQR decoding, the swipe gesture animation, the VietQR payment screen, Socket.io live delivery
between two open tabs â€” are marked **UI** in [TestCases.md](TestCases.md). Their status in
[TestExecution.md](TestExecution.md) reflects the manual browser run and is labelled as such, so the
evidence basis for every row is unambiguous.

### 4.3 Test design techniques

| Technique | Where used |
| --- | --- |
| Equivalence partitioning | Password length (<6 / 6â€“7 / â‰¥8), age filters, distance bands |
| Boundary value analysis | Password at 5 / 6 / 7 / 8 chars; OTP attempts at 4 / 5 / 6; rate limit at 3 / 4 requests; age filter at exactly `minAge` / `maxAge` |
| State transition | `NONE â†’ PENDING â†’ APPROVED/REJECTED â†’ PENDING` (verification); `PENDING â†’ ACTIVE â†’ COMPLETED` (games); match â†’ unmatch â†’ re-match |
| Decision table | Swipe outcome as a function of (my action, their prior action) |
| Negative & authorization testing | Every protected endpoint exercised anonymously, as the wrong role, and as a non-participant |
| Metamorphic testing | AI evaluation: identical answer sets must not score below opposite answer sets (Â§5) |
| Error guessing | Non-existent IDs, forged JWTs, empty conversations, absent API key |

## 5. AI test strategy

A model can return different words each time, so asserting an exact response is meaningless. Four
assertion classes were used instead, and every AI test case names the one it applies.

| Class | What is asserted | Example |
| --- | --- | --- |
| **A â€” Schema & domain** | All required keys present; each value in its legal domain. | `riskLevel âˆˆ {SAFE, CAUTION, DANGER}`; `safetyScore` an integer 0â€“100; `highlights` an array of 3 |
| **B â€” Directional correctness** | For an input whose ground truth is known by construction, the classification must fall on the correct side. This is the assertion that actually validates AI *usefulness*. | A conversation containing an investment-fraud pitch, a demand for a banking OTP, and a request to keep it secret from family **must not** be `SAFE` |
| **C â€” Determinism of guarded paths** | Non-AI branches inside AI features are fully deterministic and are asserted exactly. | Empty conversation â†’ exactly `SAFE` / `100` / fixed summary string, with no model call at all |
| **D â€” Graceful degradation** | With the API key removed or the call failing, the feature must fall back without crashing and must not misreport a canned result as AI-generated. | Question generation returns `null` â†’ session pauses with the documented reason string |

Ground-truth inputs for class B were authored specifically for this cycle, each seeded with named
manipulation patterns so the expected direction is defensible rather than a matter of taste:

* **Benign** â€” polite mutual small talk, a hobby exchange, and a boundary respected ("let me check my
  schedule"). Expected: `SAFE`, high score, `redFlags` empty.
* **Financial fraud** â€” unrealistic 30 %/day investment returns, urgency ("today only"), a request
  for a 50 million VND transfer, a request for the victim's banking OTP, guilt-tripping, and
  isolation from family. Expected: not `SAFE`, low score, `redFlags` non-empty.
* **Coercive control** â€” interrogation about whereabouts, a demand for live location, a prohibition
  on speaking to male colleagues, degradation ("you're worthless"), and gaslighting ("I'm only
  saying it because I love you; don't be so sensitive"). Expected: not `SAFE`, low score.

Class D matters because these features are configured at runtime: the Gemini key lives in the
database, so an administrator can clear it and every AI feature must degrade safely rather than
break the chat or the game.

## 6. Entry and exit criteria

### 6.1 Entry criteria

| # | Criterion | Status |
| --- | --- | --- |
| E1 | Backend and frontend start without errors | Met |
| E2 | Database reachable, schema migrated (5 migrations applied) | Met |
| E3 | Prisma Client generated from the current schema | **Initially not met** â€” see Â§6.3 |
| E4 | Backend dependencies installed | **Initially not met** â€” see Â§6.3 |
| E5 | Gemini API key configured and live | Met â€” verified before UC3/UC4 by a live call returning 10 well-formed questions |
| E6 | Test accounts available | Met |

### 6.2 Exit criteria

| # | Criterion | Outcome |
| --- | --- | --- |
| X1 | All 92 retained test cases executed with a Pass or Fail result | Met |
| X2 | Every failed test case linked to at least one bug report | Met |
| X3 | No open Critical defect | Met â€” no Critical defect found |
| X4 | Every High defect either fixed or accepted in writing with a rationale | Met â€” see Â§7 |
| X5 | Test summary published (features, case counts, pass/fail per feature) | Met â€” [TestExecution.md](TestExecution.md) Â§5 |

### 6.3 Blocking issues found before testing could start

The first attempt to run the existing suite failed completely â€” **4 suites failed, 4 total** â€” before
a single functional test case could be executed. Two independent environment defects were
responsible, and both are recorded as bugs because they would block any team member or CI job
identically:

1. `Cannot find module '@payos/node'` â€” declared in `package.json` and present in
   `package-lock.json`, but not installed, so every suite that imports `src/app.js` died at import
   time. â†’ **BUG-13**. Resolved by `npm install` (33 packages added).
2. `PrismaClientValidationError: Unknown argument 'latitude'` â€” the *generated* Prisma Client was
   stale relative to `schema.prisma`, which does define `latitude`, `longitude`, `isVip`,
   `lastActiveAt`, and `citizenVerificationStatus`. â†’ **BUG-14**. Resolved by `npx prisma generate`.

After both were resolved the suite ran: **3 of 4 suites passed, 16 of 22 tests passed**. The 6
remaining failures are genuine product defects, not environment problems, and are carried into UC1.

## 7. Handling of non-functional gaps

The NFR test cases compare the implementation against
[nfr_completed.md](../../PA2/Chien's%20Task/nfr_completed.md). Where the code does not meet a
documented NFR, the agreed disposition for this cycle is to **document the gap as a bug and leave it
open** â€” no code was changed to make a test pass, because altering authentication behaviour during a
test cycle would invalidate the results being reported. Each such bug carries status `Open
(Deferred)` and a rationale. This applies to BUG-06 (token lifetime), BUG-07 (password minimum
length), BUG-08 (no account lockout), BUG-15 (response times), and BUG-16 (test coverage).

## 8. Risks and limitations

| Risk | Impact | Mitigation applied |
| --- | --- | --- |
| AI output varies between runs | A test case could pass once and fail later | Only properties are asserted, never exact text (Â§5); ground-truth inputs are unambiguous, not borderline |
| Gemini free-tier rate limits (HTTP 429) | AI test cases could fail for quota, not correctness | Service retries across 5 model endpoints with a 1500 ms back-off; AI cases were run spaced apart, and observed latency is recorded per case |
| Cloud database latency | Distorts response-time NFRs | Stated as an explicit caveat in Â§3 and in BUG-15; relative comparisons used rather than absolute claims |
| Game sessions are held in an in-memory `Map` | State is lost on restart; not horizontally scalable | Recorded as an observation in [BugReport.md](BugReport.md) (BUG-12) |
| Single tester | Reduced perspective diversity | Expected results derived from written specifications rather than from the tester's own reading of the code |

## 9. Deliverables

| Document | Contents |
| --- | --- |
| [TestPlan.md](TestPlan.md) | This document |
| [TestCases.md](TestCases.md) | 92 retained test cases: ID, use case, description, preconditions, steps, test data, expected result, type |
| [TestExecution.md](TestExecution.md) | Per-case execution record: ID, execution date, Pass/Fail, actual result, linked bug; plus the test summary |
| [BugReport.md](BugReport.md) | Every defect found: ID, description, steps to reproduce, expected vs actual, severity, status |
