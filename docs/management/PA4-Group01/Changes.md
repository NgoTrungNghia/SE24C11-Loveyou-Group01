# Changes.md

# LoveYou – PA4 Changes from PA3

| Assignee | Reviewer | Editor |
| :--- | :--- | :--- |
| Minh Hoàng | Hoàng Tấn | Ngô Trung Nghĩa |

## 1. Purpose

This document records the changes made to the **LoveYou Use-Case Model** and **Use-Case Specification** from the previous PA3 version to the official PA4 version.

The previous PA3 documents are retained as the baseline. This single `Changes.md` file consolidates the changes for both revised documents, as required for the PA4 submission.

The purpose of the revision is to:

- address the previous TA feedback;
- improve consistency between the Use-Case Model and Use-Case Specification;
- improve UC-to-model traceability;
- clarify use-case relationships;
- remove unnecessary implementation-oriented information from behavioral specifications;
- standardize the structure and prototype references of the specifications.

---

# 2. Revised Document 1 – Use-Case Model

**Document:** `UseCaseModel_PA4.md`

## 2.1 Summary of Changes

| # | Previous Version | PA4 Revision | Affected UC / Area |
| :--- | :--- | :--- | :--- |
| 1 | `User` was associated with Sign Up | Changed the actor of `UC01: Sign Up` to `Guest User` | UC01 |
| 2 | UC identifiers were not consistently visible in diagrams | Standardized visible identifiers `UC01`–`UC56` | UC01–UC56 |
| 3 | Messaging relationships were not sufficiently clear | Clarified mandatory message history and optional real-time behaviors | UC31, UC34, UC35, UC36 |
| 4 | Admin user-management relationships needed clarification | Separated main management from optional search/detail operations | UC48–UC53 |
| 5 | Search/filtering labels contained unnecessary implementation-oriented wording | Kept search-related use cases focused on user goals | UC27–UC30 |
| 6 | Temporary repair/feedback material remained in the model documentation | Removed temporary repair notes and duplicate responsibility content | Model documentation |
| 7 | Functional Group traceability was not sufficiently explicit | Standardized Functional Group mapping to model sections | FG-01–FG-10 |

## 2.2 Actor Correction – UC01: Sign Up

### Previous Version

`UC01: Sign Up` used:

```text
User
```

### PA4 Revision

The actor is changed to:

```text
Guest User → UC01: Sign Up
```

A `Guest User` represents a person who has not registered or authenticated yet. After successful registration and login, the person can act as a `User`.

The final model therefore distinguishes:

- `Guest User` – registration and access to login;
- `User` – authenticated application functions;
- `Admin` – administrative functions.

## 2.3 Use-Case Identifier and Traceability

### Previous Version

Some diagrams did not consistently display the use-case identifier.

### PA4 Revision

All use cases are explicitly identified as:

```text
UC01 – UC56
```

The identifier shown in each diagram corresponds directly to the same identifier in the Use-Case Specification.

No additional use case was introduced by this revision. The final model contains **56 use cases**.

The intended traceability is:

```text
Use-Case Model → UCxx → Use-Case Specification → UCxx
```

## 2.4 Messaging Relationship Changes

The messaging area was revised to distinguish required conversation behavior from optional real-time information.

### PA4 Revision

```text
UC31: View Conversations
    «include»
        UC34: View Message History

UC35: View Online Status
    «extend»
        UC31: View Conversations

UC36: View Typing Indicator
    «extend»
        UC31: View Conversations
```

This separates the required message-history behavior from optional online-status and typing-indicator behavior.

## 2.5 Admin User-Management Relationship Changes

`UC48: Manage Users` is the main administrative management function.

### PA4 Revision

```text
UC49: Search Users
    «extend»
        UC48: Manage Users

UC50: View User Details
    «extend»
        UC48: Manage Users

UC51: Block User Account
    «extend»
        UC50: View User Details

UC52: Unblock User Account
    «extend»
        UC50: View User Details

UC53: Delete User Account
    «extend»
        UC50: View User Details
```

These relationships distinguish the general user-management function from optional search/detail and account-management operations.

## 2.6 Interest Tag Catalogue Changes

The administration model separates the catalogue-management function from its optional operations.

```text
UC54: Manage Interest Tag Catalogue

UC55: Add Interest Tag
    «extend»
        UC54: Manage Interest Tag Catalogue

UC56: Remove Interest Tag
    «extend»
        UC54: Manage Interest Tag Catalogue
```

## 2.7 Search and Filtering Changes

The search area remains divided into separate user goals:

- `UC27: Search Profiles`
- `UC28: Apply Search Filters`
- `UC29: Sort Search Results`
- `UC30: View Paginated Results`

Implementation-specific mechanisms are not used as the primary use-case names.

## 2.8 Model Cleanup

The PA4 model removes temporary material that is not part of the final use-case model, including:

- temporary repair/feedback notes;
- duplicate responsibility information;
- unnecessary implementation-level wording.

## 2.9 Functional Group Traceability

The PA4 model standardizes the mapping between Functional Groups and Use-Case Model sections:

| Functional Group | Description | Use-Case Model Section |
| :--- | :--- | :--- |
| FG-01 | Authentication & Authorization | Section 2.1 |
| FG-02 | User Profile Management | Section 2.2 |
| FG-03 | AI-Powered Smart Matching | Section 3.1 |
| FG-04 | Swipe & Match System | Section 3.2 |
| FG-05 | Advanced Search & Filtering | Section 3.3 |
| FG-06 | Real-time Messaging | Section 3.4 |
| FG-07 | Notification Center | Section 3.5 |
| FG-08 | Privacy & Safety Controls | Section 3.6 |
| FG-09 | Admin Dashboard | Sections 4.1 and 4.2 |
| FG-10 | Onboarding & Preference Setup | Section 2.3 |

## 2.10 Final Result

After the PA4 revision, the Use-Case Model contains:

- **3 actors:** Guest User, User, Admin
- **56 use cases:** UC01–UC56
- **10 Functional Groups:** FG-01–FG-10

The revised model is intended to be directly traceable to the PA4 Use-Case Specification.

---

# 3. Revised Document 2 – Use-Case Specification

**Document:** `UseCaseSpecification_PA4.md`

## 3.1 Summary of Changes

| # | Previous Version | PA4 Revision | Affected UC / Area |
| :--- | :--- | :--- | :--- |
| 1 | `UC01: Sign Up` did not consistently use the correct actor | Changed the primary actor to `Guest User` | UC01 |
| 2 | UC identification was not sufficiently emphasized for direct model-to-specification tracing | Standardized `UC01`–`UC56` throughout the specification | UC01–UC56 |
| 3 | Some flows contained implementation-level details | Rewritten around actor actions and system responses | All UCs |
| 4 | Alternative Flows were sometimes generic or insufficiently explicit | Revised to describe concrete conditions, system responses, and actor actions | Alternative Flows |
| 5 | Prototype references were inconsistent | Standardized prototype naming and traceability | Prototype references |
| 6 | Specification and model could differ in actors, IDs, names, or relationships | Aligned the specification with the final Use-Case Model | Model ↔ Specification |
| 7 | Some UC sections did not follow a consistent structure | Standardized the structure used by the specifications | All UCs |

## 3.2 Actor Correction – UC01: Sign Up

### Previous Version

`UC01: Sign Up` did not consistently identify the actor as a guest user.

### PA4 Revision

The specification now defines:

```text
Actor: Guest User
```

The Sign Up flow therefore represents a person who has not registered yet.

The specification is aligned with the model:

```text
Guest User → UC01: Sign Up
```

## 3.3 Use-Case Identification and Traceability

### Previous Version

Use-case identification was not consistently emphasized for direct model-to-specification tracing.

### PA4 Revision

All specifications retain their identifiers:

```text
UC01 – UC56
```

Each UC section uses the same identifier and name as the final Use-Case Model.

The intended traceability is:

```text
Use-Case Model → UCxx → Use-Case Specification → UCxx
```

No additional use case was introduced by the PA4 revision.

## 3.4 Behavioral-Level Revision

The previous specification contained information that described implementation rather than user-visible behavior.

The PA4 revision removes or avoids implementation-specific details from the main behavioral flows, including:

- bcrypt configuration;
- JWT/token implementation details;
- REST/API paths;
- HTTP status codes;
- database queries and internal database records;
- WebSocket implementation details;
- framework, service, or class implementation details.

The revised UC flows focus on:

1. actor action;
2. system response;
3. subsequent actor/system interaction;
4. successful completion or an alternative condition.

## 3.5 Alternative Flow Revision

Alternative Flows were revised to describe the actual condition and resulting behavior rather than using only generic statements.

### Previous Style

```text
System detects the alternative condition.
System displays the appropriate state or message.
User can correct the input, retry, or leave the flow.
```

### PA4 Style

The intended structure is:

```text
condition → system response → actor action
```

### Example – Email Already Registered

```text
1. System detects that the submitted email is already associated with an account.
2. System informs the Guest User that the email is already registered.
3. Guest User enters a different email or returns to Log In.
```

This makes the Alternative Flow more specific, understandable, and testable.

## 3.6 Prototype Reference Changes

Prototype references were standardized where they are maintained inside the Use-Case Specification.

The naming convention follows:

```text
prototypes/ucXX_<main-flow>.png
prototypes/ucXX_af<number>_<state>.png
```

Examples:

```text
prototypes/uc28_search_filters.png
prototypes/uc28_af1_reset_filters.png

prototypes/uc01_sign_up.png
prototypes/uc01_af1_invalid_registration_information.png
prototypes/uc01_af2_email_already_registered.png
```

When an Alternative Flow produces a distinct visible UI state, a dedicated prototype reference is used where that prototype is maintained as part of the project documentation.

Prototype paths for UI prototypes maintained separately are not duplicated unnecessarily inside the UC Specification.

## 3.7 Use-Case Structure Standardization

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

## 3.8 Alignment with the Use-Case Model

The PA4 specification is aligned with the final model for the major relationships, including:

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

The following information must remain consistent between the two documents:

- actor names;
- UC identifiers;
- use-case names;
- Functional Group assignment;
- major include/extend relationships.

## 3.9 Final Result

After the PA4 revision, the Use-Case Specification:

- covers **56 use cases (UC01–UC56)**;
- uses the same **3 actors:** Guest User, User, Admin;
- uses the same **10 Functional Groups** as the model;
- focuses behavioral flows on actor actions and system responses;
- provides clearer Alternative Flows;
- standardizes prototype references;
- removes implementation-specific details from behavioral UC descriptions;
- improves traceability between the Use-Case Model and Use-Case Specification.

The previous specification remains the baseline; this document records the changes that produced the official PA4 specification.

---

# 4. Cross-Document Consistency Check

The two revised PA4 documents are intended to remain consistent in the following areas:

| Consistency Item | Use-Case Model | Use-Case Specification |
| :--- | :---: | :---: |
| Actors | Guest User, User, Admin | Guest User, User, Admin |
| Use Cases | UC01–UC56 | UC01–UC56 |
| Functional Groups | FG-01–FG-10 | FG-01–FG-10 |
| UC01 Actor | Guest User | Guest User |
| Messaging relationships | UC31, UC34, UC35, UC36 | Same relationships |
| Admin relationships | UC48–UC53 | Same relationships |
| Interest-tag relationships | UC54–UC56 | Same relationships |
| Search/filtering | UC27–UC30 | Same UC names and goals |
| Traceability | Model → UCxx | Specification → UCxx |

---

# 5. PA4 Revision Outcome

The PA4 revision results in:

1. A revised Use-Case Model containing **3 actors, 56 use cases, and 10 Functional Groups**.
2. A revised Use-Case Specification containing the same **UC01–UC56** identifiers and names.
3. Consistent actor naming, especially `Guest User` for `UC01: Sign Up`.
4. Clearer include/extend relationships for messaging, administration, and interest-tag management.
5. Better separation between user goals and implementation details.
6. More explicit and testable Alternative Flows.
7. Standardized prototype references and UC structure.
8. Direct traceability between the Use-Case Model and Use-Case Specification.

