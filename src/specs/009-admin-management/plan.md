# Implementation Plan: Admin Management (Feature 009)

## Overview
Implement complete Admin Management following the spec-driven architecture of LoveYou.

## Proposed Changes

### Backend (`src/loveyou-backend`)

- `src/services/adminService.js`: Encapsulates business logic for stats, user queries, ban/unban toggling, and default admin seeding.
- `src/controllers/adminController.js`: Express controller calling `adminService`.
- `src/routes/adminRoutes.js`: HTTP endpoints `/api/admin/stats`, `/api/admin/users`, `/api/admin/users/:id/ban`.
- `src/utils/seedAdmin.js`: Automatic seeding runner.
- `index.js`: Calls `seedAdmin()` on startup.

### Frontend (`src/loveyou-frontend`)

- `src/utils/api.js`: Exposes `adminApi` (`stats`, `getUsers`, `getUserById`, `toggleBan`).
- `src/components/AdminModal.jsx`: Admin dashboard UI modal.
- `src/pages/Dashboard.jsx`: Integrates Admin Panel toggle for `ADMIN` role.
