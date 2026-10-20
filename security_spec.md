# Security Specification: mini eCitizen Public Service Request System

## 1. Data Invariants
- **Identity Invariant**: A citizen can only create a service request with `userId == request.auth.uid`. A citizen cannot impersonate another citizen or claim another user's ID.
- **Role Invariant**: Citizens cannot elevate their own role to "admin" during registration or update. Only existing administrators or the pre-configured admin email (`francisnjogu157@gmail.com`) can possess admin authority.
- **State Transition Invariant**: Citizens cannot modify the `status` or `adminNote` of a request. Only admins can transition `status` between "Pending", "In Progress", and "Resolved", or write `adminNote`.
- **Edit Window Invariant**: Citizens can only edit their request while `existing().status == 'Pending'`. Once under review or resolved, citizens cannot tamper with the report.
- **Relational Ownership**: A citizen can only read, update, or cancel their own requests in citizen view, while administrators can read and update status on all requests.
- **Storage Isolation**: Storage uploads for community images can only be written to `/requestImages/{userId}/{fileName}` where `{userId} == request.auth.uid`.

## 2. The "Dirty Dozen" Malicious / Invalid Payloads
1. **Payload 1 (Privilege Escalation on User Profile)**: Attempting to register as a citizen with `"role": "admin"`.
2. **Payload 2 (Ghost Field Attack)**: Sending `{"isSuperAdmin": true, "vip": true}` on a user document update.
3. **Payload 3 (Citizen Status Tampering)**: Citizen submitting an update that directly changes `"status": "Resolved"` on their own pending report.
4. **Payload 4 (Identity Spoofing)**: Submitting a request with `userId: "victim_user_123"` instead of the authenticated user's UID.
5. **Payload 5 (Unauthenticated Write)**: Submitting a new service request without an auth token.
6. **Payload 6 (Oversized Text / Wallet Denial Attack)**: Submitting a description with a 500,000 character payload.
7. **Payload 7 (Invalid Category Injection)**: Submitting a category `"HackedCategory"` not in the allowed enum.
8. **Payload 8 (Post-Resolution Edit Attack)**: Citizen attempting to modify request details after an admin marked it `"Resolved"`.
9. **Payload 9 (Citizen Admin Note Injection)**: Citizen writing `"adminNote": "Approved by city council"`.
10. **Payload 10 (Impersonated Email Admin Claim)**: An unverified or spoofed user attempting to bypass admin rules.
11. **Payload 11 (Cross-Citizen Request Deletion)**: Citizen B attempting to delete a pending request owned by Citizen A.
12. **Payload 12 (Storage Path Traversal / Spoofing)**: Attempting to upload to `/requestImages/otherUserUid/file.jpg`.

## 3. Security Rule Architecture
- Hardened global primitives: `isValidId()`, `isSignedIn()`, `isAdmin()`, `isOwner(userId)`.
- Explicit schema validators: `isValidUser(data)`, `isValidRequest(data)`.
- Action-based update gating with `diff(existing()).affectedKeys().hasOnly(...)`.
- Default-deny catch-all rule at the top level.
