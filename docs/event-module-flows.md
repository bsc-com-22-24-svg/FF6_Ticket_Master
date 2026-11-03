
# Events Module work flows......

This is a simple overview of how the Events part of the system is work and built.

## What it does

- Anyone can look at events without logging in.
- Anyone can search, filter and sort events.
- Anyone can open an event to see its details and how many tickets are left.
- Organizers can log in to create and edit their own events.
- The number of tickets left updates live on the screen.

## The main pieces

**Events Controller**
The front door. It receives every request from the website or app and sends back the answer.

**Auth Guard**
The security check. It only applies to organizers. It makes sure the person is logged in, is an organizer, and (when editing) owns the event. Visitors never go through it.

**Event Service**
The brain. It decides what to do with each request and talks to the other pieces.

**Search and Filter**
Finds events. You can search by words, filter by category, date, location, price and availability, and sort the results.

**Validator**
Checks what an organizer typed before saving. For example, the date must be in the future and the price can't be negative.

**Ticket-Types Service**
Looks after the ticket types for each event (like "Regular" or "VIP"), with their price and quantity.

**Availability Service**
Works out how many tickets are left and sends updates to anyone viewing the event.

**Image Storage**
Keeps event pictures. The database only saves the link to the picture.

**Database**
Stores events, ticket types, users and orders.

## What visitors can do

Visitors only read. They never need a login.

| What they want | Request |
|----------------|---------|
| See a list of events | `GET /events` |
| Search, filter, sort | `GET /events?q=music&category=concert&sort=date` |
| Open one event | `GET /events/{id}` |
| See tickets left | `GET /events/{id}/availability` |
| Watch tickets left live | `GET /events/{id}/availability/stream` |

Only published events show up for visitors. Drafts stay hidden.

## What organizers can do

Organizers must be logged in.

| What they want | Request |
|----------------|---------|
| Create an event (saved as draft) | `POST /events` |
| Edit an event | `PUT /events/{id}` |
| Publish a draft | `POST /events/{id}/publish` |

## How creating an event works

1. The organizer opens the form and the system checks they are logged in and allowed to create events.
2. They fill in the details, add ticket types and save it as a draft.
3. The system checks the details. If something is wrong, it sends back the errors so they can fix them.
4. The picture is uploaded. If that fails, the form keeps what they typed so they can try again.
5. The event and its ticket types are saved together. If saving fails, nothing is kept and the organizer sees an error.
6. When the organizer clicks Publish, the system checks the event is ready: the date is in the future, there is at least one ticket type, and the price and quantity are set.
7. If it is ready, the event goes live and shows up in browse and search. If not, it stays a draft and the system says what is missing.

## How live ticket counts work

Tickets left = total tickets minus tickets sold.

When the number changes (someone buys a ticket, or the organizer edits the event), the system sends the new number to everyone looking at that event. We use Server-Sent Events (SSE) for this. It is a simple way for the server to push updates to the browser.

If the live connection drops, the page can still ask for the number normally.

## Data we store

- **Users:** who can log in, and their role.
- **Events:** name, description, category, start and end time, location, image link, status (draft, published or cancelled), organizer.
- **Ticket types:** name, price, total quantity, and which event they belong to.
- **Orders:** tickets that were bought (handled by the ordering part of the system).

## Errors we return

| Code | Meaning |
|------|---------|
| 401 | Not logged in |
| 403 | Logged in, but not allowed |
| 404 | Event not found |
| 409 | Someone else changed the event first |
| 422 | Something typed was invalid |
| 500 | Something went wrong on our side |

## Things to keep in mind

- Speed: add database indexes on date, category and location, and keep popular lists in a short cache.
- Security: always check the login and the owner, and never trust what the user types.
- Safe edits: if two people edit the same event, the second save is rejected with a 409 so nothing gets overwritten.

## Questions still open

1. Can an organizer change the date, price or quantity after tickets have been sold?
2. How long should cancelled events stay visible?
3. Is location just text, a city list, or a map point with distance search?
4. Do tickets get held for a few minutes while someone pays?
5. Can one event have several dates?

## Diagrams

### Component Diagram (how the pieces connect)

**Who uses the system**
- Visitors: no login needed. Their requests go straight to the Events Controller.
- Organizers: must be logged in. Their requests go to the Auth Guard first, and then on to the Events Controller.

**What happens inside**
1. The Events Controller receives the request and passes it to the Event Service.
2. The Event Service does the work by talking to these pieces:
   - Search and Filter: finds events for the list and search pages.
   - Validator: checks what the organizer typed.
   - Ticket-Types Service: looks after ticket types, prices and quantities.
   - Availability Service: works out how many tickets are left.
   - Image Storage: keeps the event pictures.
3. Search and Filter and the Ticket-Types Service read from and save to the Database.
4. The Availability Service asks the Ticket-Types Service how many tickets are left. It then sends that number to everyone watching the event page, as a live update.

### Activity Diagram (creating and publishing an event)

1. The organizer opens the "Create event" form.
2. The system checks that they are logged in.
   - If not: it shows error 401 and sends them to the login page. The process stops.
3. The system checks that they are an organizer.
   - If not: it shows error 403 (not allowed). The process stops.
4. The organizer fills in the details (name, description, date, time, location, category, price and picture) and adds the ticket types and quantities.
5. The organizer clicks "Save draft".
6. The system checks the details.
   - If something is wrong: it shows the errors (422). The organizer fixes them and saves again.
7. The system uploads the picture.
   - If the upload fails: it shows an error and keeps what the organizer typed. The organizer uploads the picture again.
8. The system saves the event and its ticket types together.
   - If saving fails: it undoes everything and shows an error (500). The process stops.
9. The event is now saved as a **draft**. The organizer can review it and make changes.
10. The organizer clicks "Publish".
11. The system checks the event is ready: the date is in the future, there is at least one ticket type, and the price and quantity are set.
    - If not ready: the event stays a draft and the system lists what is missing. The organizer fixes it and tries again.
12. The event becomes **published**. It now shows up in browse and search, and the live ticket count starts.
13. The organizer sees a confirmation and the public link to the event.
