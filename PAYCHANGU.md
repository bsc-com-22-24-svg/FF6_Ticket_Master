# Paying with PayChangu

Tickets are now paid through PayChangu (Airtel Money, TNM Mpamba or bank card, chosen on PayChangu's own page).
No ticket is issued until PayChangu confirms the money arrived.

## Set up (once)
1. Create a PayChangu account and open the dashboard, then API / Settings.
2. Copy your TEST secret key (it starts with `sec-test-`).
3. In the project root: `cp .env.example .env`, then put the key in `.env`.
4. `npm run dev` (restart it after changing `.env`).

`.env` is private and is in `.gitignore`. Never commit it, never paste the key in chat or code.

## How a payment flows
1. Customer clicks "Pay ... with PayChangu" -> `POST /api/paychangu/initiate` (server/paychangu.ts, secret key used here only).
2. Browser is sent to PayChangu's checkout page and pays there.
3. PayChangu sends the customer back to `/checkout/return?tx_ref=...`.
4. The page calls `GET /api/paychangu/verify/:tx_ref`; the server asks PayChangu if it really succeeded.
5. Only if status is success, currency MWK and amount >= the order total: tickets and the booking are created (once).

## Testing
Use test mode (`sec-test-` key). PayChangu's docs list test numbers, e.g. Airtel Money `990000000` and card `4242 4242 4242 4242`.

## Limits of this project (say so in the report)
- Orders, events and tickets still live in the browser (localStorage), so the server cannot check the price itself.
  A real system keeps events and orders in a database and computes the amount on the server.
- Verification is done when the customer returns. A real system also handles PayChangu webhooks
  (customer closes the tab after paying) and refunds.
- `server/paychangu.ts` runs inside the Vite dev/preview server. A deployed site needs the same two routes on a real backend.
