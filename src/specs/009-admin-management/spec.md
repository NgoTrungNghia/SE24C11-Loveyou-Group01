# Feature Specification: Admin Management

**Feature Branch**: `009-admin-management`

**Created**: 2026-08-13

**Status**: Approved

**Input**: Create an Admin Management module (Feature 009) with default Admin account `admin@loveyou.com` (password `123456`). Admin users can view system stats, list all registered accounts with creation timestamps, inspect full profile details, and toggle account status (Ban / Unban).

## Actors

- **Admin**: User with `role: ADMIN` who can access administrative tools, inspect all accounts, and manage account statuses.
- **User**: Standard user with `role: USER`.

## User Scenarios & Testing

### User Story 1 - Default Admin Access & System Overview (Priority: P1)
An administrator logs in with default credentials `admin@loveyou.com` / `123456` and accesses system statistics.

**Acceptance Scenarios**:
1. **Given** default admin credentials, **When** logging in, **Then** a 7-day JWT token with `role: ADMIN` is issued.
2. **Given** an Admin user, **When** querying `/api/admin/stats`, **Then** the total count of users, active users, banned users, and matches are returned.

### User Story 2 - User Account List & Profile Inspection (Priority: P1)
An administrator views all accounts registered on the platform, including their registration timestamps and profile information.

**Acceptance Scenarios**:
1. **Given** an Admin user, **When** requesting `/api/admin/users`, **Then** all users ordered by creation date (newest first) are returned with `createdAt`, `status`, `role`, and profile fields.
2. **Given** an Admin user, **When** inspecting a specific user, **Then** full profile details (avatar, bio, phone, location, age) are displayed.

### User Story 3 - Account Ban & Unban Management (Priority: P1)
An administrator bans or unbans a user account. Banned users are denied login and access.

**Acceptance Scenarios**:
1. **Given** an active user account, **When** Admin toggles ban status, **Then** status changes to `BANNED`.
2. **Given** a banned user, **When** they attempt login, **Then** the system returns 403 Forbidden with a clear message.
3. **Given** a banned user, **When** Admin toggles ban status again, **Then** status reverts to `ACTIVE`.

## Requirements

- **FR-001**: System MUST seed default admin `admin@loveyou.com` with password `123456` and `role: ADMIN`.
- **FR-002**: All `/api/admin/*` endpoints MUST require `authMiddleware` and `roleMiddleware('ADMIN')`.
- **FR-003**: System MUST provide API to list users with `createdAt` timestamps.
- **FR-004**: System MUST allow toggling user status (`ACTIVE` vs `BANNED`).
- **FR-005**: Banned accounts MUST be denied authentication with 403 HTTP response.
