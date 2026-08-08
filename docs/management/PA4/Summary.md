# PA4-2026 Summary

> **Author:**  Huy 
> **Reviewer:** Chiến 
> **Editor:** Nghĩa

## Overview

PA4-2026 is a teamwork assignment for the course **CS300 - CSC13002 - Introduction to Software Engineering**.

- **Total score:** 75 points
- **Duration:** 2–3 weeks
- **Format:** Teamwork assignment

The assignment focuses on revising previous requirements, documenting the software architecture, implementing two additional functional groups using Spec Kit, and reporting the team's development process.

---

# A. Revised Use-Case Specification - 2nd Submission

**Score: 5 points**

The team must revise the use-case model and use-case specifications based on the TA feedback from PA3-2026.

The revised documents should:

- Address the issues identified by the TA.
- Provide additional details where necessary.
- Remain consistent with the Vision Document.
- Be consistent with the features implemented in the project.

## Changes.md

The team must create a `Changes.md` file.

This file must clearly describe all changes made compared with the PA3-2026 version.

A single `Changes.md` file should be submitted for the PA submission, with separate sections for each revised document.

> Without `Changes.md`, the team will not receive points for this section.

---

# B. Software Architecture: System Context Diagram

**Score: 15 points**

The team must formally document the software architecture of the entire project, covering all features from PA1 through PA4.

## 1. Tech Stack

The architecture document must clearly describe the technologies used for:

- Frontend
- Backend
- Database
- Authentication services
- Cloud storage
- APIs
- Other system components

## 2. C4 Model - Level 1

The team must create a **System Context Diagram** following the C4 Model.

The diagram should show:

- The system as a whole.
- Users or actors interacting with the system.
- External systems that the project depends on.

The diagram must be accompanied by a written explanation.

## Format

The architecture document must:

- Be written in Markdown.
- Use Mermaid syntax for diagrams.

---

# C. Software Architecture: Container Diagram and Component Diagram

**Score: 20 points**

This section contains two levels of the C4 Model.

## 1. C4 Model - Level 2: Container Diagram

The Container Diagram should show the major containers of the system, such as:

- Web application
- Mobile application
- API server
- Database
- Other major containers

For each container, describe:

- Its responsibility.
- The services it provides.
- The technology or framework used.
- How it communicates with other containers.

Examples of communication methods include:

- HTTP/HTTPS
- WebSocket
- Database connection

## 2. C4 Model - Level 3: Component Diagram

The team must create Component Diagrams for:

- Frontend container
- Backend container

Each diagram should show:

- Major components.
- Responsibilities of the components.
- Relationships between components.

The team does **not** need to create Level 3 diagrams for every feature.

Instead, focus on the most important features that best represent the internal structure of the frontend and backend.

## Important Requirement

All architecture diagrams must accurately reflect the actual implementation.

Any inconsistency between the architecture documentation and the source code can result in a grade penalty.

The architecture document must also be kept up to date as the implementation continues.

---

# D. Deployment Diagram

**Score: 5 points**

The team must describe how the system is deployed by mapping the containers from Section C to the infrastructure where they run.

The Deployment Diagram must be created using Mermaid.

It should show:

- Physical or cloud infrastructure nodes.
- Containers deployed on each node.
- Communication between nodes.

Examples of infrastructure nodes include:

- Web server
- Application server
- Database server
- Mobile device
- Cloud services

If the system runs entirely on a local machine, each container should be treated as a separate logical node.

## For Each Node

The team should describe:

- Hardware or cloud service used.
- Containers or components running on the node.
- Communication protocols between nodes.

Examples:

- HTTPS
- TCP
- WebSocket

---

# E. Implement 2 Functional Groups Using Spec Kit

**Score: 25 points**

The team must continue implementing **2 additional functional groups** from the project.

Each functional group must cover the complete stack:

```text
Frontend
   ↓
Backend / API / Logic
   ↓
Database
```

Therefore, each functional group must be implemented **end-to-end**.

## Spec Kit

The team must use **Spec Kit** to drive the implementation process.

The complete spec-driven workflow must be followed.

## Test Cases

At this stage, Spec Kit will generate test cases for the implemented features.

The generated test cases must be included in the submission.

However, the team is **not required to fully understand or refine the test cases yet**.

Test review and refinement will be covered in PA5-2026.

## Submission

The team must submit:

- Video demonstration with narration.
- YouTube link to the video.
- Complete source code.
- Spec Kit artifacts.

The YouTube video can be:

- Public
- Unlisted

The source code should exclude:

- `node_modules`
- `venv`
- Build artifacts
- Other generated directories

Spec Kit artifacts include:

- Specifications
- Plans
- Tasks files

---

# F. AI Usage Report and Weekly Report

**Score: 5 points**

## 1. AI Usage Report

The team must follow the AI usage guidelines.

The team must declare whether AI tools were used during the sprint.

If AI tools were used, a detailed usage log must be submitted.

## 2. Weekly Report

The team must conduct and document:

- Sprint Planning
- Scrum Meetings
- Sprint Review

The team must follow the instructions provided in the separate `WeeklyReports` document.

## Jira Evidence

The submission must include Jira task screenshots showing:

- Task assignments.
- Progress during the sprint.

---

# Submission Guidelines

All documents must satisfy the following requirements.

## Language

All documents must be written in:

**English**

## File Format

Documents must be written in:

**Markdown (`.md`)**

The Markdown files must also be converted to:

**PDF**

Therefore, both versions should be submitted.

## Mermaid Diagrams

All required diagrams must use:

**Mermaid syntax**

This includes:

- System Context Diagram
- Container Diagram
- Component Diagram
- Deployment Diagram

## Work Attribution

For each report or document section, the team must indicate:

- Who performed the work.
- Who reviewed the work.
- Who edited the section.

This information must be placed on the first line immediately after the section header.

## Git Log

The team must provide a Git log showing the repository's commit history.

The Git log can be submitted as:

- Screenshot
- Exported log

---

# Final Submission Structure

A possible organization of the PA4 submission is:

```text
PA4-Group[GroupId]/
│
├── A/
│   ├── RevisedUseCase.md
│   ├── RevisedUseCase.pdf
│   └── Changes.md
│
├── B/
│   ├── TechStack.md
│   ├── TechStack.pdf
│   ├── SystemContext.md
│   └── SystemContext.pdf
│
├── C/
│   ├── ContainerDiagram.md
│   ├── ContainerDiagram.pdf
│   ├── FrontendComponentDiagram.md
│   ├── FrontendComponentDiagram.pdf
│   ├── BackendComponentDiagram.md
│   └── BackendComponentDiagram.pdf
│
├── D/
│   ├── DeploymentDiagram.md
│   └── DeploymentDiagram.pdf
│
├── E/
│   ├── SourceCode/
│   ├── Specs/
│   ├── Plans/
│   ├── Tasks/
│   ├── Tests/
│   └── DemoVideo.md
│
├── F/
│   ├── AIUsageReport.md
│   ├── WeeklyReport.md
│   └── JiraScreenshots/
│
└── GitLog/
    └── git-log.png
```

> The exact folder structure may be adjusted by the team as long as all required materials are included.

---

# PA4 Checklist

| Section | Requirement | Score | Status |
|---|---|---:|---|
| A | Revise Use-Case Specification | 5 | ☐ |
| A | Create `Changes.md` | Included in A | ☐ |
| B | Tech Stack | 15 | ☐ |
| B | C4 Level 1 - System Context | Included in B | ☐ |
| C | C4 Level 2 - Container Diagram | 20 | ☐ |
| C | C4 Level 3 - Frontend Component Diagram | Included in C | ☐ |
| C | C4 Level 3 - Backend Component Diagram | Included in C | ☐ |
| D | Deployment Diagram | 5 | ☐ |
| E | Implement 2 Functional Groups | 25 | ☐ |
| E | Use Spec Kit workflow | Included in E | ☐ |
| E | Generated test cases | Included in E | ☐ |
| E | Demo video | Included in E | ☐ |
| E | Complete source code | Included in E | ☐ |
| E | Spec Kit artifacts | Included in E | ☐ |
| F | AI Usage Report | 5 | ☐ |
| F | Weekly Report | Included in F | ☐ |
| F | Jira screenshots | Included in F | ☐ |
| Submission | Markdown files | Required | ☐ |
| Submission | PDF files | Required | ☐ |
| Submission | Git log | Required | ☐ |
| Submission | ZIP as `PA4-Group[GroupId]` | Required | ☐ |

---

# Important Points

The following requirements are particularly important for the submission:

1. All documents must be written in **English**.
2. Required diagrams must be written using **Mermaid**.
3. Architecture diagrams must accurately reflect the actual source code.
4. `Changes.md` is mandatory for Section A.
5. Two functional groups must be implemented end-to-end.
6. The Spec Kit workflow must be followed for the two functional groups.
7. Generated test cases must be included.
8. A narrated demo video must be submitted.
9. AI usage must be reported if AI tools were used.
10. Jira screenshots must demonstrate task assignments and progress.
11. Both Markdown and PDF versions of the documents must be submitted.
12. A Git log must be included.
13. All files must be compressed into `PA4-Group[GroupId].zip`.

---

# Conclusion

PA4-2026 combines four major areas of software engineering work:

- **Requirements revision**
- **Software architecture documentation**
- **Full-stack feature implementation**
- **Development process and reporting**

The architecture documentation must remain consistent with the actual project implementation throughout the PA4 development process.