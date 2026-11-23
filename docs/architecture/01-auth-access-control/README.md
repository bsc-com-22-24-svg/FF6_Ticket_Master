# Authentication and access control

Owner: Ishmael (bsc-19-23)
Reviewer: <Misheck> 
Issue: #<99>
Requirements covered: FR-06, FR-07, FR-08, NFR-07

## Purpose
Lets people register and log in, and makes sure every protected page is opened only by a signed-in user with the right role. A visitor who is not signed in cannot buy tickets.

## Actors
Customer, Organizer, Staff, Admin. A visitor who is not signed in can only register and log in.

## Responsibilities
- Register a new Customer or Organizer account with name, email and password (FR-06).
- Log in with email and password and keep the session in the browser (FR-07).
- Block visitors who are not signed in from buying tickets: the checkout pages need the Customer role (FR-08).
- Protect every page that is not public: each protected route checks that the user is signed in and has the correct role, otherwise the user is redirected (NFR-07).
- Let an Organizer create Staff accounts, and let an Admin create, disable and delete accounts.
- Log out and show each role only its own menu links.

## Inputs and outputs
| Receives from | What | Sends to | What |
| --- | --- | --- | --- |
| Visitor | name, email, password, role (Customer or Organizer) | Auth store | new account |
| Login page | email, password | Auth store | user record, or an error message |
| Auth store | session: id, name, email, role | Local storage | saved session |
| Any user | request to open a page | Route guard | the page, a redirect to login, or a redirect away |
| Organizer | staff name, email, password | Auth store | new Staff account |
| Admin | create, disable or delete an account | Auth store | updated accounts |

## Depends on
- Browser storage: holds the accounts and the session in the current build.
- Router guards: `requireAuth(role)` on each protected route.
- Header menu: shows only the links the role may use.

## Data it uses
- User: id, name, email, role (customer, organizer, staff, admin), status (active or disabled). The demo store also keeps the password.
- Session: id, name, email, role.

## Rules and assumptions
- Only Customers and Organizers can register themselves. Staff accounts are created by an Organizer and Admin accounts by an Admin.
- A wrong email or password, or a disabled account, is rejected with an error message.
- Customer pages and checkout need the Customer role, organizer pages the Organizer role, the scanner the Staff role and the admin pages the Admin role.
- Assumption to confirm: a visitor who is not signed in is sent to the login page, and a signed-in user with the wrong role is sent away from the page.
- Not decided yet: with the backend, login returns a token that expires (the backend setting is 15 minutes). The team must decide what happens when it expires.
- The backend must store passwords hashed, not as plain text.

## Diagrams
| Figure | Type | File | Status |
| --- | --- | --- | --- |
| A-1 | Use case | use-case.drawio (picture: images/use-case.png) | Draft |
| A-2 | Sequence | login.md (picture: images/login.png) | Draft |

## Review checklist (reviewer ticks)
- [ ] Names match the SRS and the other components
- [ ] Every requirement listed above appears in a diagram
- [ ] Every actor and component in the diagram is described in this page
- [ ] The diagram can be read without extra explanation
