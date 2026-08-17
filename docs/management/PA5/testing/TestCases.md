# Test Cases
**Performed by:** Huy Tuong  
**Reviewed by:** Trung Nghia
**Edited by:** Huy Tuong

## Use Case 1: Register

### TC-REG-01 — Register with valid information

**Precondition:**
- User is on the Register page.
- The email address has not been registered before.

**Test Steps:**
1. Enter a valid full name.
2. Enter a valid email address.
3. Enter a valid password.
4. Enter the same password in the confirmation field.
5. Click the **Register** button.

**Expected Result:**
- The system validates all information successfully.
- A new user account is created.
- The user is redirected to the appropriate page or receives a successful registration message.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-02 — Register with existing email

**Precondition:**
- User is on the Register page.
- The email address is already registered in the system.

**Test Steps:**
1. Enter a valid full name.
2. Enter an email address that already exists.
3. Enter a valid password.
4. Enter the same password in the confirmation field.
5. Click the **Register** button.

**Expected Result:**
- The system rejects the registration.
- The user is informed that the email address is already registered.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-03 — Register with invalid email format

**Precondition:**
- User is on the Register page.

**Test Steps:**
1. Enter a valid full name.
2. Enter an invalid email address, such as `user@`.
3. Enter a valid password.
4. Enter the same password in the confirmation field.
5. Click the **Register** button.

**Expected Result:**
- The system rejects the invalid email address.
- A validation message is displayed indicating that the email format is invalid.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-04 — Register with empty email

**Precondition:**
- User is on the Register page.

**Test Steps:**
1. Enter a valid full name.
2. Leave the email field empty.
3. Enter a valid password.
4. Enter the same password in the confirmation field.
5. Click the **Register** button.

**Expected Result:**
- The system does not create the account.
- A validation message is displayed indicating that the email is required.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-05 — Register with empty password

**Precondition:**
- User is on the Register page.

**Test Steps:**
1. Enter a valid full name.
2. Enter a valid email address.
3. Leave the password field empty.
4. Enter a value in the confirmation password field.
5. Click the **Register** button.

**Expected Result:**
- The system does not create the account.
- A validation message is displayed indicating that the password is required.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-06 — Register with empty required fields

**Precondition:**
- User is on the Register page.

**Test Steps:**
1. Leave all required registration fields empty.
2. Click the **Register** button.

**Expected Result:**
- The system does not create an account.
- Validation messages are displayed for the required fields.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-07 — Register with mismatched passwords

**Precondition:**
- User is on the Register page.

**Test Steps:**
1. Enter a valid full name.
2. Enter a valid email address.
3. Enter a valid password.
4. Enter a different password in the confirmation field.
5. Click the **Register** button.

**Expected Result:**
- The system rejects the registration.
- A validation message is displayed indicating that the passwords do not match.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-08 — Register with password that does not meet requirements

**Precondition:**
- User is on the Register page.
- The system has password validation requirements.

**Test Steps:**
1. Enter a valid full name.
2. Enter a valid email address.
3. Enter a password that does not satisfy the password requirements.
4. Enter the same password in the confirmation field.
5. Click the **Register** button.

**Expected Result:**
- The system rejects the registration.
- A validation message explains the password requirements.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-09 — Register with invalid required information

**Precondition:**
- User is on the Register page.

**Test Steps:**
1. Enter invalid data in one or more required fields.
2. Enter valid data in the remaining fields.
3. Click the **Register** button.

**Expected Result:**
- The system validates the submitted information.
- The system rejects the invalid data.
- Appropriate validation messages are displayed.
- No account is created.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-10 — Register again using an email that has already been registered

**Precondition:**
- A user account has already been successfully registered.
- The user is on the Register page.

**Test Steps:**
1. Enter a valid full name.
2. Enter the email address of the existing account.
3. Enter a valid password.
4. Enter the same password in the confirmation field.
5. Click the **Register** button.

**Expected Result:**
- The system prevents the creation of a duplicate account.
- The user is informed that the email address is already in use.

**Actual Result:**
- ...

**Status:**
PASS 
...

---

## Use Case 2: Upgrade User Membership

### TC-MEMBERSHIP-01 — Upgrade to a valid membership plan

**Precondition:**
- User is logged in.
- User is currently using a free membership.
- At least one paid membership plan is available.

**Test Steps:**
1. Navigate to the **Membership** page.
2. Select an available paid membership plan.
3. Review the plan information.
4. Click the **Upgrade** button.

**Expected Result:**
- The system processes the upgrade request successfully.
- The user's membership is upgraded to the selected plan.
- The new membership status is displayed correctly.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MEMBERSHIP-02 — View available membership plans

**Precondition:**
- User is logged in.

**Test Steps:**
1. Navigate to the **Membership** page.
2. View the available membership plans.

**Expected Result:**
- The system displays the available membership plans.
- Each plan displays its relevant information, such as membership name, price, and benefits.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MEMBERSHIP-03 — Select a membership plan before upgrading

**Precondition:**
- User is logged in.
- Multiple membership plans are available.

**Test Steps:**
1. Navigate to the **Membership** page.
2. Select one of the available membership plans.
3. Review the selected plan.

**Expected Result:**
- The selected membership plan is clearly identified.
- The system displays the correct information for the selected plan.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MEMBERSHIP-04 — Attempt to upgrade without selecting a membership plan

**Precondition:**
- User is logged in.
- Multiple membership plans are available.

**Test Steps:**
1. Navigate to the **Membership** page.
2. Do not select any membership plan.
3. Attempt to click the **Upgrade** button.

**Expected Result:**
- The system does not process the upgrade.
- The user is informed that a membership plan must be selected.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MEMBERSHIP-05 — Enter invalid payment information

**Precondition:**
- User is logged in.
- User has selected a paid membership plan.
- Payment information is required for the upgrade.

**Test Steps:**
1. Select a paid membership plan.
2. Enter invalid payment information.
3. Submit the upgrade request.

**Expected Result:**
- The system rejects the invalid payment information.
- The membership is not upgraded.
- An appropriate error message is displayed.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MEMBERSHIP-06 — Submit upgrade with missing payment information

**Precondition:**
- User is logged in.
- User has selected a paid membership plan.
- Payment information is required.

**Test Steps:**
1. Select a paid membership plan.
2. Leave the required payment fields empty.
3. Submit the upgrade request.

**Expected Result:**
- The system does not process the upgrade.
- Validation messages are displayed for the required payment fields.
- The user's membership remains unchanged.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MEMBERSHIP-07 — Cancel the membership upgrade process

**Precondition:**
- User is logged in.
- User has selected a membership plan.
- The upgrade process has not been completed.

**Test Steps:**
1. Navigate to the **Membership** page.
2. Select a paid membership plan.
3. Start the upgrade process.
4. Click the **Cancel** button.

**Expected Result:**
- The upgrade process is cancelled.
- No membership upgrade is applied.
- The user's current membership remains unchanged.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MEMBERSHIP-08 — Verify membership after successful upgrade

**Precondition:**
- User is logged in.
- User has successfully completed a membership upgrade.

**Test Steps:**
1. Navigate to the **Profile** or **Membership** page.
2. View the user's current membership status.

**Expected Result:**
- The system displays the newly upgraded membership.
- The membership information matches the selected upgrade plan.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MEMBERSHIP-09 — Attempt to upgrade to an unavailable membership plan

**Precondition:**
- User is logged in.
- The selected membership plan is unavailable or no longer offered.

**Test Steps:**
1. Navigate to the **Membership** page.
2. Attempt to select or upgrade to the unavailable membership plan.
3. Submit the upgrade request.

**Expected Result:**
- The system prevents the user from upgrading to the unavailable plan.
- An appropriate message is displayed.
- The user's current membership remains unchanged.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MEMBERSHIP-10 — Attempt to upgrade when the user already has an active membership

**Precondition:**
- User is logged in.
- User already has an active paid membership.

**Test Steps:**
1. Navigate to the **Membership** page.
2. Attempt to upgrade to another membership plan.
3. Submit the upgrade request.

**Expected Result:**
- The system handles the existing membership according to the membership rules.
- The system either prevents the upgrade or provides the available upgrade options.
- The user's membership status is updated only if the upgrade is valid.

**Actual Result:**
- ...

**Status:**
...

---

## Use Case 3: Profile

### TC-PROFILE-01 — View profile with valid information

**Precondition:**
- User is logged in.
- User has an existing profile.

**Test Steps:**
1. Navigate to the **Profile** page.
2. View the profile information.

**Expected Result:**
- The system displays the user's profile.
- The displayed information matches the information stored in the user's account.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-02 — View profile with incomplete information

**Precondition:**
- User is logged in.
- User's profile contains some incomplete or optional information.

**Test Steps:**
1. Navigate to the **Profile** page.
2. View the profile information.

**Expected Result:**
- The system displays the available profile information.
- Missing optional information does not cause the profile page to malfunction.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-03 — Edit profile with valid information

**Precondition:**
- User is logged in.
- User is on the Profile page.

**Test Steps:**
1. Click the **Edit Profile** button.
2. Modify the profile information with valid data.
3. Click the **Save** button.

**Expected Result:**
- The system accepts the updated information.
- The profile is updated successfully.
- The new information is displayed on the Profile page.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-04 — Edit profile with empty required field

**Precondition:**
- User is logged in.
- User is editing their profile.

**Test Steps:**
1. Open **Edit Profile**.
2. Clear a required profile field.
3. Click the **Save** button.

**Expected Result:**
- The system does not save the invalid profile information.
- A validation message indicates that the required field must be completed.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-05 — Edit profile with invalid information

**Precondition:**
- User is logged in.
- User is editing their profile.

**Test Steps:**
1. Open **Edit Profile**.
2. Enter invalid data into a profile field.
3. Click the **Save** button.

**Expected Result:**
- The system validates the entered information.
- The invalid information is rejected.
- An appropriate validation message is displayed.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-06 — Cancel profile editing

**Precondition:**
- User is logged in.
- User is editing their profile.

**Test Steps:**
1. Open **Edit Profile**.
2. Change one or more profile fields.
3. Click the **Cancel** button.

**Expected Result:**
- The changes are discarded.
- The profile remains unchanged.
- The user returns to the Profile page.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-07 — Update profile information successfully

**Precondition:**
- User is logged in.
- User has an existing profile.

**Test Steps:**
1. Open **Edit Profile**.
2. Change the profile information.
3. Click the **Save** button.
4. Reload the Profile page.

**Expected Result:**
- The updated information is saved successfully.
- The updated information remains displayed after reloading the page.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-08 — Refresh profile after updating information

**Precondition:**
- User is logged in.
- User has successfully updated their profile.

**Test Steps:**
1. Navigate to the Profile page.
2. Verify the updated information.
3. Refresh the page.

**Expected Result:**
- The profile page loads successfully.
- The updated information is still displayed after refreshing the page.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-09 — Access profile without authentication

**Precondition:**
- User is not logged in.

**Test Steps:**
1. Attempt to access the Profile page directly.

**Expected Result:**
- The system prevents unauthorized access to the user's profile.
- The user is redirected to the Login page or shown an appropriate authentication message.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-10 — Prevent unauthorized modification of another user's profile

**Precondition:**
- User is logged in.
- Another user's profile exists in the system.

**Test Steps:**
1. Attempt to access another user's profile editing function.
2. Attempt to modify the other user's profile information.
3. Submit the changes.

**Expected Result:**
- The system prevents the user from modifying another user's profile.
- The other user's profile remains unchanged.

**Actual Result:**
- ...

**Status:**
...

---

## Use Case 4: Matching

### TC-MATCH-01 — View matching recommendations

**Precondition:**
- User is logged in.
- User has completed the required profile information.

**Test Steps:**
1. Navigate to the **Matching** page.
2. View the recommended profiles.

**Expected Result:**
- The system displays profiles recommended for the user.
- The recommended profiles are displayed correctly.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-02 — View details of a recommended profile

**Precondition:**
- User is logged in.
- Matching recommendations are available.

**Test Steps:**
1. Navigate to the **Matching** page.
2. Select a recommended profile.
3. View the profile details.

**Expected Result:**
- The system displays the selected user's available profile information.
- The user can view the profile before making a matching decision.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-03 — Like a recommended profile

**Precondition:**
- User is logged in.
- At least one recommended profile is available.

**Test Steps:**
1. Navigate to the **Matching** page.
2. Select a recommended profile.
3. Click the **Like** button.

**Expected Result:**
- The system records the user's Like action.
- The selected profile is processed according to the matching rules.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-04 — Dislike a recommended profile

**Precondition:**
- User is logged in.
- At least one recommended profile is available.

**Test Steps:**
1. Navigate to the **Matching** page.
2. Select a recommended profile.
3. Click the **Dislike** button.

**Expected Result:**
- The system records the user's Dislike action.
- The selected profile is removed or skipped according to the matching rules.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-05 — Match when two users like each other

**Precondition:**
- User A and User B are eligible for matching.
- User A likes User B.
- User B likes User A.

**Test Steps:**
1. User A likes User B.
2. User B likes User A.
3. Check the matching result for both users.

**Expected Result:**
- The system identifies the mutual Like.
- A Match is created between User A and User B.
- Both users are informed about the Match.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-06 — No match when only one user likes the other

**Precondition:**
- User A and User B are eligible for matching.
- User A likes User B.
- User B does not like User A.

**Test Steps:**
1. User A likes User B.
2. User B does not like User A.
3. Check the matching result.

**Expected Result:**
- No Match is created between the two users.
- The system records User A's Like according to the matching rules.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-07 — Prevent matching with the same profile repeatedly

**Precondition:**
- User is logged in.
- User has already processed a recommended profile.

**Test Steps:**
1. Navigate to the **Matching** page.
2. Process the same recommended profile.
3. Refresh or revisit the Matching page.

**Expected Result:**
- The previously processed profile is not repeatedly presented as a new recommendation, according to the matching rules.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-08 — Matching with no available recommendations

**Precondition:**
- User is logged in.
- There are no eligible profiles available for matching.

**Test Steps:**
1. Navigate to the **Matching** page.
2. Wait for the system to load recommendations.

**Expected Result:**
- The system displays an appropriate message indicating that there are no available recommendations.
- The Matching page remains functional.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-09 — Access Matching without authentication

**Precondition:**
- User is not logged in.

**Test Steps:**
1. Attempt to access the **Matching** page directly.

**Expected Result:**
- The system prevents unauthorized access.
- The user is redirected to the Login page or shown an appropriate authentication message.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-10 — Matching recommendations respect user preferences

**Precondition:**
- User is logged in.
- User has configured matching preferences in their profile.
- Eligible profiles with different characteristics are available.

**Test Steps:**
1. Navigate to the **Matching** page.
2. View the recommended profiles.
3. Compare the recommendations with the user's configured matching preferences.

**Expected Result:**
- The system recommends profiles according to the configured matching preferences and matching rules.
- Profiles that do not meet the required criteria are excluded when applicable.

**Actual Result:**
- ...

**Status:**
...

---

## Use Case 5: Chat

### TC-CHAT-01 — Send a message to a matched user

**Precondition:**
- User is logged in.
- User has a Match with another user.
- The Chat page is available.

**Test Steps:**
1. Navigate to the **Chat** page.
2. Select a matched user.
3. Enter a message in the message input field.
4. Click the **Send** button.

**Expected Result:**
- The message is sent successfully.
- The message appears in the conversation.
- The recipient can receive the message.

**Actual Result:**
- ...

**Status:**
...

---

### TC-CHAT-02 — Send an empty message

**Precondition:**
- User is logged in.
- User has an existing conversation.

**Test Steps:**
1. Open a conversation.
2. Leave the message input field empty.
3. Click the **Send** button.

**Expected Result:**
- The system does not send an empty message.
- The conversation remains unchanged.

**Actual Result:**
- ...

**Status:**
...

---

### TC-CHAT-03 — Send multiple messages

**Precondition:**
- User is logged in.
- User has an existing conversation.

**Test Steps:**
1. Open a conversation.
2. Enter a message.
3. Click **Send**.
4. Enter another message.
5. Click **Send** again.

**Expected Result:**
- All messages are sent successfully.
- The messages appear in the correct order in the conversation.

**Actual Result:**
- ...

**Status:**
...

---

### TC-CHAT-04 — Receive a message from another user

**Precondition:**
- User is logged in.
- User has an existing conversation with another matched user.
- The other user can send messages.

**Test Steps:**
1. Open the conversation.
2. Have the other user send a message.
3. Observe the conversation.

**Expected Result:**
- The received message appears in the conversation.
- The message is displayed with the correct sender information.

**Actual Result:**
- ...

**Status:**
...

---

### TC-CHAT-05 — Display conversation history

**Precondition:**
- User is logged in.
- The selected conversation contains previous messages.

**Test Steps:**
1. Navigate to the **Chat** page.
2. Select a conversation with previous messages.
3. View the conversation.

**Expected Result:**
- The system displays the previous messages.
- Messages are displayed in the correct chronological order.

**Actual Result:**
- ...

**Status:**
...

---

### TC-CHAT-06 — Send a message containing special characters

**Precondition:**
- User is logged in.
- User has an existing conversation.

**Test Steps:**
1. Open a conversation.
2. Enter a message containing special characters.
3. Click the **Send** button.

**Expected Result:**
- The system processes the message correctly.
- The message is displayed without causing errors or breaking the Chat interface.

**Actual Result:**
- ...

**Status:**
...

---

### TC-CHAT-07 — Send a long message

**Precondition:**
- User is logged in.
- User has an existing conversation.
- The message is within or around the system's supported message length.

**Test Steps:**
1. Open a conversation.
2. Enter a long message.
3. Click the **Send** button.

**Expected Result:**
- The system handles the message according to the defined message length rules.
- If the message is within the allowed limit, it is sent successfully.
- If the message exceeds the limit, an appropriate validation message is displayed.

**Actual Result:**
- ...

**Status:**
...

---

### TC-CHAT-08 — Open a conversation with a matched user

**Precondition:**
- User is logged in.
- User has at least one Match.

**Test Steps:**
1. Navigate to the **Chat** page.
2. Select a matched user from the conversation list.

**Expected Result:**
- The selected conversation opens successfully.
- The correct matched user's information and conversation history are displayed.

**Actual Result:**
- ...

**Status:**
...

---

### TC-CHAT-09 — Access Chat without authentication

**Precondition:**
- User is not logged in.

**Test Steps:**
1. Attempt to access the **Chat** page directly.

**Expected Result:**
- The system prevents unauthorized access to the Chat feature.
- The user is redirected to the Login page or shown an appropriate authentication message.

**Actual Result:**
- ...

**Status:**
...

---

### TC-CHAT-10 — Prevent chatting with an unmatched user

**Precondition:**
- User is logged in.
- The selected user is not matched with the current user.

**Test Steps:**
1. Attempt to open a chat with the unmatched user.
2. Attempt to send a message.

**Expected Result:**
- The system prevents the user from sending messages to an unmatched user.
- No message is sent or created in the conversation.

**Actual Result:**
- ...

**Status:**
...

---