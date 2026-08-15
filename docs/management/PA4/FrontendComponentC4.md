# C4 Model Level 3 - Frontend Component Diagram

> **Author:** Thành viên 5 (Frontend & Spec Kit Lead Frontend)  
> **Reviewer:** Tuong Huy (Software Architect)  
> **Editor:** Trung Nghia

## Overview

This document specifies the C4 Level 3 Component Architecture for the `loveyou-frontend` React Single Page Application (SPA), covering **FG-01 Authentication & Authorization**, **FG-02 / FG-10 3-Step Profile Setup Wizard (Onboarding)**, and **FG-04 / 004 Smart Matching & Swiping Deck (Ghép đôi Hẹn hò)**.

---

## C4 Level 3 - Frontend Component Diagram

```mermaid
C4Component
    title Component Diagram for LoveYou Frontend Application (C4 Level 3)

    Container_Boundary(spa, "React SPA (loveyou-frontend)") {
        Component(main, "main.jsx", "React DOM Render", "Renders the root App component into HTML DOM")
        Component(app, "App.jsx", "React Component / Router", "Defines application routes (/login, /signup, /forgot-password, /reset-password, /dashboard, /onboarding)")
        
        Component(auth_ctx, "AuthContext.jsx", "React Context Provider", "Manages global auth state, JWT token decoding, localStorage syncing & auth functions")
        
        ComponentDb(local_storage, "Browser LocalStorage", "Web Storage API", "Stores 'ly_token' JWT access token for persistent user sessions")
        
        Component(shared_comp, "shared.jsx", "React Shared Components", "Provides ProtectedRoute, GuestRoute, Layout, Button, Input, StatusAlert UI elements")
        
        Component(login_page, "Login.jsx", "React Page Component", "Renders Login form & submits credentials via AuthContext")
        Component(signup_page, "Signup.jsx", "React Page Component", "Renders Sign-up form & submits registration data")
        Component(forgot_page, "ForgotPassword.jsx", "React Page Component", "Renders Forgot Password form & requests OTP email")
        Component(reset_page, "ResetPassword.jsx", "React Page Component", "Renders OTP verification & new password submission form")
        Component(dash_page, "Dashboard.jsx", "React Page Component", "Renders Tinder Swiping Deck, candidates deck, mutual match popup alert, matches list & RBAC Admin test trigger")
        Component(onboard_page, "OnboardingWizard.jsx", "React Page Component", "Renders 3-Step Profile Setup Wizard with real-time 0% to 100% completion bar")

        Component(api_client, "api.js", "Axios HTTP Client", "Configured Axios instance with BaseURL 'http://localhost:3000/api', Auth Bearer interceptor, authApi, userApi, matchingApi & adminApi")
        Component(index_css, "index.css", "Vanilla CSS / Design System", "Global styling tokens, modern dark gradients, form controls & micro-animations")
    }

    Container(backend_api, "Express REST API Backend", "Node.js / Express", "Provides Auth (/api/auth), User Profile (/api/users), Matching (/api/matching) & Admin (/api/admin) REST endpoints")

    Rel(main, app, "Mounts")
    Rel(app, auth_ctx, "Wraps with AuthProvider")
    Rel(app, shared_comp, "Uses ProtectedRoute & GuestRoute")

    Rel(shared_comp, login_page, "Renders inside GuestRoute")
    Rel(shared_comp, signup_page, "Renders inside GuestRoute")
    Rel(shared_comp, forgot_page, "Renders inside GuestRoute")
    Rel(shared_comp, reset_page, "Renders route")
    Rel(shared_comp, dash_page, "Renders inside ProtectedRoute")
    Rel(shared_comp, onboard_page, "Renders inside ProtectedRoute")

    Rel(login_page, auth_ctx, "Calls login()")
    Rel(signup_page, api_client, "Calls authApi.signup()")
    Rel(forgot_page, api_client, "Calls authApi.forgotPassword()")
    Rel(reset_page, api_client, "Calls authApi.verifyOtp() & authApi.resetPassword()")
    Rel(dash_page, auth_ctx, "Reads user, token, isAdmin & calls logout()")
    Rel(dash_page, api_client, "Calls matchingApi.getCandidates(), matchingApi.swipe(), matchingApi.getMatches() & adminApi.getStats()")
    Rel(onboard_page, api_client, "Calls userApi.getProfile() & userApi.updateProfile()")

    Rel(auth_ctx, local_storage, "Reads/Writes 'ly_token'")
    Rel(auth_ctx, api_client, "Delegates login/logout requests")

    Rel(api_client, backend_api, "Sends HTTP Requests (JSON)", "REST API / CORS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Component Description

### 1. Presentation & Routing Layer
- **`main.jsx`**: Entry point executing `React.createRoot` to render the root application into `index.html`.
- **`App.jsx`**: Central router configuring client-side routes (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/dashboard`, `/onboarding`).
- **`shared.jsx`**: Contains layout containers, input fields, custom buttons, alert banners, and high-order route guards (`ProtectedRoute` for authenticated users and `GuestRoute` for anonymous users).

### 2. State & Persistence Layer
- **`AuthContext.jsx`**: Global React Context managing state (`user`, `token`, `loading`, `isAdmin`). It decodes the JWT payload to reconstruct user claims on app initialization.
- **`Browser LocalStorage`**: Stores `ly_token` across browser reloads.

### 3. Page Components Layer
- **`Login.jsx`**: Collects credentials and delegates to `AuthContext.login()`.
- **`Signup.jsx`**: Validates input and submits registration data through `authApi.signup()`.
- **`ForgotPassword.jsx`**: Triggers OTP dispatch via `authApi.forgotPassword()`.
- **`ResetPassword.jsx`**: Verifies 6-digit OTP code and sets a new password via `authApi.verifyOtp()` and `authApi.resetPassword()`.
- **`Dashboard.jsx`**: Protected Tinder Web Swiping View showing candidates deck, processing swipes (`LIKE`, `PASS`, `SUPER_LIKE`), mutual match popup alerts, matches list, and RBAC Admin test button.
- **`OnboardingWizard.jsx`**: Interactive 3-Step profile setup wizard with real-time **0% to 100% completion progress bar**.

### 4. Communication Layer
- **`api.js`**: Centralized Axios client instance configured with base URL `http://localhost:3000/api`, request interceptors appending authorization headers, `authApi`, `userApi`, `matchingApi`, and `adminApi`.
