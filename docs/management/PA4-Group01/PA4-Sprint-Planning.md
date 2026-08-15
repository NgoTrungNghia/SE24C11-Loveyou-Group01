# PA4 - Sprint Planning

**Project:** LoveYou – AI-Enhanced Dating Web Application

**Duration:** 28/07/2026 – 08/08/2026

**Sprint Goal:** Complete the PA4 requirements by revising the Use-Case Specification, documenting the software architecture, implementing two additional functional groups using Spec Kit, and completing the required development-process evidence and submission package.

# 1. Sprint Backlog

| ID | Product Backlog Item | Priority | Assignee | Estimated Effort |
| :--- | :--- | :---: | :--- | :---: |
| SP4-01 | Revise Use-Case Model and Use-Case Specifications based on PA3 feedback | High | Huy | 10 h |
| SP4-02 | Create and maintain `Changes.md` for PA4 revisions | High | Nghĩa | 4 h |
| SP4-03 | Create Tech Stack and C4 Level 1 System Context documentation | High | Huy | 8 h |
| SP4-04 | Create C4 Level 2 Container Diagram and descriptions | High | Chiến | 8 h |
| SP4-05 | Create C4 Level 3 Frontend Component Diagram | High | Huy | 8 h |
| SP4-06 | Create C4 Level 3 Backend Component Diagram | High | Chiến | 10 h |
| SP4-07 | Create Deployment Diagram and deployment description | High | Nghĩa | 6 h |
| SP4-08 | Implement PA4 Functional Group 1 end-to-end using Spec Kit | High | Hoàng + Tấn | 20 h |
| SP4-09 | Implement PA4 Functional Group 2 end-to-end using Spec Kit | High | Hoàng + Tấn | 20 h |
| SP4-10 | Generate and include Spec Kit test cases | High | Văn | 8 h |
| SP4-11 | Integration, bug fixing and architecture consistency review | High | Whole Team | 12 h |
| SP4-12 | Prepare AI Usage Report, Weekly Report, Jira evidence and Git log | Medium | Nghĩa | 8 h |
| SP4-13 | Prepare narrated demo video and final PA4 submission package | High | Whole Team | 8 h |


# 2. Sprint Tasks

## 2.1 Requirements Revision

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Review PA3 TA feedback | Tường Huy | Feedback checklist |
| Revise Use-Case Model | Tường Huy | Revised Use-Case Model |
| Revise Use-Case Specifications | Tường Huy | Revised Use-Case Specifications |
| Record all PA3-to-PA4 changes | Nghĩa | `Changes.md` |
| Cross-check requirements against implemented features | Whole Team | Consistency review |

## 2.2 Software Architecture

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Review actual source-code architecture | Chiến + Huy | Architecture baseline |
| Document Tech Stack | Huy | Tech Stack section |
| Create C4 Level 1 System Context | Huy | System Context Diagram |
| Create C4 Level 2 Container Diagram | Chiến | Container Diagram |
| Create C4 Level 3 Frontend Component Diagram | Huy | Frontend Component Diagram |
| Create C4 Level 3 Backend Component Diagram | Chiến | Backend Component Diagram |
| Create Deployment Diagram | Nghĩa | Deployment Diagram |
| Verify architecture against source code | Whole Team | Architecture consistency checklist |

## 2.3 PA4 Feature Development

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Select and confirm Functional Group 1 | Whole Team | Confirmed PA4 FG |
| Select and confirm Functional Group 2 | Whole Team | Confirmed PA4 FG |
| Create Spec Kit specification for FG1 | Hoàng + Tấn | `specs/` artifacts |
| Create Spec Kit plan/tasks for FG1 | Hoàng + Tấn | `plans/`, `tasks/` artifacts |
| Implement FG1 frontend/backend/database flow | Hoàng + Tấn | Working FG1 |
| Create Spec Kit specification for FG2 | Hoàng + Tấn | `specs/` artifacts |
| Create Spec Kit plan/tasks for FG2 | Hoàng + Tấn | `plans/`, `tasks/` artifacts |
| Implement FG2 frontend/backend/database flow | Hoàng + Tấn | Working FG2 |
| Generate required test cases | Trọng Văn | Test artifacts |

## 2.4 Integration and Verification

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Integrate frontend and backend | Whole Team | Integrated Build |
| Verify database operations | Assigned developers | Working persistence |
| Run generated test cases | Trọng Văn + developers | Test results |
| Fix critical integration defects | Whole Team | Stable PA4 Build |
| Check architecture-documentation consistency | Whole Team | Final architecture review |

## 2.5 Submission and Process Evidence

| Task | Owner | Expected Output |
| :--- | :--- | :--- |
| Prepare AI Usage Report | Nghĩa | AI Usage Report |
| Prepare Weekly Report | Nghĩa | Weekly Report |
| Capture Jira task assignment/progress | Nghĩa | Jira screenshots |
| Export Git log | Nghĩa | Git log evidence |
| Record narrated demo | Whole Team | YouTube video |
| Convert Markdown documents to PDF | Whole Team | PDF package |
| Final submission review | Whole Team | PA4 ZIP |

# 3. Sprint Schedule

| Date | Activities |
| :--- | :--- |
| 28/07 | Sprint Planning and PA4 task assignment |
| 29/07 - 31/07 | Use-Case revision and architecture baseline |
| 30/07 | Scrum Meeting 1 |
| 01/08 - 04/08 | C4 Level 1/2/3 and Deployment documentation |
| 02/08 - 06/08 | Spec Kit workflow and implementation of two functional groups |
| 05/08 | Scrum Meeting 2 |
| 06/08 - 07/08 | Integration testing, bug fixing and architecture consistency review |
| 08/08 | Sprint Review, Sprint Retrospective and PA4 submission |

# 4. Definition of Done

A backlog item is considered completed when:

- The required implementation or document is completed.
- Source code and related artifacts are committed to GitHub.
- Documentation has been reviewed by another team member.
- Implemented functional groups work end-to-end across frontend, backend/API and database where applicable.
- Required Spec Kit artifacts are included.
- Generated test cases are included.
- No critical integration defects remain.
- Architecture documentation is consistent with the actual implementation.
- Required Markdown and PDF versions are prepared.
- The Product Owner/team accepts the deliverable.

# 5. Risks

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Architecture documentation does not match source code | High | Review diagrams against actual routes, components, APIs and database structure before submission |
| Spec Kit artifacts are incomplete | High | Follow the full specification → plan → tasks → implementation workflow and verify the artifact folders |
| Two functional groups cannot be completed end-to-end | High | Confirm scope early and prioritize critical frontend/backend/database paths |
| Integration conflicts | Medium | Frequent commits, pull requests and code reviews |
| Generated tests fail after implementation | Medium | Run tests during integration and fix critical failures before submission |
| Documentation takes time away from implementation | Medium | Assign documentation owners and review continuously |
| Missing submission evidence | High | Maintain a PA4 checklist for Jira, Git log, AI report, weekly report and demo video |
| Schedule delay | High | Prioritize Section E implementation and required architecture artifacts first |

# 6. Sprint Ceremonies

| Event | Schedule |
| :--- | :--- |
| Sprint Planning | 28/07/2026 |
| Daily Scrum | Regular short team meetings |
| Scrum Meeting 1 | 30/07/2026 |
| Scrum Meeting 2 | 05/08/2026 |
| Sprint Retrospective | 08/08/2026 |

# 7. Expected Deliverables

- Revised Use-Case Model
- Revised Use-Case Specifications
- `Changes.md`
- Tech Stack documentation
- C4 Level 1 System Context Diagram
- C4 Level 2 Container Diagram
- C4 Level 3 Frontend Component Diagram
- C4 Level 3 Backend Component Diagram
- Deployment Diagram
- Two implemented PA4 Functional Groups
- Spec Kit specifications, plans and tasks
- Generated test cases
- Complete source code excluding generated/dependency directories
- Narrated demo video with YouTube link
- AI Usage Report
- Weekly Report
- Jira screenshots
- Git log
- Markdown and PDF documentation
- Final PA4 submission package

# 8. Acceptance Criteria

Sprint 4 is considered successful if:

- Revised requirements are consistent with PA3 feedback and current implementation.
- `Changes.md` clearly records changes from PA3.
- C4 Level 1, Level 2 and Level 3 architecture diagrams are complete and consistent with the source code.
- Deployment architecture is documented using Mermaid.
- Two additional functional groups are implemented end-to-end using the required Spec Kit workflow.
- Spec Kit specifications, plans, tasks and generated test cases are included.
- The implemented features can be demonstrated in the narrated video.
- AI usage, weekly process, Jira progress and Git history are documented.
- Required Markdown and PDF files are complete.
- The final PA4 submission package is reviewed by all team members before submission.
