# AI USAGE REPORT - PA4

- **Project:** LoveYou Dating Application
- **Student Name:** Nguyen Minh Hoang
- **Git Branch:** `Hoang---Tan`

---

## 1. Objectives & Scope of Application

This report strictly complies with the **AI Usage Guidelines** established by the Faculty of Information Technology, University of Science, VNU-HCM (Course CS10014 / SE24C11).

All AI tool usages during **Project Activity 4 (PA4)** are transparently declared with verifiable academic evidence, ensuring that the student fully understands and takes complete responsibility for 100% of the implemented source code and architectural designs.

---

## 2. Core Principles Checklist

| Principle | Compliance Description | Status |
| :--- | :--- | :---: |
| **Transparency** | Fully declared AI tools, access timestamps, prompts, and AI-assisted code/documentation modules. | **COMPLIED** |
| **Understanding** | The student independently tested, understood, and is capable of explaining 100% of the business logic. | **COMPLIED** |
| **No Blind Copying** | No unvalidated AI code copying; all code was customized to match project design specifications. | **COMPLIED** |
| **Academic Integrity** | Information was verified through unit tests, runtime environment (`npm run dev`), and database inspection. | **COMPLIED** |

---

## 3. AI Usage Notes

### 3.1. Tool & Platform Details
- **AI Tool Name:** Gemini Antigravity Agent (Google DeepMind).
- **Platform & Version:** Antigravity IDE / VS Code Agent Environment.
- **Access Time:** August 07 – August 08, 2026.

---

### 3.2. Task Summary & Prompt Log

#### Task 1: 3-Step Profile Setup Wizard (Feature 003 - Onboarding Profile Wizard)
- **Purpose of AI Use:** Assisted in structuring browser-side image compression using HTML5 Canvas and designing a 3-step Tinder-style wizard layout.
- **Key Prompt:**  
  > *"At the photo upload section, I want users to be able to upload photos directly from their local computer when clicking on any photo slot... adjust to max 4 photos in a balanced 2x2 grid... add date of birth constraints preventing future dates and enforcing age between 18 and 100 years old."*
- **AI-Generated Content:** Sample canvas code using `canvas.toDataURL('image/jpeg', 0.7)` downscaling to 600px width and age calculation logic.
- **Student Independent Work & Validation:**
  - Customized CSS `.photo-slot-card` styling in `src/loveyou-frontend/src/index.css`.
  - Integrated 18–100 age Zod schema validation in backend `src/loveyou-backend/src/validation/profileSchemas.js`.

---

#### Task 2: Dating Swiping Deck & Match Management (Feature 004 - Matching & Swiping Deck)
- **Purpose of AI Use:** Assisted in candidate pool recommendation logic, Tinder action button hover scale animations, candidate profile detail modal, and unmatch database purge logic.
- **Key Prompt:**  
  > *"Set default bot candidates to 5 while real registered users can still meet each other... add unmatch feature... when unmatching, database must also delete the records of matching between both users."*
- **AI-Generated Content:** 5 bot candidate definitions, `unmatchUser` function deleting records from PostgreSQL `Match` and `Swipe` tables.
- **Student Independent Work & Validation:**
  - Rewrote `handleSwipe` and `handleUnmatch` handler logic in `src/loveyou-frontend/src/pages/Dashboard.jsx`.
  - Verified database deletion using `npx prisma studio`.

---

#### Task 3: Minimalist Authentication Forms
- **Purpose of AI Use:** Removed input field icons (lock, user, envelope icons) across auth pages.
- **Key Prompt:**  
  > *"In the login page, remove lock icons, human icons..."*
- **AI-Generated Content:** Removed `icon` props from `Field` components across `Login.jsx`, `Signup.jsx`, `ForgotPassword.jsx`, and `ResetPassword.jsx`.
- **Student Independent Work & Validation:**
  - Verified component alignment and CSS `padding: 0 1rem`.

---

#### Task 4: C4 Level 3 Frontend Component Architecture Diagram
- **Purpose of AI Use:** Suggested Mermaid `C4Component` syntax for React SPA component architecture.
- **AI-Generated Content:** Mermaid diagram syntax representing component relationships.
- **Student Independent Work & Validation:**
  - Authored complete architecture document in `docs/management/PA4/FrontendComponentC4.md`.

---

## 4. Verification & Validation Results

| Test Category | Testing Method | Result |
| :--- | :--- | :---: |
| **Image Compression** | Uploaded 10MB image files ➔ Checked Canvas Base64 payload. | **Passed (~60KB/photo)** |
| **DOB Validation** | Attempted selecting future dates & birth year 2010 (<18 years old). | **Passed (Correct Error Messages)** |
| **Unmatch Purge** | Triggered Unmatch ➔ Inspected `Match` & `Swipe` tables in Prisma Studio. | **Passed (100% Records Deleted)** |
| **Git Synchronization** | Pushed commits to `Hoang---Tan` remote branch. | **Passed** |

---

## 5. Academic Integrity Declaration

> **Declaration:** *"I hereby declare that all source code and documentation produced for PA4 have been reviewed, tested, and fully understood by me. The use of AI assistance was strictly limited to code structure suggestions, refactoring, and UI optimizations, and in no way replaced my independent learning and analytical thinking."*
