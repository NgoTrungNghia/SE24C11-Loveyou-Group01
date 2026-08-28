# PA5 - Sprint Planning

**Project:** LoveYou – AI-Enhanced Dating Web Application

**Duration:** 10/08/2026 – 23/08/2026

**Sprint Goal:** Complete all PA5 course requirements by executing comprehensive system and AI functional testing across 6 use cases (92 test cases), documenting all quality assurance artifacts (Test Plan, Test Cases, Test Execution, Bug Report), polishing the final release build (Build 3), conducting project reflection, and preparing the final demonstration video and submission package.

---

# 1. Sprint Backlog

> **Performed by:** Nghĩa | **Reviewed by:** Chiến | **Edited by:** Nghĩa

| ID | Product Backlog Item | Priority | Assignee | Estimated Effort |
| :--- | :--- | :---: | :--- | :---: |
| SP5-01 | Define PA5 Test Plan, testing scope, test strategy, and environment setup | High | Công Chiến | 8 h |
| SP5-02 | Design comprehensive Test Cases for 6 Use Cases (UC1–UC6) and NFRs (92 TCs total) | High | Công Chiến + Trọng Văn | 14 h |
| SP5-03 | Define testing methodology and property assertions for Google Gemini AI features | High | Công Chiến + Trọng Văn *(Reassigned from Tường Huy)* | 8 h |
| SP5-04 | Execute manual, API probe, and automated Jest test execution across all 92 cases | High | Công Chiến + Trọng Văn | 18 h |
| SP5-05 | Document execution records, analyze pass/fail outcomes, and compile Bug Report | High | Công Chiến + Trọng Văn | 10 h |
| SP5-06 | Resolve environment and prerequisite bugs (PayOS dependency, Prisma Client sync) | High | Công Chiến + Minh Hoàng | 6 h |
| SP5-07 | Perform frontend UI polish, error handling feedback, and responsiveness check | Medium | Minh Hoàng + Hoàng Tấn | 12 h |
| SP5-08 | Verify backend stability, Gemini API fallback handling, and socket connections | Medium | Công Chiến + Minh Hoàng *(Reassigned from Tường Huy)* | 10 h |
| SP5-09 | Assemble and smoke test final release Build 3 | High | Whole Team (Active Members) | 8 h |
| SP5-10 | Write Individual and Team Reflection Report (`Reflection.md`) | High | Whole Team | 12 h |
| SP5-11 | Prepare Weekly Report, collect Jira sprint tracking, and export Git commit logs | Medium | Trung Nghĩa | 8 h |
| SP5-12 | Record and produce narrated final application demonstration video | High | Whole Team | 12 h |
| SP5-13 | Compile Markdown and PDF documents for final PA5 submission package | High | Trung Nghĩa + Whole Team | 8 h |

---

# 2. Sprint Tasks

> **Performed by:** Nghĩa, Chiến | **Reviewed by:** Whole Team | **Edited by:** Nghĩa

## 2.1 Test Planning & Case Specification

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Review PA4 deliverables and define PA5 test objectives | Công Chiến | Test Plan baseline |
| Define scope covering UC1 to UC6 and selected NFRs | Công Chiến | Scope definitions in `TestPlan.md` |
| Formulate AI testing methodology (property & directional checks) | Công Chiến | AI testing section in `TestPlan.md` |
| Specify 20 Test Cases for UC1 (Auth, Registration, Reset OTP) | Công Chiến + Trọng Văn | UC1 test cases in `TestCases.md` |
| Specify 13 Test Cases for UC2 (Smart Matching & Preferences) | Trọng Văn | UC2 test cases in `TestCases.md` |
| Specify 14 Test Cases for UC3 (Realtime Chat & Red-Flag Analysis) | Trọng Văn | UC3 test cases in `TestCases.md` |
| Specify 12 Test Cases for UC4 (AI Mini-Games with Gemini) | Công Chiến | UC4 test cases in `TestCases.md` |
| Specify 12 Test Cases for UC5 (Admin Management & Config) | Công Chiến | UC5 test cases in `TestCases.md` |
| Specify 12 Test Cases for UC6 (Citizen ID Verification) | Hoàng Tấn + Trọng Văn | UC6 test cases in `TestCases.md` |
| Specify 9 Test Cases for Non-Functional Requirements (NFR) | Công Chiến | NFR test cases in `TestCases.md` |

## 2.2 Test Execution & Defect Tracking

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Set up local test environment with Neon Cloud DB & Gemini API key | Công Chiến | Ready test environment |
| Execute Jest + Supertest test suites against in-process Express app | Công Chiến | Jest execution logs |
| Execute manual and API probe testing for all 92 test cases | Công Chiến + Trọng Văn | Execution records in `TestExecution.md` |
| Evaluate directional and schema correctness of Gemini AI outputs | Công Chiến + Minh Hoàng | AI test evaluation records |
| Measure API endpoint response times and NFR latency metrics | Công Chiến | NFR execution evidence |
| Log and classify all identified defects (BUG-01 through BUG-25) | Công Chiến + Trọng Văn | Complete `BugReport.md` |
| Verify defect dispositions (Fixed, Open, Deferred) | Whole Team | Final test outcome summary |

## 2.3 System Polishing & Final Build (Build 3)

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Fix PayOS package resolution and Prisma Client generation issues | Công Chiến | Working dependencies and database access |
| Refine matching card UI interactions and debouncing observations | Minh Hoàng | Improved discovery UI |
| Check Gemini API error and fallback responses on chat and mini-games | Công Chiến + Minh Hoàng | Resilient AI service handlers |
| Verify citizen identity verification UI photo submission flow | Hoàng Tấn + Minh Hoàng | Polished verification screens |
| Perform full end-to-end regression smoke test on Build 3 | Whole Team | Validated Build 3 release |

## 2.4 Process Evidence & Reflection

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Update Jira sprint backlog, user stories, and task states | Trung Nghĩa | Jira tracking screenshots |
| Export Git commit history and branch progression logs | Trung Nghĩa | Git log evidence |
| Draft individual member reflection and self-assessments | All Members | Individual sections in `Reflection.md` |
| Synthesize team-level retrospective and project reflection | Trung Nghĩa + Whole Team | Consolidated `Reflection.md` |
| Compile Weekly Scrum reports for Sprint 5 | Trung Nghĩa | `PA5-Weekly-report.md` |

## 2.5 Final Presentation & Submission Package

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Prepare demonstration script covering core features & AI workflows | Hoàng Tấn + Minh Hoàng | Demo script |
| Record screen captures and voiceover narration for application demo | Whole Team | Raw video footage |
| Edit final video and upload to YouTube | Minh Hoàng + Trung Nghĩa | Public/Unlisted YouTube video link |
| Convert all management and testing Markdown documents to PDF | Trung Nghĩa | Formatted PDF artifacts |
| Perform final QA review and package PA5 ZIP submission | Whole Team | Complete PA5 Submission Package |

---

# 3. Sprint Schedule

> **Performed by:** Nghĩa | **Reviewed by:** Chiến | **Edited by:** Nghĩa

| Date | Activities |
| :--- | :--- |
| 10/08 | Sprint Planning meeting, backlog prioritization, and role assignments |
| 11/08 – 13/08 | Test Plan drafting, test case authoring (92 TCs across UC1–UC6 and NFRs) |
| 14/08 | **Scrum Meeting 1** (Progress check on test specifications and environment setup) |
| 14/08 – 17/08 | Test execution across Auth, Matching, Chat, AI Games, Admin, and Verification modules |
| 18/08 – 19/08 | NFR measurements, Jest automated suite execution, defect logging, and bug triage |
| 20/08 | **Scrum Meeting 2** (Review test execution results, 72 Pass / 20 Fail, and bug catalog) |
| 20/08 – 21/08 | Build 3 final integration smoke test, environment fixes, and UI polish |
| 21/08 – 22/08 | Reflection writing (`Reflection.md`), demo video script preparation, recording & editing |
| 23/08 | **Sprint Review, Sprint Retrospective**, PDF document exports, and final PA5 submission |

---

# 4. Definition of Done

> **Performed by:** Nghĩa, Chiến | **Reviewed by:** Whole Team | **Edited by:** Nghĩa

A backlog item or milestone is considered complete when:

- All 92 planned test cases across the 6 selected use cases and NFRs are executed and recorded with clear evidence.
- `TestPlan.md`, `TestCases.md`, `TestExecution.md`, and `BugReport.md` are completely documented and cross-referenced.
- Identified bugs (BUG-01 to BUG-25) are clearly cataloged with reproduction steps, severity, and status.
- Environment blockers (Prisma Client generation and missing dependencies) are resolved.
- The final software release (Build 3) can run end-to-end across frontend, backend, PostgreSQL database, and Gemini AI.
- `Reflection.md` contains honest and thorough evaluations of project outcomes, individual contributions, and lessons learned.
- Process evidence (Weekly Report, Jira board, Git commit log) is complete and up to date.
- A narrated demo video is recorded, edited, and published with a valid link.
- All Markdown documents have matching PDF counterparts and are verified by all team members.

---

# 5. Risks & Mitigations

> **Performed by:** Chiến, Nghĩa | **Reviewed by:** Whole Team | **Edited by:** Nghĩa

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Non-deterministic AI outputs** causing test flakiness | High | Use property-based validation (schema validation, value ranges, count checks, and directional safety scoring) rather than strict string equality. |
| **Neon Cloud latency** distorting NFR response time tests | High | Acknowledge cloud database round-trip latency in the test environment description and document measurements transparently. |
| **Tight schedule** between test execution, bug triage, and video production | High | Parallelize test documentation, video recording preparation, and reflection writing among team members. |
| **Environment setup mismatches** (missing `@payos/node`, stale Prisma client) | Medium | Document setup prerequisites and run `npm install` + `npx prisma generate` as standardized verification steps. |
| **Video recording quality issues** or incomplete feature coverage | Medium | Create a clear step-by-step storyboard demonstrating each use case before recording the narrated walkthrough. |

---

# 6. Sprint Ceremonies

> **Performed by:** Nghĩa | **Reviewed by:** Whole Team | **Edited by:** Nghĩa

| Event | Schedule | Objectives |
| :--- | :--- | :--- |
| **Sprint Planning** | 10/08/2026 | Define sprint goal, establish testing backlog, and assign module ownership |
| **Daily Scrum** | Short asynchronous check-ins | Sync progress on test case authoring, execution results, and blockers |
| **Scrum Meeting 1** | 14/08/2026 | Review test case completeness, AI test approach, and initial execution |
| **Scrum Meeting 2** | 20/08/2026 | Review full test execution findings (72 Pass, 20 Fail), bug classifications, and demo plan |
| **Sprint Review** | 23/08/2026 | Demo final Build 3, inspect test deliverables, and validate submission package |
| **Sprint Retrospective** | 23/08/2026 | Reflect on project lifecycle, team collaboration, engineering practices, and lessons learned |

---

# 7. Expected Deliverables

> **Performed by:** Nghĩa | **Reviewed by:** Chiến | **Edited by:** Nghĩa

- `TestPlan.md` – PA5 Master Test Plan document
- `TestCases.md` – Detailed 92 test cases for UC1–UC6 and NFRs
- `TestExecution.md` – Full test execution logs, pass/fail records, and evidence notes
- `BugReport.md` – Catalog of 25 tracked bugs with severity, reproduction, and status
- `Reflection.md` – Team and individual reflective reports
- `AIUsageReport.md` – Project-wide AI usage declaration and tracking report
- `PA5-Sprint-Planning.md` – Sprint 5 planning documentation
- `PA5-Weekly-report.md` – Scrum meeting logs and member status reports
- `PA5-Sprint-Retrospective.md` – Sprint 5 retrospective and improvement actions
- Final Source Code (Build 3) in GitHub repository
- Narrated Video Demonstration (YouTube link)
- Jira Sprint Tracking and Git Commit Log Evidence
- Exported PDF documentation set and final PA5 submission ZIP

---

# 8. Acceptance Criteria

> **Performed by:** Nghĩa, Chiến | **Reviewed by:** Whole Team | **Edited by:** Nghĩa

Sprint 5 is considered successful if:

- [x] At least 5 use cases × 10 test cases are covered (achieved: 6 use cases + NFRs = 92 test cases).
- [x] Functional correctness of all three Google Gemini AI features is evaluated with documented property assertions.
- [x] All 92 test cases have an execution status (Pass / Fail) with linked defect records in `BugReport.md`.
- [x] The application runs stably end-to-end for the final demonstration without fatal crashes.
- [x] Team and individual reflections offer candid analysis of successes, technical hurdles, and engineering growth.
- [x] Process evidence (Jira, Git, Weekly Reports) demonstrates consistent agile collaboration throughout the sprint.
- [x] All deliverables are submitted on time according to course guidelines before **23/08/2026**.
