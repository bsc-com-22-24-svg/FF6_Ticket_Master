# Backend integration gaps and requested work

This note records frontend features that are blocked, unclear, or need a backend
contract/runtime fix. It is based on the updated Swagger file shared on
2026-11-10, the frontend integration, and errors reported while testing.

## Important distinction: login and connectivity errors

- The organizer Attendees screen showed `401 Unauthorized`. This is an
  authentication/authorization failure, not proof that attendee records are
  missing. Sign out and sign in again to get a fresh token. If the new token is
  still rejected, check that the organizer role is allowed on the endpoint and
  that the backend validates the token consistently across requests.
- The running Docker backend was observed to differ from the supplied Swagger.
  Keep the deployed backend, source revision, and Swagger in sync. A frontend
  built against one contract cannot reliably use a different running image.
- PayChangu checkout previously returned `503 Service Unavailable`. The
  backend must have its PayChangu credentials and callback/webhook/return URLs
  configured. These secrets belong only in the backend environment, never in
  the frontend.

## Required backend work

### 1. Make event cancellation reversible

The Swagger documents `PATCH /events/{id}` with an event status of `DRAFT`,
`PUBLISHED`, or `CANCELLED`; it does not document an event `DELETE` or a
separate restore endpoint. The organizer frontend uses this update operation
for Remove/Restore, and cancelled events remain in the organizer's
all-statuses event list.

The running backend previously rejected updates to a cancelled event and
therefore could not restore one. Please:

- Allow an authorized event owner/admin to restore a cancelled event by
  changing its status back to its prior valid state.
- Preserve the cancelled event and its ticket/order history; do not hard-delete
  it.
- Define and validate allowed transitions, including cancellation from both
  draft and published states, and restoration from cancelled to the prior
  state.
- Ensure restoring to `PUBLISHED` only succeeds when the event is still valid
  for publication (for example, it has not ended); otherwise return a clear
  validation error and explain the allowed next action.
- Preserve or correctly update `publishedAt` and `cancelledAt` so the backend
  can reliably determine the previous state. Return those fields from
  `GET /events/mine`.
- Document the request/response and 400/401/403/404/409 responses in Swagger.

The frontend does not use a client-only undo timer: it sends the state change
to the backend, and the cancelled event stays available in the event list for
later restoration.

### 2. Document and verify reversible account status

Swagger includes:

- `PATCH /users/{userId}/status` (`isActive` should be a required boolean).
- `DELETE /users/{userId}` (`disableAccount`).

The frontend now uses the status endpoint for both Deactivate and Activate and
does not call `DELETE`. Please make the Swagger request schema explicit and
document authorization, self-deactivation rules, response shape, and errors.
Ensure `GET /users` returns `isActive` for each account so the UI can display
the correct state and provide the reverse action.

### 3. Specify the organizer attendee/ticket response

Swagger exposes `GET /tickets/events/{eventId}`, but describes the response
only as a generic object. The organizer attendee table needs a documented,
consistent response containing at least:

- ticket number/ID, event ID, ticket type ID and ticket status;
- issue/purchase timestamp and check-in timestamp;
- customer ID plus customer name and email (or a consistently shaped `attendee`
  object containing name and email).

Document whether the endpoint returns an array or a paginated envelope,
whether cancelled/refunded tickets are included, and which organizer/staff
roles may access it. Keep customer personal information restricted to
authorized event managers and staff. The frontend must not infer missing
customer details or issue a separate request per ticket.

### 4. Add organizer staff management, if the feature is in scope

The current Swagger has general admin user creation and role changes, but no
organizer-scoped staff roster or event assignment operations. The Staff Roster
cannot truthfully list or assign staff without backend support. Add endpoints
to:

- list staff assigned to the authenticated organizer/events;
- create or invite staff with the required check-in role;
- assign and unassign staff to specific events;
- revoke access and return assignment/status data.

Enforce organizer ownership and document all request/response schemas and
authorization rules. Do not treat global admin user creation as event-staff
assignment.

### 5. Add organizer KYC endpoints, if KYC is in scope

No KYC submission, document upload, review, or verification-status route is
present in the supplied Swagger. To enable the organizer KYC page, provide
secure endpoints for submission/status and an authorized admin review flow.
Specify accepted document types/sizes, private storage behavior, validation,
and status transitions. Do not store KYC documents in frontend local storage.

### 6. Add audit-log access, if the admin audit view is required

There is no audit-log endpoint in the supplied Swagger. Provide an
admin-authorized, paginated endpoint with actor, action, target, timestamp,
and relevant outcome metadata. Do not include passwords, tokens, payment
secrets, or unnecessary customer personal data.

### 7. Make the contact form deliver messages, if required

The current contact form only displays a success/thank-you message and does
not submit to a backend. If it is expected to reach the team, add a validated
contact/message endpoint with spam controls, rate limits, and a clear success
or error response; otherwise the UI should say that no message was sent.

## Integration checklist

- Publish Swagger from the same commit/image that is deployed.
- Test protected endpoints using a newly issued token for each required role.
- Return explicit, stable response schemas rather than generic `object`
  responses.
- Use clear 401 (missing/expired/invalid token) versus 403 (valid token but
  insufficient role/ownership) responses.
- Configure PayChangu only on the backend and verify checkout, webhook, and
  callback configuration in the deployed environment.
- After backend changes, test event cancel/restore and account
  deactivate/activate against the running service, including persistence after
  page reload and a fresh login.
