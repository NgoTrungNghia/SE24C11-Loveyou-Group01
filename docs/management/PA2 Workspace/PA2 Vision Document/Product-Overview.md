# 4. Product Overview

> **Author:** Vũ Lê Trọng Văn
> **Student ID:** 20127095
> **Group Number / Group Name:** 01 / Loveyou 

---

## 4.1 Product Perspective

> *LoveYou is an AI-enhanced dating web application tailored specifically for Vietnamese users—ranging from university students to working professionals—to find genuinely meaningful romantic connections online.*

---

### Core Differentiation

> Unlike traditional platforms like Tinder or Bumble, which rely on random, low-context swipe mechanics that force snap, superficial decisions, LoveYou optimizes the user experience through two core pillars:

| Pillar | Details |
| :--- | :--- |
| **AI Smart Matching Engine** | Automatically conducts a deep, multi-dimensional analysis of each user pair across four distinct areas: shared interests, biography content, age preference alignment, and geographic proximity. |
| **Transparent Outputs** | Delivers a data-driven **Compatibility Score (0–100)** paired with a concise, human-readable explanation in Vietnamese detailing exactly why the two individuals are a good match. |

---

### Operating Ecosystem

> LoveYou transforms passive profile browsing into an informed, transparent decision-making process via:[cite: 2]

* A **responsive web interface** fully optimized and synchronized for both desktop browsers and mobile devices.
* A robustly structured architecture divided into **core functional modules** to guarantee a seamless, secure, and engaging end-to-end user journey.

---

### Core Functional Modules

| Field | Details |
|---|---|
| **Module ID** | MOD-01 |
| **Name** | Authentication, Authorization, Onboarding & Preference Setup Module |
| **Description** | Handles secure user onboarding, including sign up, log in, log out, forgot/reset password, session management, and role-based access control. It features a first-login wizard where users upload photos, set gender/age preferences, and select initial interest tags. |

---

| Field | Details |
|---|---|
| **Module ID** | MOD-02 |
| **Name** | User Profile Management Module |
| **Description** | Empowers users to customize their profile by editing personal info, uploading an avatar and additional photos (up to 5), managing interest tags, and changing passwords. |

---

| Field | Details |
|---|---|
| **Module ID** | MOD-03 |
| **Name** | AI-Powered Smart Matching Subsystem |
| **Description** | Calculates the AI compatibility score, displays a ranked candidate list, shows matching reasons in Vietnamese, and refreshes suggestions to deliver optimized potential matches. |

---

| Field | Details |
|---|---|
| **Module ID** | MOD-04 |
| **Name** | Swipe & Match System |
| **Description** | Retains the familiar, intuitive gesture control allowing users to swipe right (like) or left (skip), automatically detects mutual likes to trigger a match, shows match confirmations, and maintains a match history. |

---

| Field | Details |
|---|---|
| **Module ID** | MOD-05 |
| **Name** | Advanced Search & Filtering Module |
| **Description** | Provides users with the ability to filter candidates dynamically by gender, age range, city, and interest tags, showing paginated results sorted by recency or AI score. |

---

| Field | Details |
|---|---|
| **Module ID** | MOD-06 |
| **Name** | Real-time Messaging & Notification Center |
| **Description** | Supports instant text communication with messaging history, online/offline status, and a typing indicator, while also offering an **AI ice-breaking game** to initiate conversations smoothly. It pushes real-time match and message notifications with precise timestamps. |

---

| Field | Details |
|---|---|
| **Module ID** | MOD-07 |
| **Name** | Privacy, Safety Controls & Admin Dashboard |
| **Description** | Protects users with robust safety measures, such as blocking/reporting users, hiding contact details until a match is confirmed, deactivating or permanently deleting accounts, and utilizing **AI to analyze chats for red flags**. On the administrative side, it provides a comprehensive console to view platform statistics, manage users (search, view, block, delete), and curate the interest tag catalogue. |

---

## 4.2 Assumptions and Dependencies

> *To ensure that the LoveYou platform operates reliably, achieves accurate matchmaking, and maintains high performance, the following technical assumptions and external dependencies have been identified:*

| Aspect | Assumption | Dependency / Impact |
| :--- | :--- | :--- |
| **1. Internet Access** | Users are assumed to have a stable internet connection (Wi-Fi, 4G, or 5G) when accessing the web application. | Unstable or unavailable connectivity will severely disrupt real-time messaging, typing indicators, and immediate push notifications. |
| **2. User Engagement & Data Input** | Users are expected to complete their profiles accurately, selecting true interest tags and providing honest biographical data during onboarding. | The accuracy of the AI-powered matching engine and the resulting Compatibility Score (0–100) heavily rely on the quality of user-provided profile data. |
| **3. AI Model Capabilities** | The core AI engine can process multi-dimensional data quickly and generate human-readable match explanations in Vietnamese without noticeable delay. | System responsiveness when displaying the ranked candidate list or refreshing suggestions directly depends on the availability and processing speed of the underlying AI processing infrastructure. |
| **4. Device & Browser Compatibility** | Users will access the application through standard modern web browsers on both desktop computers and mobile devices. | While the web interface is inherently responsive, the visual rendering and execution of dynamic features (like the AI ice-breaking game) depend on browser compatibility with modern web standards. |
| **5. Admin Moderation & Governance** | Platform administrators will actively monitor the dashboard, handle user reports, and maintain the interest tag catalog. | Maintaining a safe and high-quality dating ecosystem is highly dependent on swift admin actions following the detection of AI chat red flags or malicious user behavior. |
| **6. Cloud Storage Infrastructure** | The underlying cloud infrastructure will provide stable storage capable of scaling as data demands grow. | Seamless media loading and data continuity are dependent on the cloud infrastructure securely managing up to 5 photos per user profile, entire chat histories, and real-time logs. |

---

*End of Product Overview*