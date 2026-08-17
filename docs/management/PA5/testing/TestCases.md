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

---

## Use Case 2: Login

### TC-LOGIN-01 — Login with valid credentials

**Precondition:**
- User has a registered account.
- User is on the Login page.

**Test Steps:**
1. Enter a registered email address.
2. Enter the correct password.
3. Click the **Login** button.

**Expected Result:**
- The system validates the credentials successfully.
- The user is logged in successfully.
- The user is redirected to the appropriate page.

**Actual Result:**
- ...

**Status:**
...

---

### TC-LOGIN-02 — Login with incorrect password

**Precondition:**
- User has a registered account.
- User is on the Login page.

**Test Steps:**
1. Enter a registered email address.
2. Enter an incorrect password.
3. Click the **Login** button.

**Expected Result:**
- The system rejects the login attempt.
- An error message is displayed indicating that the credentials are incorrect.
- The user is not logged in.

**Actual Result:**
- ...

**Status:**
...

---

### TC-LOGIN-03 — Login with unregistered email

**Precondition:**
- User is on the Login page.
- The entered email address is not registered in the system.

**Test Steps:**
1. Enter an unregistered email address.
2. Enter a valid password.
3. Click the **Login** button.

**Expected Result:**
- The system rejects the login attempt.
- An error message is displayed.
- The user is not logged in.

**Actual Result:**
- ...

**Status:**
...

---

### TC-LOGIN-04 — Login with empty email

**Precondition:**
- User is on the Login page.

**Test Steps:**
1. Leave the email field empty.
2. Enter a valid password.
3. Click the **Login** button.

**Expected Result:**
- The system does not submit the login request.
- A validation message indicates that the email is required.
- The user is not logged in.

**Actual Result:**
- ...

**Status:**
...

---

### TC-LOGIN-05 — Login with empty password

**Precondition:**
- User is on the Login page.

**Test Steps:**
1. Enter a registered email address.
2. Leave the password field empty.
3. Click the **Login** button.

**Expected Result:**
- The system does not submit the login request.
- A validation message indicates that the password is required.
- The user is not logged in.

**Actual Result:**
- ...

**Status:**
...

---

### TC-LOGIN-06 — Login with both email and password empty

**Precondition:**
- User is on the Login page.

**Test Steps:**
1. Leave the email field empty.
2. Leave the password field empty.
3. Click the **Login** button.

**Expected Result:**
- The system does not submit the login request.
- Validation messages are displayed for the required fields.
- The user is not logged in.

**Actual Result:**
- ...

**Status:**
...

---

### TC-LOGIN-07 — Login with invalid email format

**Precondition:**
- User is on the Login page.

**Test Steps:**
1. Enter an invalid email address, such as `user@`.
2. Enter a valid password.
3. Click the **Login** button.

**Expected Result:**
- The system detects the invalid email format.
- A validation message is displayed.
- The login attempt is rejected.

**Actual Result:**
- ...

**Status:**
...

---

### TC-LOGIN-08 — Login with password containing incorrect format

**Precondition:**
- User is on the Login page.
- The system has password validation requirements.

**Test Steps:**
1. Enter a registered email address.
2. Enter a password that does not meet the system requirements.
3. Click the **Login** button.

**Expected Result:**
- The system validates the password according to the defined requirements.
- The login attempt is rejected if the password is invalid.
- An appropriate error or validation message is displayed.

**Actual Result:**
- ...

**Status:**
...

---

### TC-LOGIN-09 — Login with leading or trailing spaces in email

**Precondition:**
- User has a registered account.
- User is on the Login page.

**Test Steps:**
1. Enter the registered email address with leading or trailing spaces.
2. Enter the correct password.
3. Click the **Login** button.

**Expected Result:**
- The system handles the leading or trailing spaces according to its input validation rules.
- If the system trims the spaces, the user is logged in successfully.
- Otherwise, an appropriate validation or authentication error is displayed.

**Actual Result:**
- ...

**Status:**
...

---

### TC-LOGIN-10 — Login with multiple failed attempts

**Precondition:**
- User is on the Login page.
- The account exists in the system.

**Test Steps:**
1. Enter the registered email address.
2. Enter an incorrect password.
3. Click the **Login** button.
4. Repeat the login attempt with an incorrect password several times.

**Expected Result:**
- Each incorrect login attempt is rejected.
- The system applies the appropriate security mechanism after repeated failed attempts, if such a mechanism is implemented.
- The user is not logged in with incorrect credentials.

**Actual Result:**
- ...

**Status:**
...

---