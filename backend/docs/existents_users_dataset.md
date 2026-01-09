Anonymous Users (Users 1 & 2):

No password required. These users authenticate solely with their device_id.
hashed_password field is empty in the database.
Registered User (User 3):

Plain-text password: "password123"
Hashed password (stored in database): $2b$12$roD8ABF3vemTBVWz7g4XvuK8F4dmlmYXfoyw1jMVT2i3hBB/LR7AC
This is a bcrypt hash of the plain-text password.
For frontend testing:

Anonymous users: Just send {"device_id": "test_device_anon"} or {"device_id": "test_device_anon2"}
Registered user: Send {"device_id": "test_device_1", "email": "test@example.com", "password": "password123"}

