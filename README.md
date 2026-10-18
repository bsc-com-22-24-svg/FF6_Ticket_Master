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
```

## Demo

The app runs fully on mock data — no backend is required. Events, tickets and
bookings are stored in the browser's `localStorage`, so anything you do (buy a
ticket, scan it, create an event) sticks around until you reset it.

Use the **one-tap demo accounts** on the login screen, or sign in manually:

| Role       | Email                  | Password      |
| ---------- | ---------------------- | ------------- |
| Customer   | customer@example.com   | password123   |
| Organizer  | organizer@example.com  | password123   |
| Staff      | staff@example.com      | password123   |

Suggested walkthrough:

1. **Browse** — open *Discover* (`/events`), filter by category/city/price, open an event.
2. **Buy** — pick a ticket type, hit *Get tickets*, sign in as **Customer**, pay (any 16-digit card that does **not** end in `00`, or a 9–12 digit mobile number).
3. **View** — your ticket with its QR code is under *My Tickets*.
4. **Manage** — sign in as **Organizer**, open the dashboard, and *Create event*. Publish it and it appears on the public site; ticket sales update the remaining-seat counts.
5. **Scan** — sign in as **Staff** (`/scan`), choose the event gate, and paste a ticket code. The organizer dashboard's *Checked in* count increases.

To start over, use **Reset demo data** on the organizer dashboard.

## Team

| Member | Reg Number | Area |
|---|---|---|
| Mwandira Blessings Trevor | BED/COM/13/24 | Leader / Setup |
| Jimu Ishmael Amos | BSC/19/23 | Reasercher |
| Tukula Paul | BED/COM/50/22 | Secretary|
| Lobeni Joshua Sibusiso | BSC/INF/06/24 | Organizer FR |
| Chiumia Misheck | BSC/COM/22/24 | NFR / Project Cordinator |
