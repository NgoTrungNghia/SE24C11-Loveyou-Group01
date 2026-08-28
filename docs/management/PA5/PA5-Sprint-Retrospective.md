# PA5 - Sprint Retrospective

**Project:** LoveYou – AI-Enhanced Dating Web Application

**Sprint:** Sprint 5 – PA5

**Date:** 23/08/2026

---

## A. Group 01

> **Performed by:** Nghĩa | **Reviewed by:** Whole Team | **Edited by:** Nghĩa

| MEMBERS | PRESENT | ABSENT |
| :--- | :---: | :---: |
| Ngô Trung Nghĩa | V | |
| Lê Hoàng Tấn | V | |
| Nguyễn Công Chiến | V | |
| Nguyễn Minh Hoàng | V | |
| Nguyễn Tường Huy | | V |
| Vũ Lê Trọng Văn | V | |

---

### RETROSPECTIVE DETAILS

> **Performed by:** Whole Team | **Reviewed by:** Nghĩa | **Edited by:** Nghĩa

| Discussion Topic | Content |
| :--- | :--- |
| **What went well?** | - **Comprehensive Test Coverage:** Designed and executed 92 test cases across 6 key use cases and NFRs, comfortably exceeding course requirements (min. 5 use cases × 10 test cases = 50).<br>- **Effective AI Testing Strategy:** Successfully implemented property-based and directional assertion strategies to validate non-deterministic Google Gemini AI outputs (safety analysis, ice-breaking game generation & evaluation).<br>- **Transparent Defect Logging:** Systematically logged 25 bugs with clear reproduction steps, expected vs. actual outcomes, severity ratings, and explicit resolution status in `BugReport.md`.<br>- **Prerequisite & Environment Fixes:** Quickly resolved critical runtime blockers (installing missing `@payos/node` dependency and regenerating stale Prisma client) to ensure smooth test execution.<br>- **Resilient Team Response to Member Shortfall:** When member Nguyễn Tường Huy failed to attend meetings and delivered incomplete work, the remaining team members (Công Chiến, Trọng Văn, Minh Hoàng, Trung Nghĩa, Hoàng Tấn) proactively absorbed and redistributed all AI testing, bug verification, Build 3 smoke testing, video demonstration, and reflection reports on schedule. |
| **What went wrong?** | - **Member Non-Participation & Incomplete Work:** Member Nguyễn Tường Huy was absent from all team meetings (Scrum 1, Scrum 2, Retrospective) and delivered superficial, unusable drafts for assigned AI testing tasks. The rest of the team had to take over and completely re-author these deliverables under tight deadlines.<br>- **Cloud Database Latency on NFRs:** Using a remote Neon PostgreSQL cloud database introduced inherent network round-trip overhead, causing response times for matching (4,882 ms) and user queries to miss aggressive local NFR targets (<1s, <300ms).<br>- **Deferred Security & Architecture Items:** Several non-functional requirements (such as 15-minute brute-force lockout, dual token architecture with 7-day refresh rotation, and touch-screen swipe gestures) were uncovered as gaps during testing and had to be deferred.<br>- **Time Pressure at Sprint Close:** Synthesizing 92 test execution logs, cross-referencing bug IDs, filming a narrated demo, and drafting in-depth reflections while compensating for a missing member required intense overtime effort. |
| **Problems & Root Causes?** | - **Lack of Individual Member Commitment:** Inactivity, unexcused absence, and lack of communication from Nguyễn Tường Huy created unexpected bottlenecks in AI testing design and evaluation.<br>- **Network Topology Constraints:** Development and testing were executed against a cloud-hosted database rather than an in-process or local containerized database instance, impacting latency benchmarks.<br>- **Specification Drift:** Minor discrepancies between original functional requirement descriptions and backend schema validators (e.g., username login rejection, unknown email forgot-password disclosure) were only uncovered during formal test execution.<br>- **Generative AI Non-Determinism:** Tuning evaluation prompts to achieve distinct score separation between high and low agreement required iterative experimentation. |
| **Action Items for Improvement?** | - **Enforce Contribution-Based Evaluation:** In accordance with team rules established in PA1 (Section 5), strictly reduce contribution scores for members with unexcused meeting absences and failed task ownership.<br>- **Early Defect Triage & Task Escalation:** Establish faster checkpoint triggers so that non-performing tasks are flagged and reassigned earlier in the sprint rather than near final deadlines.<br>- **Local Containerized Testing:** For future performance benchmarking, spin up local PostgreSQL instances via Docker Compose to isolate code execution speed from public internet latency.<br>- **Continuous Integration (CI) Enforcement:** Implement GitHub Actions pipelines to automatically run `prisma generate`, `npm test`, and lint checks on every pull request to catch dependency issues early.<br>- **Prompt Engineering Hardening:** Refine Gemini system prompts to return strictly defined JSON schemas with wide scoring variance and explicit degraded fallback markers when keys are invalid. |
| **Lessons Learned?** | - **Accountability and peer governance are vital:** Proactive task redistribution and transparent documentation of member contributions protect team velocity and overall project quality.<br>- **Testing Generative AI requires property-based logic:** Exact string matches fail for LLMs; assertions must verify schema validity, value domains, item counts, and directional semantic correctness.<br>- **Honest defect disclosure is essential to software engineering:** Documenting known bugs and deferred items transparently provides far more engineering integrity than hiding defects.<br>- **Cross-functional coordination is critical:** Maintaining tight communication between backend, frontend, QA, and project management prevents late integration surprises. |

---

## B. Improvement Actions for Post-Release & Future Maintenance

> **Performed by:** Chiến, Nghĩa | **Reviewed by:** Whole Team | **Edited by:** Chiến

| Action | Owner | Target |
| :--- | :--- | :--- |
| **Implement Local Docker DB Benchmark:** Set up Dockerized PostgreSQL environment for accurate NFR latency testing | Công Chiến | Post-project release / Maintenance |
| **Implement Dual Token Authentication:** Transition from single 7-day JWT to 1-hour access token + 7-day refresh token rotation (BUG-06) | Công Chiến | Next release cycle |
| **Add Account Lockout Mechanism:** Implement 5-attempt brute-force protection with 15-minute cooldown (BUG-08) | Công Chiến | Next release cycle |
| **Refine AI Fallback Indicators:** Ensure AI fallback mechanisms explicitly flag degraded mode instead of returning generic scores (BUG-21) | Công Chiến + Minh Hoàng | Next release cycle |
| **Add Touch/Swipe Gestures:** Implement react-use-gesture / hammer.js touch handling for mobile swipe cards (BUG-23) | Minh Hoàng + Hoàng Tấn | Next UI update |
| **Automate CI Test Execution:** Set up GitHub Actions workflow for Jest automated test suites and coverage reports | Trọng Văn + Trung Nghĩa | Repository maintenance |
| **Optimize Frontend Bundle Size:** Implement code splitting and dynamic lazy imports to reduce minified bundle below 500 kB (BUG-17) | Minh Hoàng | Next release cycle |
