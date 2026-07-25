# LoveYou Use-Case Model

**Author:** Nguyễn Minh Hoàng  
**Reviewer:** Lê Văn Hoàng Tấn 
## 1. Actors

### 1.1 User

A User is a registered individual who uses the LoveYou platform to find romantic connections. The User can manage their profile, receive AI-powered match suggestions, swipe through candidates, search for other users, communicate with matches, and manage privacy and safety settings.

### 1.2 Admin

An Admin is a platform administrator who manages and monitors the LoveYou system. The Admin can view platform statistics, manage user accounts, moderate reported users, and manage the interest tag catalogue.

## 2. Account, Profile, and Onboarding Use-Case Diagram

This diagram describes the use cases related to authentication, user profile management, account management, and the onboarding process.

### 2.1 Authentication Use Cases

```mermaid
flowchart LR
    User["User"]
    Admin["Admin"]

    subgraph LoveYou["LoveYou System"]
        UC01(["Sign Up"])
        UC02(["Log In"])
        UC03(["Log Out"])
        UC04(["Reset Password"])
        UC05(["Manage Session"])
        UC06(["Authorize Access by Role"])
    end

    User --> UC01
    User --> UC02
    User --> UC03
    User --> UC04

    Admin --> UC02
    Admin --> UC03

    UC02 -.->|«include»| UC05
    UC02 -.->|«include»| UC06
    UC04 -.->|«extend»| UC02
```

### 2.2 User Profile Management Use Cases

```mermaid
flowchart LR
    User["User"]

    subgraph LoveYou["LoveYou System"]
        UC07(["Edit Personal Information"])
        UC08(["Upload Photos"])
        UC09(["Manage Interest Tags"])
        UC10(["Change Password"])
    end

    User --> UC07
    User --> UC08
    User --> UC09
    User --> UC10
```

### 2.3 Onboarding and Preference Setup Use Cases
```mermaid
flowchart LR
    User["User"]

    subgraph LoveYou["LoveYou System"]
        UC11(["Complete Onboarding"])
        UC12(["Upload Initial Photo"])
        UC13(["Set Gender Preference"])
        UC14(["Set Preferred Age Range"])
        UC15(["Set Home City"])
        UC16(["Select Initial Interest Tags"])
        UC17(["Skip Onboarding"])
    end

    User --> UC11

    UC11 -.->|«include»| UC12
    UC11 -.->|«include»| UC13
    UC11 -.->|«include»| UC14
    UC11 -.->|«include»| UC15
    UC11 -.->|«include»| UC16

    UC17 -.->|«extend»| UC11
```

## 3. Discovery, Matching, and Communication Use-Case Diagrams

This section describes the use cases related to AI-powered matching, profile discovery, swiping, mutual matching, messaging, and notifications.

### 3.1 AI-Powered Smart Matching Use Cases

```mermaid
flowchart LR
    User["User"]

    subgraph LoveYou["LoveYou System"]
        UC18(["View AI Match Suggestions"])
        UC19(["Calculate Compatibility Score"])
        UC20(["Display Match Reasons"])
        UC21(["Refresh Suggestions"])
    end

    User --> UC18

    UC18 -.->|«include»| UC19
    UC18 -.->|«include»| UC20

    UC21 -.->|«extend»| UC18
```

### 3.2 Swipe and Match System Use Cases

```mermaid
flowchart LR
    User["User"]

    subgraph LoveYou["LoveYou System"]
        UC22(["Like Candidate"])
        UC23(["Skip Candidate"])
        UC24(["Create Mutual Match"])
        UC25(["Show Match Confirmation"])
        UC26(["View Match History"])
    end

    User --> UC22
    User --> UC23
    User --> UC26

    UC24 -.->|«extend»| UC22
    UC24 -.->|«include»| UC25
```

### 3.3 Advanced Search and Filtering Use Cases

```mermaid
flowchart LR
    User["User"]

    subgraph LoveYou["LoveYou System"]
        UC27(["Search Profiles"])
        UC28(["Apply Search Filters<br/>(gender, age range, city, interest tags)"])
        UC29(["Sort Search Results<br/>(recency or AI score)"])
        UC30(["View Paginated Results"])
    end

    User --> UC27

    UC28 -.->|«extend»| UC27
    UC29 -.->|«extend»| UC27
    UC27 -.->|«include»| UC30
```

### 3.4 Real-time Messaging Use Cases

```mermaid
flowchart LR
    User["User"]

    subgraph LoveYou["LoveYou System"]
        UC31(["View Conversations"])
        UC32(["Send Message"])
        UC33(["Receive Message"])
        UC34(["View Message History"])
        UC35(["View Online Status"])
        UC36(["View Typing Indicator"])
    end

    User --> UC31
    User --> UC32
    User --> UC33

    UC31 -.->|«include»| UC34
    UC31 -.->|«include»| UC35
    UC31 -.->|«include»| UC36
```

### 3.5 Notification Center Use Cases

```mermaid
flowchart LR
    User["User"]

    subgraph LoveYou["LoveYou System"]
        UC37(["View Notifications"])
        UC38(["Mark Notification as Read"])
        UC39(["Mark All Notifications as Read"])
        UC40(["Receive Match Notification"])
        UC41(["Receive Message Notification"])
    end

    User --> UC37
    User --> UC40
    User --> UC41

    UC38 -.->|«extend»| UC37
    UC39 -.->|«extend»| UC37
```

### 3.6 Privacy and Safety Controls Use Cases

```mermaid
flowchart LR
    User["User"]

    subgraph LoveYou["LoveYou System"]
        UC42(["Block User"])
        UC43(["Report User"])
        UC44(["Deactivate Account"])
        UC45(["Permanently Delete Account"])
    end

    User --> UC42
    User --> UC43
    User --> UC44
    User --> UC45
```
## 4. Administration Use-Case Diagrams

This section describes the use cases available to platform administrators, including viewing system statistics, managing user accounts, and managing the interest tag catalogue.

### 4.1 Admin Dashboard and User Management Use Cases

```mermaid
flowchart LR
    Admin["Admin"]

    subgraph LoveYou["LoveYou System"]
        UC46(["View Admin Dashboard"])
        UC47(["View Platform Statistics"])
        UC48(["Manage Users"])
        UC49(["Search Users"])
        UC50(["View User Details"])
        UC51(["Block User Account"])
        UC52(["Unblock User Account"])
        UC53(["Delete User Account"])
    end

    Admin --> UC46
    Admin --> UC48

    UC46 -.->|«include»| UC47

    UC48 -.->|«include»| UC49
    UC48 -.->|«include»| UC50

    UC51 -.->|«extend»| UC50
    UC52 -.->|«extend»| UC50
    UC53 -.->|«extend»| UC50
```

### 4.2 Interest Tag Catalogue Management Use Cases

```mermaid
flowchart LR
    Admin["Admin"]

    subgraph LoveYou["LoveYou System"]
        UC54(["Manage Interest Tag Catalogue"])
        UC55(["Add Interest Tag"])
        UC56(["Remove Interest Tag"])
    end

    Admin --> UC54

    UC54 -.->|«include»| UC55
    UC54 -.->|«include»| UC56
```

## 5. Functional Group Traceability

The following table maps each functional group in the project proposal to the corresponding use-case diagram section.

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