# COM311 – Group FF6

Event management app built with Vite + React + TypeScript, using Tanstack Query and Tanstack Router.

## Repo

https://github.com/bsc-com-22-24-svg/FF6_Ticket_Master

## Getting started

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

## Backend

The frontend uses the backend Docker API for authentication, events, orders,
payments, tickets, validation, and supported administration actions. It does
not seed demo accounts, events, bookings, or tickets.

1. Start the backend Docker service.
2. Copy `.env.example` to `.env` and set `BACKEND_URL` to the backend address
   (default: `http://localhost:3000`).
3. Run `npm run dev`. The Vite server forwards `/be/*` requests to that backend.

PayChangu credentials and callback/return URL configuration belong on the
backend; they must not be added to this frontend's environment.
Some dashboard features remain unavailable until the backend exposes their API.

## Team

| Member | Reg Number | Area |
|---|---|---|
| Mwandira Blessings Trevor | BED/COM/13/24 | Leader / Setup |
| Jimu Ishmael Amos | BSC/19/23 | Reasercher |
| Tukula Paul | BED/COM/50/22 | Secretary|
| Lobeni Joshua Sibusiso | BSC/INF/06/24 | Organizer FR |
| Chiumia Misheck | BSC/COM/22/24 | NFR / Project Cordinator |
