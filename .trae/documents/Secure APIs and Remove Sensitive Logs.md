I have identified several API endpoints that are logging sensitive information to the console and one endpoint that returns the full user object without explicit filtering.

### 1. Sensitive Console Logs
The following files contain `console.log` statements that output sensitive data like user sessions (which may contain tokens), request bodies (which may contain passwords or secrets), or PII (emails).

- **`app/api/student/notebooks/route.ts`**: Logs the full `session` object.
- **`app/api/student/notebooks/[id]/route.ts`**: Logs the full `session` object.
- **`app/api/auth/resend-verification/route.ts`**: Logs `session`, `userEmail`, `userId`, and potentially stack traces.
- **`app/api/token/route.ts`**: Logs the full `request body` (which might contain secrets).
- **`app/api/classes/[classId]/route.ts`**: Logs the full `requestBody` (feedback/status updates).

### 2. API Response Data Leakage
- **`app/api/users/me/route.ts`**: Currently returns the **full user object** directly from the service. While the repository sanitizes dates, it does not explicitly filter out fields like `password`, `salt`, or internal flags before sending the response. This is inconsistent with `app/api/profile/route.ts` which explicitly removes the password field.

### Proposed Plan

I will perform the following fixes:

1.  **Remove Sensitive Logs**:
    -   Delete the potentially dangerous `console.log` lines in the 5 identified files.
    -   Keep `console.error` for actual errors but ensure they don't leak PII.

2.  **Secure `users/me` Endpoint**:
    -   Update `app/api/users/me/route.ts` to filter the user object before returning it, ensuring no sensitive fields (like password hash or internal metadata) are leaked. I will use the same pattern found in `app/api/profile/route.ts`.

3.  **Verification**:
    -   I will verify the changes by checking the files to ensure the logs are gone and the response logic is updated.

Please confirm if you would like me to proceed with these changes.