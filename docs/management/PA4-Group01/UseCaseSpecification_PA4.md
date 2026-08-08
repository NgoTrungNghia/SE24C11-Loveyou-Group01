# LoveYou Use-Case Specification

| Assignee | Reviewer | Editor |
| :--- | :--- | :--- |
| Hoàng Tấn | Minh Hoàng | Ngô Trung Nghĩa |

## Purpose

This document specifies the 56 use cases of the PA4 Use-Case Model. The specification is intentionally written from the **user/system behavior perspective**. Implementation details such as framework names, API endpoints, database queries, HTTP status codes, token formats, hashing algorithms, and socket event names are kept out of the use-case flows.

## FG-01 Authentication & Authorization

### UC01: Sign Up

* **Use Case ID:** UC01
* **Use Case Name:** Sign Up
* **Actor(s):** Guest User
* **Description:** Allows a guest to create a LoveYou account and continue to onboarding.
* **Preconditions:** Guest User is not logged in.

#### Basic Flow (Main Success Scenario)
1. Guest User opens the Sign Up page.
2. System displays the registration form.
3. Guest User enters the required information and submits the form.
4. System validates the information.
5. System creates the account and starts the authenticated session.
6. System directs the user to onboarding (UC11).

#### Alternative Flows
* **AF01.1: Invalid registration information**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.
* **AF01.2: Email already registered**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested sign up operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc01_sign_up.png`
  - AF01.1: `prototypes/uc01_af1_invalid_registration_information.png`
  - AF01.2: `prototypes/uc01_af2_email_already_registered.png`

---

### UC02: Log In

* **Use Case ID:** UC02
* **Use Case Name:** Log In
* **Actor(s):** Guest User / User / Admin
* **Description:** Allows a guest, registered user, or administrator to authenticate and enter the appropriate part of LoveYou.
* **Preconditions:** A valid account exists for the person attempting to log in.

#### Basic Flow (Main Success Scenario)
1. User opens the Log In page.
2. System displays the login form.
3. User enters account credentials and submits the form.
4. System validates the credentials.
5. System starts the authenticated session.
6. System directs the user to the appropriate application area.

#### Alternative Flows
* **AF02.1: Invalid credentials**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.
* **AF02.2: Account unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested log in operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc02_log_in.png`
  - AF02.1: `prototypes/uc02_af1_invalid_credentials.png`
  - AF02.2: `prototypes/uc02_af2_account_unavailable.png`

---

### UC03: Log Out

* **Use Case ID:** UC03
* **Use Case Name:** Log Out
* **Actor(s):** User / Admin
* **Description:** Ends the current authenticated session and returns the user to the public entry screen.
* **Preconditions:** User or Admin is currently authenticated.

#### Basic Flow (Main Success Scenario)
1. User selects Log Out.
2. System asks for confirmation when required.
3. User confirms the action.
4. System ends the current session.
5. System returns the user to the public entry screen.

#### Alternative Flows
* **AF03.1: Logout confirmation**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested log out operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc03_logout_confirm.png`
  - AF03.1: `prototypes/uc03_af1_logout_confirmation.png`

---

### UC04: Reset Password

* **Use Case ID:** UC04
* **Use Case Name:** Reset Password
* **Actor(s):** User
* **Description:** Allows a registered user to recover access by requesting and completing a password reset.
* **Preconditions:** The account exists and the user can access the recovery process.

#### Basic Flow (Main Success Scenario)
1. User opens Reset Password.
2. System asks for the account email.
3. User submits the email.
4. System provides a password-reset step.
5. User chooses and confirms a new password.
6. System confirms that access has been restored.

#### Alternative Flows
* **AF04.1: Unknown account**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.
* **AF04.2: Invalid or expired reset link**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested reset password operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc04_reset_password.png`
  - AF04.1: `prototypes/uc04_af1_unknown_account.png`
  - AF04.2: `prototypes/uc04_af2_invalid_or_expired_reset_link.png`

---

### UC05: Manage Session

* **Use Case ID:** UC05
* **Use Case Name:** Manage Session
* **Actor(s):** User / Admin (supporting)
* **Description:** Maintains the authenticated state while the user continues using the application.
* **Preconditions:** A user or administrator has completed authentication.

#### Basic Flow (Main Success Scenario)
1. The user completes authentication.
2. System establishes the authenticated state.
3. System keeps the state while the user continues to navigate.
4. System ends the state when the user logs out or the session expires.

#### Alternative Flows
* **AF05.1: Session expired**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested manage session operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc02_log_in.png`
  - AF05.1: `prototypes/uc05_af1_session_expired.png`

---

### UC06: Authorize Access by Role

* **Use Case ID:** UC06
* **Use Case Name:** Authorize Access by Role
* **Actor(s):** User / Admin (supporting)
* **Description:** Checks whether the current user has permission to access a protected function.
* **Preconditions:** The user has an authenticated session and requests a protected function.

#### Basic Flow (Main Success Scenario)
1. User requests a protected function.
2. System identifies the user's role.
3. System compares the role with the required permission.
4. System allows the operation when permission is sufficient.

#### Alternative Flows
* **AF06.1: Insufficient permission**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested authorize access by role operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc06_access_control.png`
  - AF06.1: `prototypes/uc06_af1_insufficient_permission.png`

---

## FG-02 User Profile Management

### UC07: Edit Personal Information

* **Use Case ID:** UC07
* **Use Case Name:** Edit Personal Information
* **Actor(s):** User
* **Description:** Allows the user to update personal profile information.
* **Preconditions:** User is logged in.

#### Basic Flow (Main Success Scenario)
1. User opens Edit Profile.
2. System displays current profile information.
3. User changes one or more fields.
4. User selects Save Changes.
5. System validates and saves the changes.
6. System confirms the update.

#### Alternative Flows
* **AF07.1: Invalid profile information**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.
* **AF07.2: Save operation fails**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested edit personal information operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc07_edit_profile.png`
  - AF07.1: `prototypes/uc07_af1_invalid_profile_information.png`
  - AF07.2: `prototypes/uc07_af2_save_operation_fails.png`

---

### UC08: Upload Photos

* **Use Case ID:** UC08
* **Use Case Name:** Upload Photos
* **Actor(s):** User
* **Description:** Allows the user to add, reorder, or remove profile photos.
* **Preconditions:** User is logged in and is viewing profile photo management.

#### Basic Flow (Main Success Scenario)
1. User opens photo management.
2. System displays current photos and upload controls.
3. User selects a photo.
4. System validates the photo.
5. System adds the photo to the profile.
6. System shows the updated photo list.

#### Alternative Flows
* **AF08.1: Unsupported or oversized photo**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.
* **AF08.2: Upload fails**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested upload photos operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc08_upload_photos.png`
  - AF08.1: `prototypes/uc08_af1_unsupported_or_oversized_photo.png`
  - AF08.2: `prototypes/uc08_af2_upload_fails.png`

---

### UC09: Manage Interest Tags

* **Use Case ID:** UC09
* **Use Case Name:** Manage Interest Tags
* **Actor(s):** User
* **Description:** Allows the user to select and manage interest tags used in their profile.
* **Preconditions:** User is logged in.

#### Basic Flow (Main Success Scenario)
1. User opens interest management.
2. System displays available and selected interests.
3. User selects or removes interests.
4. User saves the selection.
5. System updates the profile interests.
6. System confirms the update.

#### Alternative Flows
* **AF09.1: Invalid number of selected interests**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested manage interest tags operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc09_interest_tags.png`
  - AF09.1: `prototypes/uc09_af1_invalid_number_of_selected_interests.png`

---

### UC10: Change Password

* **Use Case ID:** UC10
* **Use Case Name:** Change Password
* **Actor(s):** User
* **Description:** Allows the user to change their current password.
* **Preconditions:** User is logged in.

#### Basic Flow (Main Success Scenario)
1. User opens Change Password.
2. System displays password fields.
3. User enters the current and new passwords.
4. System validates the information.
5. System saves the new password.
6. System confirms the change.

#### Alternative Flows
* **AF10.1: Incorrect current password**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.
* **AF10.2: New passwords do not match**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested change password operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc10_change_password.png`
  - AF10.1: `prototypes/uc10_af1_incorrect_current_password.png`
  - AF10.2: `prototypes/uc10_af2_new_passwords_do_not_match.png`

---

## FG-10 Onboarding & Preference Setup

### UC11: Complete Onboarding

* **Use Case ID:** UC11
* **Use Case Name:** Complete Onboarding
* **Actor(s):** User
* **Description:** Guides a newly registered user through the required profile and preference setup.
* **Preconditions:** User has just completed registration and needs profile setup.

#### Basic Flow (Main Success Scenario)
1. System opens the onboarding wizard after registration.
2. User completes the required onboarding steps.
3. System saves each preference.
4. User selects Finish Setup.
5. System marks onboarding as complete and opens discovery.

#### Alternative Flows
* **AF11.1: User skips onboarding**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested complete onboarding operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc11_onboarding.png`
  - AF11.1: `prototypes/uc11_af1_user_skips_onboarding.png`

---

### UC12: Upload Initial Photo

* **Use Case ID:** UC12
* **Use Case Name:** Upload Initial Photo
* **Actor(s):** User
* **Description:** Allows the user to upload the initial profile photo during onboarding.
* **Preconditions:** Onboarding is in progress.

#### Basic Flow (Main Success Scenario)
1. User reaches the Upload Initial Photo step in onboarding.
2. System displays the required controls.
3. User uploads Initial Photo according to their preference.
4. System validates and saves the selection.
5. System moves to the next onboarding step.

#### Alternative Flows
* **AF12.1: Invalid photo**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested upload initial photo operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc12_initial_photo.png`
  - AF12.1: `prototypes/uc12_af1_invalid_photo.png`

---

### UC13: Set Gender Preference

* **Use Case ID:** UC13
* **Use Case Name:** Set Gender Preference
* **Actor(s):** User
* **Description:** Allows the user to select the gender preference used for discovery.
* **Preconditions:** Onboarding is in progress.

#### Basic Flow (Main Success Scenario)
1. User reaches the Set Gender Preference step in onboarding.
2. System displays the required controls.
3. User sets Gender Preference according to their preference.
4. System validates and saves the selection.
5. System moves to the next onboarding step.

#### Alternative Flows
* **AF13.1: No preference selected**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested set gender preference operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc13_gender_preference.png`
  - AF13.1: `prototypes/uc13_af1_no_preference_selected.png`

---

### UC14: Set Preferred Age Range

* **Use Case ID:** UC14
* **Use Case Name:** Set Preferred Age Range
* **Actor(s):** User
* **Description:** Allows the user to choose a preferred age range.
* **Preconditions:** Onboarding is in progress.

#### Basic Flow (Main Success Scenario)
1. User reaches the Set Preferred Age Range step in onboarding.
2. System displays the required controls.
3. User sets Preferred Age Range according to their preference.
4. System validates and saves the selection.
5. System moves to the next onboarding step.

#### Alternative Flows
* **AF14.1: Invalid age range**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested set preferred age range operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc14_age_preference.png`
  - AF14.1: `prototypes/uc14_af1_invalid_age_range.png`

---

### UC15: Set Home City

* **Use Case ID:** UC15
* **Use Case Name:** Set Home City
* **Actor(s):** User
* **Description:** Allows the user to set their home city.
* **Preconditions:** Onboarding is in progress.

#### Basic Flow (Main Success Scenario)
1. User reaches the Set Home City step in onboarding.
2. System displays the required controls.
3. User sets Home City according to their preference.
4. System validates and saves the selection.
5. System moves to the next onboarding step.

#### Alternative Flows
* **AF15.1: City not found**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested set home city operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc15_city.png`
  - AF15.1: `prototypes/uc15_af1_city_not_found.png`

---

### UC16: Select Initial Interest Tags

* **Use Case ID:** UC16
* **Use Case Name:** Select Initial Interest Tags
* **Actor(s):** User
* **Description:** Allows the user to select initial interests.
* **Preconditions:** Onboarding is in progress.

#### Basic Flow (Main Success Scenario)
1. User reaches the Select Initial Interest Tags step in onboarding.
2. System displays the required controls.
3. User selects Initial Interest Tags according to their preference.
4. System validates and saves the selection.
5. System moves to the next onboarding step.

#### Alternative Flows
* **AF16.1: No interests selected**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested select initial interest tags operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc16_interests.png`
  - AF16.1: `prototypes/uc16_af1_no_interests_selected.png`

---

### UC17: Skip Onboarding

* **Use Case ID:** UC17
* **Use Case Name:** Skip Onboarding
* **Actor(s):** User
* **Description:** Allows the user to skip onboarding and continue with default or incomplete preferences.
* **Preconditions:** Onboarding is in progress.

#### Basic Flow (Main Success Scenario)
1. User selects Skip for now during onboarding.
2. System explains the effect of skipping.
3. User confirms the choice.
4. System keeps the available default/incomplete preferences.
5. System lets the user continue to the application.

#### Alternative Flows
* **AF17.1: User returns to onboarding later**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested skip onboarding operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc11_onboarding_skip.png`
  - AF17.1: `prototypes/uc17_af1_user_returns_to_onboarding_later.png`

---

## FG-03 AI-Powered Smart Matching

### UC18: View AI Match Suggestions

* **Use Case ID:** UC18
* **Use Case Name:** View AI Match Suggestions
* **Actor(s):** User
* **Description:** Displays candidate profiles recommended using the user's profile and preferences.
* **Preconditions:** User is logged in and has enough profile information for discovery.

#### Basic Flow (Main Success Scenario)
1. User opens AI Match Suggestions.
2. System retrieves suitable candidate profiles.
3. System calculates compatibility information (UC19).
4. System displays match reasons (UC20).
5. System presents candidate cards with actions for further discovery.

#### Alternative Flows
* **AF18.1: No suitable candidates**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.
* **AF18.2: AI recommendation unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view ai match suggestions operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc18_ai_match_suggestions.png`
  - AF18.1: `prototypes/uc18_af1_no_suitable_candidates.png`
  - AF18.2: `prototypes/uc18_af2_ai_recommendation_unavailable.png`

---

### UC19: Calculate Compatibility Score

* **Use Case ID:** UC19
* **Use Case Name:** Calculate Compatibility Score
* **Actor(s):** User
* **Description:** Calculates a compatibility score for a user and a candidate.
* **Preconditions:** A user profile and candidate profile are available.

#### Basic Flow (Main Success Scenario)
1. System receives the active user's profile and a candidate profile.
2. System evaluates the available matching factors.
3. System combines the factors into a compatibility score.
4. System returns the score for display in UC18.

#### Alternative Flows
* **AF19.1: Insufficient profile data**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested calculate compatibility score operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc18_ai_match_suggestions.png`
  - AF19.1: `prototypes/uc19_af1_insufficient_profile_data.png`

---

### UC20: Display Match Reasons

* **Use Case ID:** UC20
* **Use Case Name:** Display Match Reasons
* **Actor(s):** User
* **Description:** Shows understandable reasons explaining why a candidate may be compatible.
* **Preconditions:** Compatibility information is available for the candidate.

#### Basic Flow (Main Success Scenario)
1. System identifies meaningful shared profile information.
2. System prepares a short explanation.
3. System displays the explanation with the candidate profile.

#### Alternative Flows
* **AF20.1: No strong match reason available**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested display match reasons operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc18_ai_match_suggestions.png`
  - AF20.1: `prototypes/uc20_af1_no_strong_match_reason_available.png`

---

### UC21: Refresh Suggestions

* **Use Case ID:** UC21
* **Use Case Name:** Refresh Suggestions
* **Actor(s):** User
* **Description:** Refreshes the current set of recommended candidates.
* **Preconditions:** User is viewing AI match suggestions.

#### Basic Flow (Main Success Scenario)
1. User selects Refresh Suggestions.
2. System requests another set of candidates.
3. System prepares compatibility information for the new candidates.
4. System replaces the visible suggestions.

#### Alternative Flows
* **AF21.1: Refresh unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested refresh suggestions operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc18_ai_match_suggestions.png`
  - AF21.1: `prototypes/uc21_af1_refresh_unavailable.png`

---

## FG-04 Swipe & Match System

### UC22: Like Candidate

* **Use Case ID:** UC22
* **Use Case Name:** Like Candidate
* **Actor(s):** User
* **Description:** Records that the user likes a candidate.
* **Preconditions:** User is viewing a candidate profile.

#### Basic Flow (Main Success Scenario)
1. User selects Like on a candidate.
2. System records the positive interaction.
3. System checks whether the other user has already liked this user.
4. If a mutual like exists, system starts UC24.
5. Otherwise, system shows the next candidate.

#### Alternative Flows
* **AF22.1: Candidate unavailable or blocked**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested like candidate operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc22_swipe.png`
  - AF22.1: `prototypes/uc22_af1_candidate_unavailable_or_blocked.png`

---

### UC23: Skip Candidate

* **Use Case ID:** UC23
* **Use Case Name:** Skip Candidate
* **Actor(s):** User
* **Description:** Records that the user skips a candidate and moves to another candidate.
* **Preconditions:** User is viewing a candidate profile.

#### Basic Flow (Main Success Scenario)
1. User selects Skip on a candidate.
2. System records the skip interaction.
3. System removes the candidate from the current deck.
4. System shows the next candidate.

#### Alternative Flows
* **AF23.1: Undo skip if supported**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested skip candidate operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc23_skip.png`
  - AF23.1: `prototypes/uc23_af1_undo_skip_if_supported.png`

---

### UC24: Create Mutual Match

* **Use Case ID:** UC24
* **Use Case Name:** Create Mutual Match
* **Actor(s):** User
* **Description:** Creates a mutual match when two users have liked each other.
* **Preconditions:** Both users have expressed a positive interest in each other.

#### Basic Flow (Main Success Scenario)
1. System detects a mutual positive interaction.
2. System creates the mutual match.
3. System enables the matched users to continue to messaging.
4. System triggers the match notification (UC40).
5. System shows match confirmation (UC25).

#### Alternative Flows
* **AF24.1: Target account becomes unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested create mutual match operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc24_mutual_match.png`
  - AF24.1: `prototypes/uc24_af1_target_account_becomes_unavailable.png`

---

### UC25: Show Match Confirmation

* **Use Case ID:** UC25
* **Use Case Name:** Show Match Confirmation
* **Actor(s):** User
* **Description:** Shows a confirmation when a mutual match is created.
* **Preconditions:** A mutual match has just been created.

#### Basic Flow (Main Success Scenario)
1. System displays the match confirmation.
2. System shows both matched profiles.
3. User chooses Send Message or Keep Swiping.
4. System performs the selected action.

#### Alternative Flows
* **AF25.1: User dismisses match confirmation**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested show match confirmation operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc24_mutual_match.png`
  - AF25.1: `prototypes/uc25_af1_user_dismisses_match_confirmation.png`

---

### UC26: View Match History

* **Use Case ID:** UC26
* **Use Case Name:** View Match History
* **Actor(s):** User
* **Description:** Shows the user's previous mutual matches.
* **Preconditions:** User is logged in.

#### Basic Flow (Main Success Scenario)
1. User opens Match History.
2. System retrieves the user's mutual matches.
3. System sorts and displays the matches.
4. User selects a match to view or message.

#### Alternative Flows
* **AF26.1: No matches yet**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view match history operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc26_match_history.png`
  - AF26.1: `prototypes/uc26_af1_no_matches_yet.png`

---

## FG-05 Advanced Search & Filtering

### UC27: Search Profiles

* **Use Case ID:** UC27
* **Use Case Name:** Search Profiles
* **Actor(s):** User
* **Description:** Allows the user to search for candidate profiles.
* **Preconditions:** User is logged in.

#### Basic Flow (Main Success Scenario)
1. User opens Search & Explore.
2. System displays search controls.
3. User enters a query and/or uses filters.
4. System finds matching profiles.
5. System displays the results.

#### Alternative Flows
* **AF27.1: No search results**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested search profiles operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc27_search_profiles.png`
  - AF27.1: `prototypes/uc27_af1_no_search_results.png`

---

### UC28: Apply Search Filters

* **Use Case ID:** UC28
* **Use Case Name:** Apply Search Filters
* **Actor(s):** User
* **Description:** Allows the user to narrow search results using supported profile preferences.
* **Preconditions:** User is viewing search results.

#### Basic Flow (Main Success Scenario)
1. User opens the filter controls.
2. System displays supported filters for gender, age range, city, and interests.
3. User changes filter values.
4. User applies the filters.
5. System updates the search results.

#### Alternative Flows
* **AF28.1: Reset filters**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested apply search filters operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc28_search_filters.png`
  - AF28.1: `prototypes/uc28_af1_reset_filters.png`

---

### UC29: Sort Search Results

* **Use Case ID:** UC29
* **Use Case Name:** Sort Search Results
* **Actor(s):** User
* **Description:** Allows the user to change the order of search results.
* **Preconditions:** Search results are displayed.

#### Basic Flow (Main Success Scenario)
1. User opens the Sort By control.
2. System displays the available sort options.
3. User selects a sort option.
4. System rearranges the displayed results.

#### Alternative Flows
* **AF29.1: Default sorting**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested sort search results operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc29_sort_results.png`
  - AF29.1: `prototypes/uc29_af1_default_sorting.png`

---

### UC30: View Paginated Results

* **Use Case ID:** UC30
* **Use Case Name:** View Paginated Results
* **Actor(s):** User
* **Description:** Allows the user to move through multiple pages of search results.
* **Preconditions:** A search returns more results than can be shown at once.

#### Basic Flow (Main Success Scenario)
1. System displays the first set of search results.
2. User moves to another page or requests more results.
3. System loads the next set of results.
4. System displays the additional profiles.

#### Alternative Flows
* **AF30.1: End of result set**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view paginated results operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc30_paginated_results.png`
  - AF30.1: `prototypes/uc30_af1_end_of_result_set.png`

---

## FG-06 Real-time Messaging

### UC31: View Conversations

* **Use Case ID:** UC31
* **Use Case Name:** View Conversations
* **Actor(s):** User
* **Description:** Shows the user's conversation list and the selected conversation.
* **Preconditions:** User is logged in and has at least one conversation or match.

#### Basic Flow (Main Success Scenario)
1. User opens Messages.
2. System displays the conversation list.
3. User selects a conversation.
4. System displays the conversation and relevant message information.

#### Alternative Flows
* **AF31.1: No active conversations**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view conversations operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc31_realtime_chat.png`
  - AF31.1: `prototypes/uc31_af1_no_active_conversations.png`

---

### UC32: Send Message

* **Use Case ID:** UC32
* **Use Case Name:** Send Message
* **Actor(s):** User
* **Description:** Allows the user to send a message in an active conversation.
* **Preconditions:** User has an active conversation.

#### Basic Flow (Main Success Scenario)
1. User enters a message.
2. User selects Send.
3. System validates the message.
4. System sends the message to the selected conversation.
5. System displays the sent message.

#### Alternative Flows
* **AF32.1: Message cannot be sent**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested send message operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc31_realtime_chat.png`
  - AF32.1: `prototypes/uc32_af1_message_cannot_be_sent.png`

---

### UC33: Receive Message

* **Use Case ID:** UC33
* **Use Case Name:** Receive Message
* **Actor(s):** User
* **Description:** Displays a newly received message to the recipient.
* **Preconditions:** The user is an active recipient of a conversation.

#### Basic Flow (Main Success Scenario)
1. A matched user sends a message.
2. System receives the new message.
3. System makes the new message available to the recipient.
4. System updates the conversation and unread state when appropriate.

#### Alternative Flows
* **AF33.1: Message arrives while user is offline**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested receive message operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc31_realtime_chat.png`
  - AF33.1: `prototypes/uc33_af1_message_arrives_while_user_is_offline.png`

---

### UC34: View Message History

* **Use Case ID:** UC34
* **Use Case Name:** View Message History
* **Actor(s):** User
* **Description:** Shows previous messages in a conversation.
* **Preconditions:** A conversation is selected.

#### Basic Flow (Main Success Scenario)
1. User opens a conversation.
2. System displays recent messages.
3. User scrolls through the conversation.
4. System displays older messages when available.

#### Alternative Flows
* **AF34.1: No older messages**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view message history operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc31_realtime_chat.png`
  - AF34.1: `prototypes/uc34_af1_no_older_messages.png`

---

### UC35: View Online Status

* **Use Case ID:** UC35
* **Use Case Name:** View Online Status
* **Actor(s):** User
* **Description:** Shows whether a matched user is currently online or recently active when permitted.
* **Preconditions:** A conversation or match is visible.

#### Basic Flow (Main Success Scenario)
1. User views a conversation or match.
2. System determines whether the matched user has shared their presence.
3. System displays Online or recent activity when allowed.

#### Alternative Flows
* **AF35.1: Online status hidden**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view online status operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc31_realtime_chat.png`
  - AF35.1: `prototypes/uc35_af1_online_status_hidden.png`

---

### UC36: View Typing Indicator

* **Use Case ID:** UC36
* **Use Case Name:** View Typing Indicator
* **Actor(s):** User
* **Description:** Shows a typing indicator while the matched user is typing.
* **Preconditions:** A conversation is open.

#### Basic Flow (Main Success Scenario)
1. User opens a conversation.
2. The matched user starts typing.
3. System displays the typing indicator.
4. System removes the indicator when typing stops or a message is sent.

#### Alternative Flows
* **AF36.1: Typing status unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view typing indicator operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc31_realtime_chat.png`
  - AF36.1: `prototypes/uc36_af1_typing_status_unavailable.png`

---

## FG-07 Notification Center

### UC37: View Notifications

* **Use Case ID:** UC37
* **Use Case Name:** View Notifications
* **Actor(s):** User
* **Description:** Shows notifications related to matches, messages, and system activity.
* **Preconditions:** User is logged in.

#### Basic Flow (Main Success Scenario)
1. User opens the notification center.
2. System retrieves available notifications.
3. System groups and displays notifications.
4. User can select a notification to continue to the related function.

#### Alternative Flows
* **AF37.1: No notifications**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view notifications operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc37_notifications.png`
  - AF37.1: `prototypes/uc37_af1_no_notifications.png`

---

### UC38: Mark Notification as Read

* **Use Case ID:** UC38
* **Use Case Name:** Mark Notification as Read
* **Actor(s):** User
* **Description:** Marks one notification as read.
* **Preconditions:** Notifications are available.

#### Basic Flow (Main Success Scenario)
1. User selects an unread notification.
2. System marks the notification as read.
3. System updates the unread indicator.

#### Alternative Flows
* **AF38.1: Notification already read**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested mark notification as read operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc37_notifications.png`
  - AF38.1: `prototypes/uc38_af1_notification_already_read.png`

---

### UC39: Mark All Notifications as Read

* **Use Case ID:** UC39
* **Use Case Name:** Mark All Notifications as Read
* **Actor(s):** User
* **Description:** Marks all available notifications as read.
* **Preconditions:** Notifications are available.

#### Basic Flow (Main Success Scenario)
1. User selects Mark All as Read.
2. System marks all unread notifications as read.
3. System updates the notification count.

#### Alternative Flows
* **AF39.1: No unread notifications**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested mark all notifications as read operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc37_notifications.png`
  - AF39.1: `prototypes/uc39_af1_no_unread_notifications.png`

---

### UC40: Receive Match Notification

* **Use Case ID:** UC40
* **Use Case Name:** Receive Match Notification
* **Actor(s):** User
* **Description:** Delivers a notification when a mutual match is created.
* **Preconditions:** A mutual match has been created.

#### Basic Flow (Main Success Scenario)
1. A mutual match is created.
2. System creates a match notification.
3. System makes the notification available to both matched users.

#### Alternative Flows
* **AF40.1: Notification delivery unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested receive match notification operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc40_match_notification.png`
  - AF40.1: `prototypes/uc40_af1_notification_delivery_unavailable.png`

---

### UC41: Receive Message Notification

* **Use Case ID:** UC41
* **Use Case Name:** Receive Message Notification
* **Actor(s):** User
* **Description:** Delivers a notification when a new message is received.
* **Preconditions:** A new message is available for the recipient.

#### Basic Flow (Main Success Scenario)
1. A new message is received.
2. System creates a message notification when appropriate.
3. System makes the notification available to the recipient.

#### Alternative Flows
* **AF41.1: Notification delivery unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested receive message notification operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc41_message_notification.png`
  - AF41.1: `prototypes/uc41_af1_notification_delivery_unavailable.png`

---

## FG-08 Privacy & Safety Controls

### UC42: Block User

* **Use Case ID:** UC42
* **Use Case Name:** Block User
* **Actor(s):** User
* **Description:** Prevents further interaction with a selected user by blocking them.
* **Preconditions:** User is logged in and can access the selected profile.

#### Basic Flow (Main Success Scenario)
1. User opens the selected profile's safety options.
2. User selects Block User.
3. System asks for confirmation.
4. User confirms.
5. System blocks the selected account from further interaction.

#### Alternative Flows
* **AF42.1: User already blocked**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested block user operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc42_block_user.png`
  - AF42.1: `prototypes/uc42_af1_user_already_blocked.png`

---

### UC43: Report User

* **Use Case ID:** UC43
* **Use Case Name:** Report User
* **Actor(s):** User
* **Description:** Allows the user to report another user for a safety or policy concern.
* **Preconditions:** User is logged in and can access the report function.

#### Basic Flow (Main Success Scenario)
1. User opens the report function.
2. System displays report reasons.
3. User selects a reason and submits the report.
4. System records the report.
5. System confirms submission.

#### Alternative Flows
* **AF43.1: Report submission incomplete**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested report user operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc43_report_user.png`
  - AF43.1: `prototypes/uc43_af1_report_submission_incomplete.png`

---

### UC44: Deactivate Account

* **Use Case ID:** UC44
* **Use Case Name:** Deactivate Account
* **Actor(s):** User
* **Description:** Temporarily deactivates the user's account and hides it from normal discovery.
* **Preconditions:** User is logged in.

#### Basic Flow (Main Success Scenario)
1. User opens account settings.
2. User selects Deactivate Account.
3. System explains the effect.
4. User confirms.
5. System deactivates the account and hides it from normal discovery.

#### Alternative Flows
* **AF44.1: Invalid confirmation**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested deactivate account operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc44_deactivate_account.png`
  - AF44.1: `prototypes/uc44_af1_invalid_confirmation.png`

---

### UC45: Permanently Delete Account

* **Use Case ID:** UC45
* **Use Case Name:** Permanently Delete Account
* **Actor(s):** User
* **Description:** Allows the user to permanently request deletion of their account and associated data.
* **Preconditions:** User is logged in.

#### Basic Flow (Main Success Scenario)
1. User opens account deletion settings.
2. System displays a permanent-deletion warning.
3. User confirms the deletion request.
4. System validates the confirmation.
5. System records the deletion request and ends the session.

#### Alternative Flows
* **AF45.1: Confirmation does not match**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested permanently delete account operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc45_delete_account.png`
  - AF45.1: `prototypes/uc45_af1_confirmation_does_not_match.png`

---

## FG-09 Admin Dashboard

### UC46: View Admin Dashboard

* **Use Case ID:** UC46
* **Use Case Name:** View Admin Dashboard
* **Actor(s):** Admin
* **Description:** Provides the administrator with the main dashboard for platform management.
* **Preconditions:** Admin is authenticated and authorized.

#### Basic Flow (Main Success Scenario)
1. Admin opens the Admin Dashboard.
2. System verifies administrative access.
3. System displays platform summary information and management navigation.
4. Admin selects an administrative function.

#### Alternative Flows
* **AF46.1: Unauthorized admin access**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view admin dashboard operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc46_admin_dashboard.png`
  - AF46.1: `prototypes/uc46_af1_unauthorized_admin_access.png`

---

### UC47: View Platform Statistics

* **Use Case ID:** UC47
* **Use Case Name:** View Platform Statistics
* **Actor(s):** Admin
* **Description:** Shows platform-level statistics to the administrator.
* **Preconditions:** Admin dashboard is available.

#### Basic Flow (Main Success Scenario)
1. Admin opens platform statistics.
2. System gathers current platform statistics.
3. System displays summary values and charts.
4. Admin reviews the information.

#### Alternative Flows
* **AF47.1: Statistics temporarily unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view platform statistics operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc46_admin_dashboard.png`
  - AF47.1: `prototypes/uc47_af1_statistics_temporarily_unavailable.png`

---

### UC48: Manage Users

* **Use Case ID:** UC48
* **Use Case Name:** Manage Users
* **Actor(s):** Admin
* **Description:** Provides the administrator with user-management operations.
* **Preconditions:** Admin is authenticated and authorized.

#### Basic Flow (Main Success Scenario)
1. Admin opens User Management.
2. System displays the user-management view.
3. Admin searches or selects a user.
4. System displays available management actions.

#### Alternative Flows
* **AF48.1: User management unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested manage users operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc48_manage_users.png`
  - AF48.1: `prototypes/uc48_af1_user_management_unavailable.png`

---

### UC49: Search Users

* **Use Case ID:** UC49
* **Use Case Name:** Search Users
* **Actor(s):** Admin
* **Description:** Allows the administrator to find users in the management view.
* **Preconditions:** Admin is viewing user management.

#### Basic Flow (Main Success Scenario)
1. Admin opens the user search control.
2. Admin enters search information.
3. System finds matching users.
4. System displays the matching users.

#### Alternative Flows
* **AF49.1: No matching users**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested search users operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc48_manage_users.png`
  - AF49.1: `prototypes/uc49_af1_no_matching_users.png`

---

### UC50: View User Details

* **Use Case ID:** UC50
* **Use Case Name:** View User Details
* **Actor(s):** Admin
* **Description:** Shows detailed information about a selected user.
* **Preconditions:** Admin has selected a user.

#### Basic Flow (Main Success Scenario)
1. Admin selects a user.
2. System loads the user's available details.
3. System displays profile and account information.
4. Admin selects an available management action if needed.

#### Alternative Flows
* **AF50.1: User details unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested view user details operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc50_user_details.png`
  - AF50.1: `prototypes/uc50_af1_user_details_unavailable.png`

---

### UC51: Block User Account

* **Use Case ID:** UC51
* **Use Case Name:** Block User Account
* **Actor(s):** Admin
* **Description:** Blocks a user account from normal platform use.
* **Preconditions:** Admin has selected an account that may be blocked.

#### Basic Flow (Main Success Scenario)
1. Admin selects Block User Account.
2. System displays a confirmation.
3. Admin confirms the action.
4. System blocks the account.
5. System updates the account status.

#### Alternative Flows
* **AF51.1: Account cannot be blocked**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested block user account operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc50_user_details.png`
  - AF51.1: `prototypes/uc51_af1_account_cannot_be_blocked.png`

---

### UC52: Unblock User Account

* **Use Case ID:** UC52
* **Use Case Name:** Unblock User Account
* **Actor(s):** Admin
* **Description:** Restores a previously blocked user account.
* **Preconditions:** Admin has selected a blocked account.

#### Basic Flow (Main Success Scenario)
1. Admin selects an account that is blocked.
2. Admin selects Unblock User Account.
3. System asks for confirmation.
4. Admin confirms.
5. System restores the account's active status.

#### Alternative Flows
* **AF52.1: Account is not blocked**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested unblock user account operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc50_user_details.png`
  - AF52.1: `prototypes/uc52_af1_account_is_not_blocked.png`

---

### UC53: Delete User Account

* **Use Case ID:** UC53
* **Use Case Name:** Delete User Account
* **Actor(s):** Admin
* **Description:** Permanently removes a user account through the administrative process.
* **Preconditions:** Admin has selected an account eligible for deletion.

#### Basic Flow (Main Success Scenario)
1. Admin selects Delete User Account.
2. System displays a permanent-deletion warning.
3. Admin confirms the action.
4. System processes the deletion.
5. System updates the user-management list.

#### Alternative Flows
* **AF53.1: Deletion cannot be completed**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested delete user account operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc50_user_details.png`
  - AF53.1: `prototypes/uc53_af1_deletion_cannot_be_completed.png`

---

### UC54: Manage Interest Tag Catalogue

* **Use Case ID:** UC54
* **Use Case Name:** Manage Interest Tag Catalogue
* **Actor(s):** Admin
* **Description:** Provides the administrator with the interest-tag catalogue management view.
* **Preconditions:** Admin is authenticated and authorized.

#### Basic Flow (Main Success Scenario)
1. Admin opens the interest-tag catalogue.
2. System displays existing tags and management controls.
3. Admin selects an add or remove operation.

#### Alternative Flows
* **AF54.1: Catalogue unavailable**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested manage interest tag catalogue operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc54_interest_catalogue.png`
  - AF54.1: `prototypes/uc54_af1_catalogue_unavailable.png`

---

### UC55: Add Interest Tag

* **Use Case ID:** UC55
* **Use Case Name:** Add Interest Tag
* **Actor(s):** Admin
* **Description:** Adds a new interest tag to the catalogue.
* **Preconditions:** Admin can manage the interest-tag catalogue.

#### Basic Flow (Main Success Scenario)
1. Admin selects Add Interest Tag.
2. System displays the tag form.
3. Admin enters the tag information.
4. Admin confirms the addition.
5. System adds the new tag to the catalogue.

#### Alternative Flows
* **AF55.1: Duplicate interest tag**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested add interest tag operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc55_add_interest.png`
  - AF55.1: `prototypes/uc55_af1_duplicate_interest_tag.png`

---

### UC56: Remove Interest Tag

* **Use Case ID:** UC56
* **Use Case Name:** Remove Interest Tag
* **Actor(s):** Admin
* **Description:** Removes an existing interest tag from the catalogue.
* **Preconditions:** Admin can manage the interest-tag catalogue.

#### Basic Flow (Main Success Scenario)
1. Admin selects an existing interest tag.
2. Admin selects Remove Interest Tag.
3. System asks for confirmation.
4. Admin confirms.
5. System removes the tag from the available catalogue.

#### Alternative Flows
* **AF56.1: Interest tag is still in use**
  * System detects the alternative condition.
  * System displays the appropriate state or message.
  * User can correct the input, retry, or leave the flow when applicable.

* **Postconditions:** The requested remove interest tag operation is completed successfully, or the system remains in a safe and recoverable state after an alternative flow.
* **UI Prototype References:**
  - Main Flow: `prototypes/uc56_remove_interest.png`
  - AF56.1: `prototypes/uc56_af1_interest_tag_is_still_in_use.png`

---

## 57. Prototype Submission Checklist

The specification references prototype files by UC and Alternative Flow. The submission package must contain the referenced files under:

```text
prototypes/
```

At minimum, each UC needs a main-flow prototype. Alternative-flow prototypes are required when the alternative flow changes what the user sees (for example, validation errors, empty states, confirmation dialogs, permission errors, unavailable services, or failed submissions).

The two prototype screenshots already available in the project can be reused where they genuinely match the corresponding UC; they should not be copied to unrelated UCs.

## 58. Specification Quality Rules Applied

- Actors are consistent with the revised Use-Case Model: `Guest User`, `User`, and `Admin`.
- `UC01: Sign Up` uses `Guest User`, not registered `User`.
- Every UC keeps its `UCxx` identifier.
- Basic flows describe user goals and system behavior rather than implementation.
- Technical implementation details such as bcrypt, JWT, REST paths, HTTP status codes, database queries, WebSocket events, framework names, and internal class names are excluded from the UC flows.
- Alternative flows are explicitly documented and have a prototype reference when they produce a visible UI state.
