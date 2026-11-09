# Figure A-2: Sequence diagram, log in

Requirements: FR-07 (log in), NFR-07 (protected pages need a signed-in user). Picture for the SRS: `images/login.png`.

```mermaid
%%{init: {'theme':'neutral'}}%%
sequenceDiagram
    actor User
    participant Guard as Route guard
    participant Login as Login page
    participant Auth as Auth store
    participant Store as Local storage

    User->>Guard: Open protected page
    Guard->>Login: Redirect to login (no session)
    User->>Login: Submit login form
    Login->>Auth: loginRequest(email, password)
    Auth->>Auth: Check account
    alt Wrong email or password, or account disabled
        Auth-->>Login: Error
        Login-->>User: Show error message
    else Account accepted
        Auth->>Store: Save session
        Auth-->>Login: Return user
        Login->>Guard: Go to the page
        Guard->>Guard: Check role
        Guard-->>User: Show the page
    end
```

Notes
- In the current build the auth store and the session are in the browser. With the backend, "Auth store" becomes `POST /auth/login` on the Backend API and "Local storage" holds the token.
- A signed-in user with the wrong role is sent away from the page by the route guard (check this against the `requireAuth` code).
