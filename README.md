# COM311 – Group FF6

Event management app built with Vite + React + TypeScript, using Tanstack Query and Tanstack Router.

## Repo

https://github.com/bsc-com-22-24-svg/FF6_Ticket_Master

## Running the app

The app uses the NestJS backend and PostgreSQL by default. See
[RUNNING_THE_APP.md](RUNNING_THE_APP.md) for the full local setup, including
Docker commands, the database schema, and PayChangu configuration.

Install and run the frontend:

```bash
git clone https://github.com/bsc-com-22-24-svg/FF6_Ticket_Master.git
cd FF6_Ticket_Master
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # type-check + production build
npm run lint      # oxlint
npm test          # vitest unit tests
```

### Backend-backed walkthrough

The app uses the NestJS backend through the `/be` proxy. Follow
`RUNNING_THE_APP.md` to start PostgreSQL and `alicekayla/ticket-backend:1.5`
before using these flows.

Suggested walkthrough:

1. **Browse** — open *Discover* (`/events`), filter by category/city/price, open an event.
2. **Buy** — pick a ticket type, hit *Get tickets*, sign in as **Customer**, and complete the PayChangu test payment.
3. **View** — your ticket with its QR code is under *My Tickets*.
4. **Verify** — register as **Organizer**, submit KYC, then sign in as **Admin** and approve it from *Organizer KYC*. Backend 1.5 blocks organizer event routes until approval.
5. **Manage** — sign in as the approved **Organizer**, open the dashboard, and *Create event*. Publish it and it appears on the public site.
6. **Scan** — create a staff account from **Staff Roster**, assign it to the event, then sign in as **Staff** (`/scan`). The scanner only shows assigned events.

## Team

| Member | Reg Number | Area |
|---|---|---|
| Mwandira Blessings Trevor | BED/COM/13/24 | Leader / Setup |
| Jimu Ishmael Amos | BSC/19/23 | Reasercher |
| Tukula Paul | BED/COM/50/22 | Secretary|
| Lobeni Joshua Sibusiso | BSC/INF/06/24 | Organizer FR |
| Chiumia Misheck | BSC/COM/22/24 | NFR / Project Cordinator |
