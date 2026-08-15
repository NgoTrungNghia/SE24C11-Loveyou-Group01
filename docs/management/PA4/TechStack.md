# PA4 – Tech Stack

## 1. Overview

The LoveYou system uses a web-based client–server architecture. The technology stack is kept concise and grouped by responsibility.

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React, Vite, TypeScript | Build the user interface and client-side application |
| Frontend Communication | Axios | Communicate with Backend REST APIs |
| Frontend Routing | React Router | Handle client-side navigation |
| Backend | Node.js, Express.js | Provide REST APIs and application logic |
| Database | PostgreSQL | Store users, profiles, matching and application data |
| ORM | Prisma | Access and manage PostgreSQL data |
| Authentication | JWT, bcrypt | Authentication, authorization and password hashing |
| Validation | Zod | Validate request and application data |
| Email | Nodemailer | Send application emails/notifications |
| Version Control | Git, GitHub | Source-code management and team collaboration |

## 2. Architecture Summary

```text
┌──────────────────────┐
│      Frontend        │
│ React + Vite + TS    │
│ Axios + React Router │
└──────────┬───────────┘
           │ HTTP / REST API
           ▼
┌──────────────────────┐
│       Backend        │
│ Node.js + Express    │
│ JWT + bcrypt + Zod   │
└──────────┬───────────┘
           │ Prisma
           ▼
┌──────────────────────┐
│      PostgreSQL      │
└──────────────────────┘

Backend ───────────────► Nodemailer / SMTP
```

## 3. Technology Selection Rationale

- **React + TypeScript**: component-based frontend with type safety.
- **Vite**: fast development and build tooling.
- **Node.js + Express**: lightweight REST API backend.
- **PostgreSQL + Prisma**: relational database with convenient type-safe data access.
- **JWT + bcrypt**: authentication and secure password handling.
- **Zod**: request/data validation.
- **Nodemailer**: email delivery.
- **Git + GitHub**: version control and collaboration.
