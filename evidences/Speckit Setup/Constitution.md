# LoveYou Project Constitution

## Purpose
Provide guiding principles, requirements, and governance for building the LoveYou dating platform, prioritizing user safety, privacy, security, and an MVP-focused delivery.

## Core Principles & Requirements

1. User Safety First
- Protect personal data by default; collect only what is necessary.
- Hide contact information until there is a mutual match.
- Provide clear user controls: report, block, account deletion available at all times.
- All AI safety features require explicit user consent.

2. AI Explainability
- AI outputs must be interpretable and assist decision-making, not replace it.
- Smart Matching must include a compatibility score and a human-readable explanation.
- Red Flag Detection and other warnings must include reasons for the alert.
- Present AI recommendations as probabilistic suggestions, never guaranteed facts.

3. Security By Default
- Never store passwords in plain text; use strong hashing and salting.
- Use secure, token-based authentication and enforce authorization on all endpoints.
- Validate all user input server-side; sanitize content before processing.
- Log sensitive operations for auditability while protecting privacy.

4. Simplicity Over Complexity
- Favor simple, maintainable solutions over complex abstractions.
- Avoid premature optimization and unnecessary frameworks.
- Add dependencies only with clear justification.

5. Feature Completion Before Expansion
- Follow this priority for work: 1) Authentication, 2) User Profiles, 3) Smart Matching, 4) Swipe & Match, 5) Messaging, 6) Notifications, 7) Safety Features, 8) Admin Dashboard, 9) Additional AI Features.
- Do not start lower-priority features while critical bugs exist in higher-priority areas.

6. Testable Development
- Define acceptance criteria before implementation.
- Require tests for new features; include representative AI test cases.
- Manually test critical user flows before release.

7. Code Quality Standards
- Write code comments and documentation in English.
- Use clear, consistent naming conventions.
- Require Pull Request review before merging.
- Do not commit dead or unused code; update docs when behavior changes.

8. API-First Architecture
- Document backend APIs; frontend communicates exclusively via these APIs.
- Keep business logic on the backend; no direct DB access from frontend.

9. Data Privacy & Compliance
- Collect only necessary user data and provide a clear privacy notice.
- Allow users to delete their accounts and associated data.
- AI analysis may process only data users have consented to share; chat/analysis features require explicit opt-in.


## Governance & Enforcement
- Security-sensitive changes require design review and automated checks.
- Pull Requests must include tests or documented reasons when tests are infeasible.
- Maintain an audit log of consent for AI features and data processing.
- Regularly review dependencies for security and necessity.

## Operational Requirements
- All API endpoints enforce authorization and input validation.
- Sensitive operations are logged with minimal personal data to support audits.
- Store only required personal data and use data retention policies aligned with privacy requirements.

## Versioning & Updates
- Record the constitution version and date at the top of this file.
- Revisit this document when major architectural or policy changes occur.

---

*Version 1.0 — distilled from project documents.*
