# Changes.md

## Changes from PA3 to PA4

| Section | PA3 | PA4 | Reason |
| :--- | :--- | :--- | :--- |
| Document Header | The document contained the temporary note **"Repairing Use-Case Model: Feedback from assistant teacher."** and an additional author/reviewer/editor table. | The temporary repair note and duplicate metadata table were removed. | The PA4 version is the finalized Use-Case Model after applying the feedback. |
| Authentication Actors | `Guest User` was used as an actor for `Sign Up` and `Log In`, while `User` handled authenticated actions. | The PA4 model uses **User** directly for `Sign Up`, `Log In`, `Log Out`, and `Reset Password`; **Admin** can also log in and log out. | The actor model was simplified and aligned with the finalized PA4 Use-Case Model. |
| Authentication Use-Case Names | Authentication use cases included the `UC01`, `UC02`, etc. identifiers in the diagram labels. | The PA4 diagram keeps the use-case names without the `UCxx:` prefix. | Simplifies the diagram presentation while preserving the same functional use cases. |
| Advanced Search & Filtering | `Apply Search Filters` and `Sort Search Results` included implementation examples such as gender, age range, city, interest tags, recency, and AI score. | The PA4 version uses the more general names **Apply Search Filters** and **Sort Search Results**. | Keeps the Use-Case Model focused on user goals instead of implementation-specific details. |
| Real-time Messaging | `View Message History`, `View Online Status`, and `View Typing Indicator` were modeled as optional extensions of `View Conversations`. | The PA4 version models these three behaviors as **«include»** relationships from `View Conversations`. | Finalized the relationship structure used by the PA4 Use-Case Model. |
| Admin User Management | `Search Users` and `View User Details` were modeled as optional extensions of `Manage Users`. | The PA4 version models `Search Users` and `View User Details` as **«include»** relationships from `Manage Users`. | Finalized the relationship structure used by the PA4 Use-Case Model. |
| Overall Model | The PA3 version represented the earlier use-case model before the final revision. | The PA4 version keeps the same 10 functional groups and core use cases while refining actors, naming, and relationships. | The PA4 revision is primarily a refinement of the existing model rather than the introduction of new functional groups. |

## 1. Authentication Changes

### PA3
- `Guest User` was explicitly modeled as an actor.
- `Guest User` was connected to `Sign Up` and `Log In`.
- `User` was connected to `Log In`, `Log Out`, and `Reset Password`.

### PA4
- The `Guest User` actor was removed.
- `User` is connected to:
  - `Sign Up`
  - `Log In`
  - `Log Out`
  - `Reset Password`
- `Admin` remains connected to:
  - `Log In`
  - `Log Out`

### Result
The authentication model is simplified by using the existing `User` actor rather than introducing a separate `Guest User` actor.

---

## 2. Advanced Search & Filtering Changes

### PA3
The use-case labels contained examples of the supported filters and sorting criteria:

- `Apply Search Filters (gender, age range, city, interest tags)`
- `Sort Search Results (recency or AI score)`

### PA4
The labels were simplified to:

- `Apply Search Filters`
- `Sort Search Results`

### Result
The PA4 model describes the user goals at a higher level and avoids placing implementation or parameter details directly inside the use-case name.

---

## 3. Real-time Messaging Changes

### PA3
The following relationships were modeled as `«extend»`:

- `View Message History` → `View Conversations`
- `View Online Status` → `View Conversations`
- `View Typing Indicator` → `View Conversations`

### PA4
The same relationships are modeled as `«include»`:

- `View Conversations` → `View Message History`
- `View Conversations` → `View Online Status`
- `View Conversations` → `View Typing Indicator`

### Result
The PA4 model treats these behaviors as included parts of viewing conversations.

---

## 4. Admin User Management Changes

### PA3
The following relationships were modeled as `«extend»`:

- `Search Users` → `Manage Users`
- `View User Details` → `Manage Users`

### PA4
The relationships are changed to `«include»`:

- `Manage Users` → `Search Users`
- `Manage Users` → `View User Details`

### Result
The PA4 model treats searching users and viewing user details as included operations within user management.

---

## 5. Use-Case Model Formatting Changes

The PA4 document also removes the temporary repair annotation and keeps the finalized model structure.

The functional-group traceability remains unchanged:

| Functional Group | Description | Use-Case Model Section |
|---|---|---|
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

## Summary

The PA4 Use-Case Model does not introduce new functional groups. Instead, it finalizes the model by:

1. Simplifying the authentication actor structure.
2. Removing implementation-specific details from search and sorting use-case names.
3. Revising the relationships in the Real-time Messaging section.
4. Revising the relationships in the Admin User Management section.
5. Removing the temporary repair note and finalizing the document structure.

These changes represent the official PA4 version of the Use-Case Model.
