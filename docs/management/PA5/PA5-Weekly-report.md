# PA5 - Weekly Report

**Project:** LoveYou – AI-Enhanced Dating Web Application

**Sprint:** Sprint 5 – PA5

**Duration:** 10/08/2026 – 23/08/2026

---

# SCRUM 1

> **Performed by:** Nghĩa | **Reviewed by:** Whole Team | **Edited by:** Nghĩa

## ====== 14/08/2026 ======

## A. Group 01

| MEMBERS | PRESENT | ABSENT |
| :--- | :---: | :---: |
| Ngô Trung Nghĩa | V | |
| Lê Hoàng Tấn | V | |
| Nguyễn Công Chiến | V | |
| Nguyễn Minh Hoàng | V | |
| Nguyễn Tường Huy | | V |
| Vũ Lê Trọng Văn | V | |

## B. Status Report

> **Performed by:** All Team Members | **Reviewed by:** Nghĩa | **Edited by:** Nghĩa

### 1. Trung Nghĩa (Project Manager)
* **Completed tasks:** Organized Sprint 5 planning meeting, established Jira sprint backlog for testing activities, reallocated AI testing tasks due to member absence, and created the framework for PA5 management documents.
* **To-do tasks:** Coordinate test case review, monitor progress on redistributed documentation artifacts, and start preparing templates for final submission evidence (Git log, Jira progress, reflection).
* **Issues/Obstacles:** Needed to adjust task allocations and workload distribution to keep the sprint timeline intact while maintaining full testing coverage across both core functional use cases and AI-specific capabilities.

### 2. Hoàng Tấn (UI/UX & Frontend)
* **Completed tasks:** Reviewed UI workflows for Citizen ID verification (UC6) and Ice-breaking mini-games (UC4) against testing specifications; verified responsiveness of key pages.
* **To-do tasks:** Assist in drafting UI-level test cases for UC6 and prepare test input assets (sample citizen ID images).
* **Issues/Obstacles:** Some edge cases in the image upload flow needed clearer UX error states.

### 3. Công Chiến (Backend Lead & Test Lead)
* **Completed tasks:** Outlined the Master Test Plan (`TestPlan.md`), set up local Node.js / Neon PostgreSQL test environment, configured Jest + Supertest harnesses, and took over authoring UC4 AI testing methodology and test cases due to Huy's absence.
* **To-do tasks:** Author detailed test cases for UC1 (Auth), UC4 (AI Mini-Games), UC5 (Admin), and NFRs; begin executing API probe tests against backend endpoints.
* **Issues/Obstacles:** Substantial workload increase from absorbing AI testing specifications; Cloud-hosted Neon database requires stable network connectivity during continuous API probing.

### 4. Minh Hoàng (Frontend Lead)
* **Completed tasks:** Verified frontend builds with Vite, tested Smart Matching card interactions (UC2), and reviewed Realtime Chat Socket.io client handlers (UC3).
* **To-do tasks:** Assist in authoring test cases for UC2 and UC3 frontend interactions; test UI error boundaries during unexpected API responses.
* **Issues/Obstacles:** Rapid swiping/clicking on match cards causes UI state advance before API responses settle; needs observation during testing.

### 5. Tường Huy (Architecture & AI Integration)
* **Completed tasks:** None (Absent without notice; failed to submit usable initial AI testing specifications).
* **To-do tasks:** None (All assigned testing tasks have been reassigned to teammates to prevent schedule delays).
* **Issues/Obstacles:** Absent from Scrum 1 meeting without prior notice; submitted incomplete and superficial initial drafts for UC3/UC4 AI test cases. The team decided to redistribute these critical testing tasks to Công Chiến and Trọng Văn.

### 6. Trọng Văn (QA / Tester)
* **Completed tasks:** Drafted test case matrix structure for UC1, UC2, and took over UC3 (Realtime Chat & Red-Flag Analysis) test specifications from Huy; reviewed existing Jest automated test suites from PA3/PA4.
* **To-do tasks:** Author test cases for UC1 (20 TCs), UC2 (13 TCs), and UC3 (14 TCs); assist with manual execution and bug logging.
* **Issues/Obstacles:** Needed to quickly take over and re-author UC3 test specifications to keep test design on schedule.

---

# SCRUM 2

> **Performed by:** Nghĩa | **Reviewed by:** Whole Team | **Edited by:** Nghĩa

## ====== 20/08/2026 ======

## A. Group 01

| MEMBERS | PRESENT | ABSENT |
| :--- | :---: | :---: |
| Ngô Trung Nghĩa | V | |
| Lê Hoàng Tấn | V | |
| Nguyễn Công Chiến | V | |
| Nguyễn Minh Hoàng | V | |
| Nguyễn Tường Huy | | V |
| Vũ Lê Trọng Văn | V | |

## B. Status Report

> **Performed by:** All Team Members | **Reviewed by:** Nghĩa | **Edited by:** Nghĩa

### 1. Trung Nghĩa (Project Manager)
* **Completed tasks:** Collected Jira sprint progress screenshots, compiled Git commit history, and coordinated the outline for `Reflection.md` and the narrated demo video script; reviewed peer workload contributions.
* **To-do tasks:** Finalize weekly report, assemble PDF document package, review overall submission ZIP, and facilitate Sprint Retrospective.
* **Issues/Obstacles:** Coordinating multiple closing artifacts simultaneously within the tight end-of-sprint timeframe while compensating for member shortfall.

### 2. Hoàng Tấn (UI/UX & Frontend)
* **Completed tasks:** Tested UC6 Citizen ID verification UI flow with sample photos; verified frontend behavior for rapid matching actions (BUG-20) and mobile touch gaps (BUG-23).
* **To-do tasks:** Support final demo video recording and contribute individual reflection section to `Reflection.md`.
* **Issues/Obstacles:** Touch swipe gestures are not supported on mobile/touch screens, so testing relied on button triggers.

### 3. Công Chiến (Backend Lead & Test Lead)
* **Completed tasks:** Completed full execution of all 92 test cases (72 Pass, 20 Fail), including full evaluation of Gemini AI test runs (detectRedFlags, generateGameQuestions, evaluateGameResult) taken over from Huy; resolved missing `@payos/node` dependency (BUG-13) and regenerated Prisma Client (BUG-14); compiled `TestExecution.md` and cataloged 25 defects in `BugReport.md`.
* **To-do tasks:** Perform smoke test on final release Build 3, verify Jest suite consistency, and assist in documentation review.
* **Issues/Obstacles:** Heavy overtime required to execute and document all AI test evaluations in addition to core backend testing; several NFR performance targets (<1s for matching, <300ms for APIs) missed due to Neon Cloud PostgreSQL latency (BUG-15).

### 4. Minh Hoàng (Frontend Lead)
* **Completed tasks:** Validated UI rendering for Gemini fallback states (BUG-21, BUG-24), checked admin moderation tables, assisted in AI test execution verification, and prepared test scenarios for live demo recording.
* **To-do tasks:** Coordinate the final video demonstration recording and produce the walkthrough video file.
* **Issues/Obstacles:** Managing recorded video resolution and ensuring all 6 use cases and AI features are smoothly showcased within the target video duration.

### 5. Tường Huy (Architecture & AI Integration)
* **Completed tasks:** None (Absent from Scrum 2 meeting; did not complete AI test run evaluations or documentation).
* **To-do tasks:** None (All remaining sprint duties, AI verification, and reflection documentation have been fully reassigned to active team members).
* **Issues/Obstacles:** Continued unexcused absence from Scrum 2 meeting; produced negligible and superficial contributions throughout Sprint 5. The team fully reallocated all AI evaluation, bug logging, and documentation tasks to Công Chiến, Minh Hoàng, and Trọng Văn.

### 6. Trọng Văn (QA / Tester)
* **Completed tasks:** Verified reproduction steps for all logged bugs (BUG-01 through BUG-25, including AI defects BUG-09, BUG-10, BUG-11, BUG-12); completed cross-referencing between `TestCases.md`, `TestExecution.md`, and `BugReport.md`.
* **To-do tasks:** Complete final consistency check of testing numbers (92 total, 72 pass, 20 fail, 0 unexecuted) across all documentation files.
* **Issues/Obstacles:** Additional effort required to verify AI defect reproductions without original author's involvement.

---
