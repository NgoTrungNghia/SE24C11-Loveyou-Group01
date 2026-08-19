# Test Cases
**Executed by:** Huy Tuong
**Reviewed by:** Trung Nghia
**Edited by:** Huy Tuong

## Use Case 1: Registration

### TC-REG-01 — Registration with valid information

**Prerequisites:**
- User is on the Registration page.
- Email address has not been registered previously.

**Test steps:**
1. Enter a valid full name.
2. Enter a valid email address.
3. Enter a valid password.
4. Click the **Register** button.

**Expected results:**
- System successfully validates all information.
- A new user account is created.
- User is redirected to the appropriate page or receives a successful registration notification.

**Actual results:**
- ...

**Status:**
PASS

---

### TC-REG-02 — Registration with an existing email

**Prerequisites:**
- User is on the Registration page.
- Email address is already registered in the system.

**Test steps:**
1. Enter a valid full name.
2. Enter an existing email address.
3. Enter a valid password.
4. Click the **Register** button.

**Expected results:**
- System rejects the registration.
- User is notified that the email address is already registered.

**Actual results:**
- ...

**Status:**
PASS

---

### TC-REG-03 — Registration with invalid email format

**Prerequisites:**
- User is on the Registration page.

**Test steps:**
1. Enter a valid full name.
2. Enter an invalid email format (e.g., starting with numbers like 123@abc.com).
3. Enter a valid password. 4. Re-enter the same password in the password confirmation field.
5. Click the **Register** button.

**Expected result:**
- The system rejects the invalid email address.
- A validation message is displayed indicating the email format is invalid.

**Actual result:**
- ...

**Status:**
PASS

---

### TC-REG-04 — Registration with the email field left blank

**Prerequisites:**
- The user is on the Registration page.

**Test steps:**
1. Enter a valid full name.
2. Leave the email field blank.
3. Enter a valid password.
4. Click the **Register** button.

**Expected result:**
- The system does not create an account.
- A validation message is displayed indicating that the email is required.

**Actual result:**
- ...

**Status:**
PASS

---

### TC-REG-05 — Registration with the password field left blank

**Prerequisites:**
- The user is on the Registration page.

**Test steps:**
1. Enter a valid full name.
2. Enter a valid email address.
3. Leave the password field blank.
4. Click the **Register** button.

**Expected result:**
- The system does not create an account.
- A validation message is displayed indicating that the password is required.

**Actual result:**
- ...

**Status:**
PASS

---

### TC-REG-06 — Registration with mandatory fields left blank

**Prerequisites:**
- The user is on the Registration page.

**Test steps:**
1. Leave all mandatory registration fields blank.
2. Click the **Register** button.

**Expected result:**
- The system does not create an account.
- Validation messages are displayed for the mandatory fields. **Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-08 — Registration with a password that does not meet requirements

**Prerequisites:**
- User is on the Registration page.
- The system has password validation requirements.

**Test Steps:**
1. Enter a valid full name.
2. Enter a valid email address.
3. Enter a password that does not meet the password requirements.
4. Re-enter the same password in the password confirmation field.
5. Click the **Register** button.

**Expected Result:**
- The system rejects the registration.
- A validation message explaining the password requirements is displayed.

**Actual Result:**
- ...

**Status:**
PASS

---

### TC-REG-09 — Registration with an invalid email address

**Prerequisites:**
- User is on the Registration page.

**Test Steps:**
1. Enter a valid full name.
2. Enter an email address with an incorrect format.
3. Enter a valid password.
4. Click the **Register** button. **Expected results:**
- The system validates the email address.
- The system rejects the registration request.
- A notification indicating an invalid email address is displayed.
- No account is created.

**Actual results:**
- ...

**Status:**
...

### TC-REG-10 — Re-registering with an already registered email

**Prerequisites:**
- A user account has been successfully registered previously.
- The user is on the Registration page.

**Test steps:**
1. Enter a valid full name.
2. Enter the email address of an existing account.
3. Enter a valid password.
4. Re-enter the same password in the password confirmation field.
5. Click the **Register** button.

**Expected results:**
- The system prevents the creation of a duplicate account.
- The user is notified that the email address has already been used.

**Actual Result:**
- ...

**Status:**
PASS

---

## Use Case 2: User Management for Admins

### TC-ADMIN-01 — View user list

**Prerequisites:**
- Admin is logged in.
- Admin has user management permissions.

**Test steps:**
1. Access the **User Management** page.
2. View the list of users.

**Expected results:**
- The system displays the list of users.
- User information is displayed accurately.

**Actual results:**
- ...

**Status:**
...

---

### TC-ADMIN-02 — Search for a specific user

**Prerequisites:**
- Admin is logged in.
- Admin has user management permissions.
- The user to be found exists in the system.

**Test steps:**
1. Access the **User Management** page.
2. Enter the user's name or email into the search field.
3. Click the **Search** button.

**Expected results:**
- The system displays the matching user.
- User information is displayed accurately.

**Actual results:**
- ...

**Status:**
...

---

### TC-ADMIN-03 — View user details

**Prerequisites:**
- Admin is logged in.
- Admin has user management permissions.
- The user to be viewed exists in the system.

**Test steps:**
1. Access the **User Management** page.
2. Select a user from the user list.
3. Open the user's detailed information.

**Expected results:**
- The system displays the details of the selected user.
- The displayed information corresponds accurately to the selected user.

**Actual results:**
- ...

**Status:**
...

---

### TC-ADMIN-04 — View detailed user information

**Prerequisites:**
- Admin is logged in. - Admin has user management privileges.
- The target user exists in the system.

**Test steps:**
1. Access the **User Management** page.
2. Select a user from the list.
3. Open the user's details.

**Expected results:**
- The system displays the details of the selected user.
- The displayed information is accurate and corresponds to the selected user.
- The admin cannot edit the user's profile information.

**Actual results:**
- ...

**Status:**
...

---

### TC-ADMIN-05 — Deactivate user account

**Prerequisites:**
- Admin is logged in.
- Admin has user management privileges.
- The target user has an active account.

**Test steps:**
1. Access the **User Management** page.
2. Select an active user.
3. Select the **Deactivate account** action.
4. Confirm the action.

**Expected results:**
- The system deactivates the selected user's account.
- The user's account status is updated to "deactivated."
- The user can no longer access functions requiring an active account.

**Actual results:**
- ...

**Status:**
...

---

### TC-ADMIN-06 — Reactivate a deactivated user account

**Prerequisites:**
- Admin is logged in.
- Admin has user management privileges.
- The target user's account is currently deactivated.

**Test steps:**
1. Access the **User Management** page.
2. Select a deactivated user.
3. Select the **Activate account** action.
4. Confirm the action.

**Expected results:**
- The system reactivates the selected user's account. - The user's account status is updated to "active."
- The user can regain access to the system in accordance with account rules.

**Actual Result:**
- ...

**Status:**
...

---

### TC-ADMIN-08 — Accessing User Management without Admin privileges

**Prerequisites:**
- User is logged in.
- User does not have administrator privileges.

**Test Steps:**
1. Attempt to access the **User Management** page directly.
2. Attempt to perform an administrative action.

**Expected Result:**
- The system prevents unauthorized access.
- The user cannot perform administrative actions.
- An appropriate permission-related message is displayed, or the user is redirected.

**Actual Result:**
- ...

**Status:**
...

---

### TC-ADMIN-09 — Searching for a non-existent user

**Prerequisites:**
- Admin is logged in.
- Admin has user management privileges.

**Test Steps:**
1. Access the **User Management** page.
2. Enter a name or email that does not exist in the system. 3. Click the **Search** button.

**Expected result:**
- The system does not display irrelevant users.
- The system displays an appropriate notification indicating that no matching user was found.

**Actual result:**
- ...

**Status:**
...

### TC-ADMIN-10 — Canceling an Admin Action

**Prerequisites:**

- Admin is logged in.
- Admin has user management privileges.
- An admin action is available for the user.

**Testing Steps:**
1. Access the **User Management** page.
2. Select a user.
3. Start an admin action.
4. Click the **Cancel** button.

**Expected Result:**
- The admin action is canceled.
- No changes are applied to the user's account.
- The user's information remains unchanged.

**Actual Result:**

- ...

**Status:**

...

---
sh profile after updating information

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

## Use Case 3: Profile

### TC-PROFILE-01 — View profile with valid information

**Prerequisites:**
- User is logged in.
- User has a profile.

**Test steps:**
1. Access the **Profile** page.
2. View profile information.

**Expected results:**
- The system displays the user's profile.
- Displayed information matches the data stored in the user account.

**Actual results:**
- ...

**Status:**
...

---

### TC-PROFILE-02 — View profile with incomplete information

**Prerequisites:**
- User is logged in.
- User profile contains some incomplete or non-mandatory information.

**Test steps:**
1. Access the **Profile** page.
2. View profile information.

**Expected results:**
- The system displays the available profile information.
- Missing non-mandatory information does not cause errors on the Profile page.

**Actual results:**
- ...

**Status:**
...

---

### TC-PROFILE-03 — Edit profile with valid information

**Prerequisites:**
- User is logged in.
- User is on the Profile page.

**Test steps:**
1. Click the **Edit Profile** button.
2. Modify profile information using valid data.
3. Click the **Save** button.

**Expected results:**
- The system accepts the updated information.
- The profile is successfully updated.
- The new information is displayed on the Profile page.

**Actual results:**
- ...

**Status:**
...

---

### TC-PROFILE-04 — Edit profile with mandatory field left blank

**Prerequisites:**
- User is logged in.
- User is editing their profile. **Test steps:**
1. Open **Edit Profile**.
2. Clear the content of a mandatory profile field.
3. Click the **Save** button.

**Expected results:**
- The system does not save the invalid profile information.
- A validation message indicates that the mandatory field must be filled in.

**Actual results:**
- ...

**Status:**
...

---

### TC-PROFILE-05 — Edit profile with invalid information

**Prerequisites:**
- User is logged in.
- User is editing their profile.

**Test steps:**
1. Open **Edit Profile**.
2. Enter invalid data into a profile field.
3. Click the **Save** button.

**Expected results:**
- The system validates the entered information.
- Invalid information is rejected.
- An appropriate validation message is displayed.

**Actual results:**
- ...

**Status:**
...

---

### TC-PROFILE-06 — Cancel profile editing

**Prerequisites:**
- User is logged in.
- User is editing their profile.

**Test steps:**
1. Open **Edit Profile**.
2. Modify one or more profile fields.
3. Click the **Cancel** button.

**Expected results:**
- Changes are discarded.
- The profile remains unchanged.
- The user returns to the Profile page.

**Actual results:**
- ...

**Status:**
...

---

### TC-PROFILE-07 — Successful profile information update

**Prerequisites:**
- User is logged in.
- User already has a profile.

**Test steps:**
1. Open **Edit Profile**.
2. Modify profile information. 3. Click the **Save** button.
4. Reload the Profile page.

**Expected Result:**
- The updated information is saved successfully.
- The updated information remains displayed after reloading the page.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-08 — Refreshing profile after updating information

**Prerequisites:**
- User is logged in.
- User has successfully updated their profile.

**Test Steps:**
1. Access the Profile page.
2. Check the updated information.
3. Refresh the page.

**Expected Result:**
- The Profile page loads successfully.
- The updated information remains displayed after refreshing the page.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-09 — Accessing profile without authentication

**Prerequisites:**
- User is not logged in.

**Test Steps:**
1. Attempt to access the Profile page directly.

**Expected Result:**
- The system prevents unauthorized access to the user profile.
- The user is redirected to the Login page or an appropriate authentication message is displayed.

**Actual Result:**
- ...

**Status:**
...

---

### TC-PROFILE-10 — Preventing unauthorized editing of another user's profile

**Prerequisites:**
- User is logged in.
- Another user's profile exists in the system.

**Test Steps:**
1. Attempt to access the profile editing function for another user.
2. Attempt to edit the profile information of another user.
3. Submit the changes.

**Expected Result:**
- The system prevents the user from editing another user's profile.
- The other user's profile remains unchanged. **Actual results:**
- ...

**Status:**
...

---

## Use Case 4: Matching

### TC-MATCH-01 — View matching recommendations

**Prerequisites:**
- User is logged in.
- User has completed mandatory profile information.

**Test steps:**
1. Access the **Matching** page.
2. View recommended profiles.

**Expected results:**
- The system displays recommended profiles to the user.
- Recommended profiles are displayed correctly.

**Actual results:**
- ...

**Status:**
...

---

### TC-MATCH-02 — View recommended profile details

**Prerequisites:**
- User is logged in.
- Matching recommendations are available.

**Test steps:**
1. Access the **Matching** page.
2. Select a recommended profile.
3. View profile details.

**Expected results:**
- The system displays available profile information for the selected user.
- The user can view the profile before making a matching decision.

**Actual results:**
- ...

**Status:**
...

---

### TC-MATCH-03 — Like a recommended profile

**Prerequisites:**
- User is logged in.
- At least one recommended profile is available.

**Test steps:**
1. Access the **Matching** page.
2. Select a recommended profile.
3. Click the **Like** button.

**Expected results:**
- The system records the user's "Like" action.
- The selected profile is processed according to matching rules.

**Actual results:**
- ...

**Status:**
...

---

### TC-MATCH-04 — Dislike a recommended profile

**Prerequisites:**
- User is logged in.
- At least one recommended profile is available. **Test steps:**
1. Navigate to the **Matching** page.
2. Select a suggested profile.
3. Click the **Dislike** button.

**Expected results:**
- The system records the user's Dislike action.
- The selected profile is removed or skipped in accordance with matching rules.

**Actual results:**
- ...

**Status:**
...

---

### TC-MATCH-05 — Match creation when two users like each other

**Prerequisites:**
- User A and User B are eligible for matching.
- User A likes User B.
- User B likes User A.

**Test steps:**
1. User A likes User B.
2. User B likes User A.
3. Check the matching results for both users.

**Expected results:**
- The system identifies the mutual Like.
- A Match is created between User A and User B.
- Both users are notified of the Match.

**Actual results:**
- ...

**Status:**
...

---

### TC-MATCH-06 — No Match created when only one user likes the other

**Prerequisites:**
- User A and User B are eligible for matching.
- User A likes User B.
- User B does not like User A.

**Test steps:**
1. User A likes User B.
2. User B does not like User A.
3. Check the matching results.

**Expected results:**
- No Match is created between the two users.
- The system records User A's Like in accordance with matching rules. **Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-07 — Prevent display of previously processed profiles

**Prerequisites:**
- User is logged in.
- User has previously processed a suggested profile.

**Test Steps:**
1. Access the **Matching** page.
2. Process that same suggested profile.
3. Refresh or revisit the Matching page.

**Expected Result:**
- The previously processed profile is not displayed again as a new suggestion, in accordance with matching rules.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-08 — Matching when no suggestions are available

**Prerequisites:**
- User is logged in.
- No eligible profiles are available for matching.

**Test Steps:**
1. Access the **Matching** page.
2. Wait for the system to load suggestions.

**Expected Result:**
- The system displays an appropriate message indicating that no suggestions are available.
- The Matching page remains functional.

**Actual Result:**
- ...

**Status:**
...

---

### TC-MATCH-09 — Accessing Matching without authentication

**Prerequisites:**
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

### TC-MATCH-10 — Matching suggestions respect user preferences

**Prerequisites:**
- User is logged in. - The user has configured matching preferences in their profile.
- There are eligible profiles with varying characteristics.

**Test steps:**
1. Navigate to the **Matching** page.
2. View the suggested profiles.
3. Compare the suggestions against the user's configured matching preferences.

**Expected results:**
- The system suggests profiles based on the configured matching preferences and matching rules.
- Profiles that do not meet mandatory criteria are excluded.

**Actual results:**
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

## Use Case 6: AI-Assisted User Interaction and Red Flag Evaluation

### TC-AI-01 — Start an AI-assisted interaction game

**Precondition:**
- User is logged in.
- User has been matched with another user.
- The AI-assisted interaction game is available.

**Test Steps:**
1. Navigate to the **Game** or **AI Interaction** feature.
2. Select the matched user.
3. Start an interaction game.
4. Follow the instructions provided by the AI.

**Expected Result:**
- The system successfully starts the interaction game.
- The AI provides appropriate instructions or prompts.
- Both users can participate in the game.

**Actual Result:**
- ...

**Status:**
...

---

### TC-AI-02 — AI generates an interaction prompt

**Precondition:**
- User is logged in.
- User has started an AI-assisted interaction game.
- The AI service is available.

**Test Steps:**
1. Start an AI-assisted interaction game.
2. Wait for the AI to generate an interaction prompt.
3. View the generated prompt.

**Expected Result:**
- The AI generates an appropriate interaction prompt.
- The prompt is displayed correctly to the users.
- The game can continue based on the generated prompt.

**Actual Result:**
- ...

**Status:**
...

---

### TC-AI-03 — Users respond to an AI-generated game prompt

**Precondition:**
- User is logged in.
- Two matched users are participating in an AI-assisted interaction game.
- An AI-generated prompt is available.

**Test Steps:**
1. Read the AI-generated prompt.
2. Enter a response.
3. Submit the response.
4. Allow the other user to respond.

**Expected Result:**
- The system accepts the user's response.
- The response is displayed correctly in the game.
- The other user can view and respond to the interaction.

**Actual Result:**
- ...

**Status:**
...

---

### TC-AI-04 — AI generates a new prompt after an interaction

**Precondition:**
- Users are participating in an AI-assisted interaction game.
- The current interaction has been completed.

**Test Steps:**
1. Complete the current game prompt.
2. Submit the required responses.
3. Continue to the next interaction.

**Expected Result:**
- The AI generates or provides the next appropriate interaction prompt.
- The game continues without losing the previous interaction.

**Actual Result:**
- ...

**Status:**
...

---

### TC-AI-05 — AI identifies potential red flag behavior

**Precondition:**
- User is logged in.
- Users have interacted through the supported game or interaction feature.
- The AI red flag evaluation feature is available.

**Test Steps:**
1. Complete one or more interactions with another user.
2. Submit the interaction data for AI evaluation.
3. View the AI evaluation result.

**Expected Result:**
- The AI analyzes the available interaction information.
- The system identifies potential red flag indicators when applicable.
- The evaluation result is displayed clearly to the user.

**Actual Result:**
- ...

**Status:**
...

---

### TC-AI-06 — AI does not identify red flags when interaction is normal

**Precondition:**
- User is logged in.
- The interaction does not contain behavior defined as a red flag by the system.
- AI red flag evaluation is available.

**Test Steps:**
1. Complete a normal interaction with another user.
2. Request an AI red flag evaluation.
3. View the evaluation result.

**Expected Result:**
- The AI does not incorrectly identify normal interaction as a red flag.
- The system provides an appropriate evaluation result.

**Actual Result:**
- ...

**Status:**
...

---

### TC-AI-07 — AI provides an explanation for a potential red flag

**Precondition:**
- User is logged in.
- The AI has identified a potential red flag during an interaction.

**Test Steps:**
1. View the AI red flag evaluation.
2. Select or expand the identified red flag.
3. View the explanation provided by the AI.

**Expected Result:**
- The system displays the identified potential red flag.
- The AI provides an understandable explanation based on the available interaction information.
- The explanation does not present the AI's evaluation as a guaranteed judgment about the other user.

**Actual Result:**
- ...

**Status:**
...

---

### TC-AI-08 — AI handles insufficient interaction data

**Precondition:**
- User is logged in.
- There is insufficient interaction data for a meaningful red flag evaluation.

**Test Steps:**
1. Start or complete only a small amount of interaction.
2. Request an AI red flag evaluation.
3. View the evaluation result.

**Expected Result:**
- The system informs the user that there is insufficient information for a reliable evaluation.
- The AI does not make an unsupported red flag judgment.
- The user can continue interacting or provide more information.

**Actual Result:**
- ...

**Status:**
...

---

### TC-AI-09 — AI service unavailable during interaction

**Precondition:**
- User is logged in.
- User is participating in an AI-assisted interaction.
- The AI service becomes unavailable.

**Test Steps:**
1. Start an AI-assisted interaction.
2. Trigger an AI function while the AI service is unavailable.
3. Observe the system response.

**Expected Result:**
- The system handles the AI service failure gracefully.
- An appropriate error or unavailable-service message is displayed.
- The user's existing interaction data is not lost.

**Actual Result:**
- ...

**Status:**
...

---

### TC-AI-10 — User continues interaction after receiving a red flag warning

**Precondition:**
- User is logged in.
- The AI has identified a potential red flag during an interaction.
- The system provides the user with a red flag warning.

**Test Steps:**
1. View the AI red flag warning.
2. Review the explanation provided by the AI.
3. Choose to continue the interaction.
4. Continue the interaction with the other user.

**Expected Result:**
- The system allows the user to make their own decision about continuing the interaction.
- The red flag warning remains available for reference.
- The AI does not automatically block or make decisions on behalf of the user unless this behavior is explicitly defined by the system rules.

**Actual Result:**
- ...

**Status:**
...

---