<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0
- Modified principles: none → 5 new principles
- Added sections: Technology and Architecture Constraints, Development Workflow and Review
- Removed sections: none
- Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/spec-template.md, ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: none
-->

# LoveYou Constitution

## Core Principles

### I. Security and Privacy by Default
LoveYou MUST treat personal data as sensitive by default. Plain-text passwords MUST NEVER be stored, all endpoints MUST validate input before use, and access to private user data MUST be limited to authorized actors through explicit authorization checks.

### II. Architecture Discipline
The platform MUST follow the agreed architecture: a Node.js + Express backend, Prisma ORM with PostgreSQL (Neon), a React + Vite frontend, bcrypt with 10 rounds and JWTs with 7-day expiry for authentication, and Zod for validation. The frontend MUST NOT access the database directly; backend services remain the only integration point for persistence and auth state.

### III. Simplicity and Maintainability
Features MUST be implemented with the simplest viable design that solves the current problem. YAGNI governs scope, comments and documentation MUST be written in English, dead or unused code MUST be removed, and complexity MUST be justified when it is introduced.

### IV. Quality Through Validation and Review
Every change that affects API behavior, authentication, or user data MUST include validation and verification before merge. Pull requests MUST receive review before merge, and security-sensitive or user-impacting changes MUST not bypass review or testing.

### V. Prioritized Product Delivery
Delivery MUST follow the product priority order: Authentication, User Profiles, Smart Matching, Swipe & Match, Messaging, Notifications, Safety, Admin, and Additional AI. Work that advances an earlier priority MUST be completed before later capabilities are considered for scope expansion.

## Technology and Architecture Constraints
- Backend services MUST be implemented in Node.js with Express and Prisma.
- PostgreSQL (Neon) MUST remain the source of truth for persistent data.
- Frontend work MUST use React and Vite and communicate with backend APIs only.
- Authentication MUST use bcrypt with 10 rounds and JWTs with 7-day expiry.
- Input validation MUST use Zod on relevant request boundaries.
- Secrets, tokens, and personal data MUST be handled in a way that prevents disclosure in logs or client code.

## Development Workflow and Review
- All work MUST be documented in English.
- Features MUST be implemented in small, reviewable increments that can be validated independently.
- Changes that alter contracts, security behavior, or persistence MUST be reviewed before merge.
- No feature or refactor MAY introduce unused code, unreviewed shortcuts, or bypasses to validation rules.
- The implementation plan and task breakdown MUST reflect the priority order above and preserve the platform's security and architecture constraints.

## Governance
This constitution supersedes informal shortcuts for product and engineering decisions. Amendments require a documented rationale, review by the project maintainers, and a version update. Compliance is assessed during planning, implementation review, and release readiness; violations MUST be addressed before merge or release.

**Version**: 1.0.0 | **Ratified**: 2026-07-24 | **Last Amended**: 2026-07-24
