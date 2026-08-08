# Use-Case Specification Changes – PA4

| Assignee | Reviewer | Editor |
| :--- | :--- | :--- |
| Minh Hoàng | Hoàng Tấn | Ngô Trung Nghĩa |

## 1. Purpose

This document records **what changed in the Use-Case Specification from the previous version to the official PA4 version**. It focuses on changes to the content and structure of the UC specifications.

## 2. Changes Made to the Use-Case Specification

| # | Previous Version | PA4 Change | Affected Area |
| :--- | :--- | :--- | :--- |
| 1 | `UC01: Sign Up` used an inconsistent actor | Changed the actor to `Guest User` | UC01 |
| 2 | UC identifiers and names were not consistently traceable to the model | Standardized `UC01`–`UC56` and corresponding names | UC01–UC56 |
| 3 | Some flows contained implementation-level details | Rewritten around actor actions and system responses | All UCs |
| 4 | Alternative Flows were sometimes generic or insufficiently explicit | Rewritten as concrete condition → system response → actor action flows | Alternative Flows |
| 5 | Prototype references were inconsistent | Standardized prototype naming and traceability where references are maintained in the specification | Prototype references |
| 6 | Model and Specification could use different actors/relationships | Aligned actors, UC names, IDs, Functional Groups, and major relationships | Model ↔ Specification |
| 7 | Some documentation contained unnecessary technical/implementation information | Removed technical implementation details from behavioral UC descriptions | All UCs |

## 3. UC01 Actor Change

### Previous

`UC01: Sign Up` did not consistently identify the actor as a guest.

### PA4

```text
Actor: Guest User
```

The specification now matches the Use-Case Model:

```text
Guest User → UC01: Sign Up
```

## 4. UC Identification and Traceability

The PA4 specification standardizes all identifiers:

```text
UC01 – UC56
```

Each specification uses the same UC identifier and name as the Use-Case Model.

This allows a reviewer to trace:

```text
Use-Case Model → UCxx → Use-Case Specification → UCxx
```

No additional UC was introduced by the PA4 revision.

## 5. Behavioral Flow Revision

The previous specification contained details that described implementation rather than user-visible system behavior.

The PA4 revision removes or avoids details such as:

- bcrypt configuration;
- JWT/token implementation;
- REST/API paths;
- HTTP status codes;
- database queries and internal records;
- WebSocket events;
- framework/service/class implementation details.

The Basic Flow now focuses on:

1. actor action;
2. system response;
3. subsequent actor/system interaction;
4. successful completion.

## 6. Alternative Flow Revision

Alternative Flows were rewritten to describe the actual behavior of the system.

Instead of generic statements such as:

```text
System detects the alternative condition.
System displays the appropriate state or message.
User can correct the input, retry, or leave the flow.
```

the PA4 specification describes the actual condition and response.

Example:

```text
AF: Email already registered

1. System detects that the email is already associated with an account.
2. System informs the Guest User that the email is already registered.
3. Guest User enters a different email or returns to Log In.
```

This makes Alternative Flows directly testable and understandable.

## 7. Prototype Reference Changes

Prototype references are standardized where they are maintained inside the Use-Case Specification.

Naming follows:

```text
prototypes/ucXX_<main-flow>.png
prototypes/ucXX_af<number>_<state>.png
```

For example:

```text
prototypes/uc28_search_filters.png
prototypes/uc28_af1_reset_filters.png
```

### Prototype paths intentionally omitted

The final specification intentionally does **not** include image file paths for:

- FG-01 Authentication & Authorization
- FG-02 User Profile Management
- FG-03 AI-Powered Smart Matching
- FG-07 Notification Center
- FG-08 Privacy & Safety Controls
- FG-09 Admin Dashboard

These UI prototypes are maintained separately and therefore are not duplicated as image links in this UC Specification.

Prototype references remain in the specification for the Functional Groups where they are maintained as part of the document.

## 8. UC Structure Standardization

Each UC follows a consistent structure where applicable:

- Use Case ID
- Use Case Name
- Actor(s)
- Description
- Preconditions
- Basic Flow / Main Success Scenario
- Alternative Flows
- Postconditions
- Prototype reference where applicable

This makes all 56 specifications easier to review and compare.

## 9. Relationship Alignment with the Use-Case Model

The specification was aligned with the final model for the major relationships, including:

```text
UC31 «include» UC34
UC35 «extend» UC31
UC36 «extend» UC31

UC49 «extend» UC48
UC50 «extend» UC48
UC51 «extend» UC50
UC52 «extend» UC50
UC53 «extend» UC50

UC55 «extend» UC54
UC56 «extend» UC54
```

The specification therefore no longer contradicts the final Use-Case Model.

## 10. Final Result

After the PA4 revision, the Use-Case Specification:

- covers **56 use cases (UC01–UC56)**;
- uses the same **3 actors** as the model;
- uses the same **10 Functional Groups**;
- provides clearer Basic and Alternative Flows;
- removes implementation-specific details;
- improves UC-to-model traceability;
- separates the UC Specification from the UI prototype files for the specified Functional Groups.
