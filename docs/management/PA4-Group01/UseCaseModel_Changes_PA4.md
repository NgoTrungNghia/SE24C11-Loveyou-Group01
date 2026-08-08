# Use-Case Model Changes – PA4

| Assignee | Reviewer | Editor |
| :--- | :--- | :--- |
| Minh Hoàng | Hoàng Tấn | Ngô Trung Nghĩa |

## 1. Purpose

This document records **what changed in the Use-Case Model from the previous version to the official PA4 version**. It is not a general description of the final model.

## 2. Changes Made to the Use-Case Model

| # | Previous Version | PA4 Change | Affected UC / Area |
| :--- | :--- | :--- | :--- |
| 1 | `User` was associated with Sign Up | Changed the Sign Up actor to `Guest User` | UC01 |
| 2 | UC identifiers were not consistently shown in diagrams | Added/standardized `UC01`–`UC56` identifiers in diagrams | UC01–UC56 |
| 3 | Messaging relationships were unclear / incorrectly modeled | Clarified mandatory and optional conversation behavior | UC31, UC34, UC35, UC36 |
| 4 | Admin user-management relationships needed clarification | Separated main management from optional search/detail operations | UC48–UC53 |
| 5 | Search/filtering labels contained unnecessary implementation-oriented detail | Kept use-case names focused on user goals | UC27–UC30 |
| 6 | Model contained temporary repair/feedback material | Removed temporary repair notes and duplicate responsibility content | Model documentation |
| 7 | Traceability between Functional Groups and UC sections was not sufficiently explicit | Standardized Functional Group traceability | FG-01–FG-10 |

## 3. Actor Change

### Previous

`UC01: Sign Up` used:

```text
User
```

### PA4

`UC01: Sign Up` now uses:

```text
Guest User
```

Reason: a person performing registration has not yet become a registered/authenticated `User`.

The final model therefore distinguishes:

- `Guest User` – registration and access to login;
- `User` – authenticated application functions;
- `Admin` – administrative functions.

## 4. Use-Case Identifier Change

The PA4 diagrams explicitly show:

```text
UC01 – UC56
```

This makes each diagram element directly traceable to the corresponding use-case specification.

No new use cases were added for this change; the final model still contains **56 use cases**.

## 5. Messaging Relationship Changes

The messaging part of the model was clarified.

### Previous issue

The relationship between viewing conversations, message history, online status, and typing status was not sufficiently clear.

### PA4

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

This separates the required message-history behavior from optional real-time information.

## 6. Admin User Management Changes

The relationship around `UC48: Manage Users` was clarified.

### PA4

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

These relationships distinguish the general user-management function from optional operations.

## 7. Interest Tag Catalogue Changes

The administration model separates the catalogue-management function from its optional operations:

```text
UC54: Manage Interest Tag Catalogue
    «extend»
        UC55: Add Interest Tag

UC56: Remove Interest Tag
    «extend»
        UC54: Manage Interest Tag Catalogue
```

The final PA4 model keeps `UC55` and `UC56` as optional extensions of `UC54`.

## 8. Search and Filtering Changes

The search area was kept as separate user goals:

- `UC27: Search Profiles`
- `UC28: Apply Search Filters`
- `UC29: Sort Search Results`
- `UC30: View Paginated Results`

Implementation-specific mechanisms are not used as use-case names.

## 9. Model Cleanup

The final PA4 model removes temporary material that was not part of the actual use-case model, including:

- temporary repair/feedback notes;
- duplicate responsibility information;
- unnecessary implementation-level wording.

## 10. Final Result

After the PA4 changes, the Use-Case Model contains:

- **3 actors:** Guest User, User, Admin
- **56 use cases:** UC01–UC56
- **10 Functional Groups:** FG-01–FG-10

The purpose of the revision is to make the model consistent with the TA feedback and directly traceable to the Use-Case Specification.
