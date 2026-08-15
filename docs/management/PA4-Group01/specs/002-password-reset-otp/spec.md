# Feature Specification: Password Reset OTP

**Feature Branch**: `002-password-reset-otp`

**Created**: 2026-07-25

**Status**: Draft

**Input**: User description: "Upgrade the existing password-reset journey to email a six-digit one-time password, verify it before issuing a short-lived reset authorization, and apply request and attempt limits."

## Clarifications

### Session 2026-07-25

- Q: How should the system respond when it cannot deliver a reset email? → A: Return a generic, retryable delivery error and count the request toward the three-per-hour limit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request a reset code (Priority: P1)

A user who cannot remember their password can request a one-time code at their registered email address, without exposing whether that email has an account.

**Why this priority**: Delivering a confidential recovery code is the entry point to recovering account access securely.

**Independent Test**: A registered user requests a reset and receives a six-digit code by email, while the response only confirms that a reset email was sent.

**Acceptance Scenarios**:

1. **Given** a user with a registered email address, **When** they request a password reset, **Then** the system sends a six-digit numeric one-time code to that email, valid for 10 minutes, and returns a confirmation without the code.
2. **Given** an email address with no account, **When** a reset is requested, **Then** the system returns the same confirmation response it returns for a registered email and sends no account-revealing information.
3. **Given** an email address that has already made three reset requests in the last hour, **When** another reset is requested, **Then** the system does not issue or send another code during that one-hour window and does not reveal whether the email is registered.

---

### User Story 2 - Verify a reset code (Priority: P1)

A user who received a valid code can verify it and receive a temporary authorization to set a new password.

**Why this priority**: Verification proves control of the email inbox before any password can be changed.

**Independent Test**: A user submits the correct email and current code before it expires and receives a reset authorization that can be used once within 10 minutes.

**Acceptance Scenarios**:

1. **Given** a current, unexpired reset code, **When** the user submits its email and the correct code, **Then** the system returns a reset authorization valid for 10 minutes and does not return the code.
2. **Given** an incorrect, expired, consumed, or invalidated code, **When** the user attempts verification, **Then** the system returns the same generic verification error and does not issue a reset authorization.
3. **Given** a code with five failed verification attempts, **When** any further verification is attempted with that code, **Then** the code is invalid and cannot authorize a password reset.

---

### User Story 3 - Complete a password reset (Priority: P1)

A verified user can set a new password with their temporary reset authorization, after which the authorization and all remaining reset codes for that user no longer work.

**Why this priority**: This completes account recovery while preventing reuse of sensitive recovery credentials.

**Independent Test**: A user verifies a code, resets their password with the issued authorization, signs in with the new password, and cannot reuse either the authorization or an earlier outstanding code.

**Acceptance Scenarios**:

1. **Given** a valid reset authorization and a password meeting the existing password rules, **When** the user submits the new password, **Then** the password is changed and the authorization is invalidated.
2. **Given** a successful password reset, **When** the user tries another outstanding reset code or a previously issued reset authorization, **Then** the system rejects it.
3. **Given** an expired, invalid, or previously used reset authorization, **When** the user submits a new password, **Then** the system rejects the request and leaves the existing password unchanged.

### Edge Cases

- A newly requested code supersedes any previous unverified code for the same user; only the current unexpired code may be verified.
- Expired codes and reset authorizations cannot be used, even if they have not reached their attempt limit.
- Requests with malformed emails, non-numeric codes, codes other than six digits, missing fields, or passwords that fail existing rules are rejected without changing recovery state.
- Email-delivery failures return a generic, retryable error without exposing a code, reset authorization, or account existence; the failed request still counts toward the request limit.
- No production response, error detail, audit entry, or application log includes a one-time code or reset authorization.

## Project Constraints *(mandatory)*

- Authentication and personal-data changes must validate input and protect private information.
- The feature must preserve the existing product security and authorization standards.
- This work remains within the Authentication product priority.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let a person request password recovery using an email address.
- **FR-002**: For a registered email address, the system MUST create a cryptographically random six-digit numeric one-time code, deliver it to that address, and make it expire 10 minutes after issuance.
- **FR-003**: The system MUST retain only a non-reversible representation of each one-time code and MUST never return or record the usable code in production responses or logs.
- **FR-004**: The system MUST return the same non-revealing confirmation for reset requests regardless of whether the submitted email belongs to an account.
- **FR-005**: The system MUST allow no more than three code requests for the same email address within any rolling one-hour period; requests beyond that limit must not create or deliver a new code.
- **FR-005a**: If a reset email cannot be delivered, the system MUST return a generic, retryable delivery error without revealing account existence, and MUST count that request toward the limit in FR-005.
- **FR-006**: The system MUST let a person submit an email address and six-digit code to verify password-recovery eligibility.
- **FR-007**: The system MUST issue a reset authorization valid for 10 minutes only after successful verification of the current, unexpired, non-invalidated code.
- **FR-008**: The system MUST return one generic verification failure response for unknown email addresses and for incorrect, expired, consumed, or invalidated codes.
- **FR-009**: The system MUST limit each one-time code to five failed verification attempts and invalidate it when that limit is reached.
- **FR-010**: The system MUST let a user set a new password only by presenting a valid, unexpired reset authorization and a password that meets the existing password policy.
- **FR-011**: After a successful password change, the system MUST invalidate the used reset authorization and every outstanding one-time code and reset authorization associated with that user.
- **FR-012**: The system MUST reject expired, invalid, consumed, or invalidated recovery credentials without changing the user's password.
- **FR-013**: The system MUST preserve the existing password-reset service's response envelope and error-handling conventions unless a contract change is documented during planning.

### Key Entities

- **PasswordResetRequest**: A time-limited recovery request associated with an email address and user when one exists; it records issuance time and request-rate information without exposing account existence.
- **One-Time Code**: A six-digit recovery credential represented only in protected form, with expiry, failed-attempt count, and invalidation state.
- **Reset Authorization**: A temporary, single-use authorization issued after successful code verification, with expiry and consumption state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of valid code requests result in a six-digit code delivered within 60 seconds and no code value appears in the corresponding client response or production log capture.
- **SC-002**: In acceptance testing, at least 95% of users who receive a valid code complete verification and password change within the 10-minute validity period.
- **SC-003**: In automated acceptance tests, 100% of requests exceeding three per email per hour result in no additional code delivery, and 100% of codes reaching five failed attempts cannot be verified.
- **SC-004**: In automated acceptance tests, all unknown-email, incorrect-code, expired-code, and invalidated-code verification cases return the same generic failure outcome.
- **SC-005**: In automated acceptance tests, 100% of successful resets invalidate the used authorization and all other outstanding recovery credentials for that user.

## Assumptions

- An email-delivery capability is available and can send messages to the submitted address; deliverability outside the service's control is excluded from the completion guarantee.
- The existing password-length and validation rules remain the password policy for this feature.
- A newly issued code replaces earlier unused codes for the same user to keep the recovery journey unambiguous.
- The current password-reset data record may be extended or reused to represent the code, verification state, attempt count, expiration, and reset authorization lifecycle.
- This feature replaces the existing testing-only behavior that returned a password-reset token directly in a client response.
