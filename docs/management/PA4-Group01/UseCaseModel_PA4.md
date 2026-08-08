# LoveYou Use-Case Model

| Assignee | Reviewer | Editor |
| :--- | :--- | :--- |
| Minh Hoàng | Hoàng Tấn | Ngô Trung Nghĩa |

## 1. Actors

### 1.1 Guest User

A Guest User is a person who has not yet registered or logged in. The Guest User can create an account and access the login function.

### 1.2 User

A User is a registered and authenticated person who uses LoveYou to manage a profile, discover candidates, communicate with matches, and manage privacy and safety settings.

### 1.3 Admin

An Admin is an authorized platform administrator who manages users, monitors platform statistics, and manages the interest-tag catalogue.

> **Modeling note:** Use-case IDs (`UC01`–`UC56`) are shown directly in the diagrams so that every diagram can be traced unambiguously to `UseCaseSpecification.md`.

## 2. Account, Profile, and Onboarding

### 2.1 Authentication & Authorization (FG-01)

```mermaid
flowchart LR
    GuestUser["Guest User"]
    User["User"]
    Admin["Admin"]
    subgraph LoveYou["LoveYou System"]
        UC01(["UC01: Sign Up"])
        UC02(["UC02: Log In"])
        UC03(["UC03: Log Out"])
        UC04(["UC04: Reset Password"])
        UC05(["UC05: Manage Session"])
        UC06(["UC06: Authorize Access by Role"])
    end
    GuestUser --> UC01
    GuestUser --> UC02
    User --> UC02
    User --> UC03
    User --> UC04
    Admin --> UC02
    Admin --> UC03
    UC02 -.->|«include»| UC05
    UC02 -.->|«include»| UC06
```

### 2.2 User Profile Management (FG-02)

```mermaid
flowchart LR
    User["User"]
    subgraph LoveYou["LoveYou System"]
        UC07(["UC07: Edit Personal Information"])
        UC08(["UC08: Upload Photos"])
        UC09(["UC09: Manage Interest Tags"])
        UC10(["UC10: Change Password"])
    end
    User --> UC07
    User --> UC08
    User --> UC09
    User --> UC10
```

### 2.3 Onboarding & Preference Setup (FG-10)

```mermaid
flowchart LR
    User["User"]
    subgraph LoveYou["LoveYou System"]
        UC11(["UC11: Complete Onboarding"])
        UC12(["UC12: Upload Initial Photo"])
        UC13(["UC13: Set Gender Preference"])
        UC14(["UC14: Set Preferred Age Range"])
        UC15(["UC15: Set Home City"])
        UC16(["UC16: Select Initial Interest Tags"])
        UC17(["UC17: Skip Onboarding"])
    end
    User --> UC11
    UC11 -.->|«include»| UC12
    UC11 -.->|«include»| UC13
    UC11 -.->|«include»| UC14
    UC11 -.->|«include»| UC15
    UC11 -.->|«include»| UC16
    UC17 -.->|«extend»| UC11
```

## 3. Discovery, Matching, and Communication

### 3.1 AI-Powered Smart Matching (FG-03)

```mermaid
flowchart LR
    User["User"]
    subgraph LoveYou["LoveYou System"]
        UC18(["UC18: View AI Match Suggestions"])
        UC19(["UC19: Calculate Compatibility Score"])
        UC20(["UC20: Display Match Reasons"])
        UC21(["UC21: Refresh Suggestions"])
    end
    User --> UC18
    UC18 -.->|«include»| UC19
    UC18 -.->|«include»| UC20
    UC21 -.->|«extend»| UC18
```

### 3.2 Swipe & Match System (FG-04)

```mermaid
flowchart LR
    User["User"]
    subgraph LoveYou["LoveYou System"]
        UC22(["UC22: Like Candidate"])
        UC23(["UC23: Skip Candidate"])
        UC24(["UC24: Create Mutual Match"])
        UC25(["UC25: Show Match Confirmation"])
        UC26(["UC26: View Match History"])
    end
    User --> UC22
    User --> UC23
    User --> UC26
    UC24 -.->|«extend»| UC22
    UC24 -.->|«include»| UC25
```

### 3.3 Advanced Search & Filtering (FG-05)

```mermaid
flowchart LR
    User["User"]
    subgraph LoveYou["LoveYou System"]
        UC27(["UC27: Search Profiles"])
        UC28(["UC28: Apply Search Filters"])
        UC29(["UC29: Sort Search Results"])
        UC30(["UC30: View Paginated Results"])
    end
    User --> UC27
    UC28 -.->|«extend»| UC27
    UC29 -.->|«extend»| UC27
    UC27 -.->|«include»| UC30
```

### 3.4 Real-time Messaging (FG-06)

```mermaid
flowchart LR
    User["User"]
    subgraph LoveYou["LoveYou System"]
        UC31(["UC31: View Conversations"])
        UC32(["UC32: Send Message"])
        UC33(["UC33: Receive Message"])
        UC34(["UC34: View Message History"])
        UC35(["UC35: View Online Status"])
        UC36(["UC36: View Typing Indicator"])
    end
    User --> UC31
    User --> UC32
    User --> UC33
    UC31 -.->|«include»| UC34
    UC35 -.->|«extend»| UC31
    UC36 -.->|«extend»| UC31
```

### 3.5 Notification Center (FG-07)

```mermaid
flowchart LR
    User["User"]
    subgraph LoveYou["LoveYou System"]
        UC37(["UC37: View Notifications"])
        UC38(["UC38: Mark Notification as Read"])
        UC39(["UC39: Mark All Notifications as Read"])
        UC40(["UC40: Receive Match Notification"])
        UC41(["UC41: Receive Message Notification"])
    end
    User --> UC37
    User --> UC38
    User --> UC39
    UC40 -.->|«extend»| UC37
    UC41 -.->|«extend»| UC37
```

### 3.6 Privacy & Safety Controls (FG-08)

```mermaid
flowchart LR
    User["User"]
    subgraph LoveYou["LoveYou System"]
        UC42(["UC42: Block User"])
        UC43(["UC43: Report User"])
        UC44(["UC44: Deactivate Account"])
        UC45(["UC45: Permanently Delete Account"])
    end
    User --> UC42
    User --> UC43
    User --> UC44
    User --> UC45
```

## 4. Administration

### 4.1 Admin Dashboard & User Management (FG-09)

```mermaid
flowchart LR
    Admin["Admin"]
    subgraph LoveYou["LoveYou System"]
        UC46(["UC46: View Admin Dashboard"])
        UC47(["UC47: View Platform Statistics"])
        UC48(["UC48: Manage Users"])
        UC49(["UC49: Search Users"])
        UC50(["UC50: View User Details"])
        UC51(["UC51: Block User Account"])
        UC52(["UC52: Unblock User Account"])
        UC53(["UC53: Delete User Account"])
    end
    Admin --> UC46
    Admin --> UC48
    Admin --> UC54
    UC46 -.->|«include»| UC47
    UC49 -.->|«extend»| UC48
    UC50 -.->|«extend»| UC48
    UC51 -.->|«extend»| UC50
    UC52 -.->|«extend»| UC50
    UC53 -.->|«extend»| UC50
```

### 4.2 Interest Tag Catalogue Management (FG-09)

```mermaid
flowchart LR
    Admin["Admin"]
    subgraph LoveYou["LoveYou System"]
        UC54(["UC54: Manage Interest Tag Catalogue"])
        UC55(["UC55: Add Interest Tag"])
        UC56(["UC56: Remove Interest Tag"])
    end
    Admin --> UC54
    UC46 -.->|«include»| UC47
    UC49 -.->|«extend»| UC48
    UC50 -.->|«extend»| UC48
    UC51 -.->|«extend»| UC50
    UC52 -.->|«extend»| UC50
    UC53 -.->|«extend»| UC50
    UC55 -.->|«extend»| UC54
    UC56 -.->|«extend»| UC54
```

## 5. Functional Group Traceability

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

## 6. Modeling Corrections Applied for PA4

1. `Guest User` is explicitly modeled for `UC01: Sign Up`, addressing the TA feedback that a registered `User` should not be the actor for sign-up.
2. UC identifiers remain visible in every diagram.
3. Relationship directions are written from the base use case to the included use case for `«include»`.
4. Optional behaviors are modeled with `«extend»` where they are conditional rather than mandatory.
5. The previous temporary repair note and duplicate responsibility table are removed.
6. Search/filter labels remain user-goal oriented; implementation details are kept out of the use-case model.
7. The model contains the same 56 use cases and 10 functional groups as the supplied PA4 model.
