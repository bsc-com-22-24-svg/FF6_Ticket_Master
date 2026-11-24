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

## Local development: PayChangu removes the port
PayChangu strips the port from `callback_url` and `return_url`. A redirect URL of
`http://localhost:5173/checkout/return` becomes `http://localhost/checkout/return`,
which does not reach the Vite dev server.

Keep the app on port 5173 and run the return bridge in a second terminal:

```bash
sudo env "PATH=$PATH" npm run paychangu:bridge
```

The bridge listens on port 80 and redirects to `http://localhost:5173`, so PayChangu's
portless redirect still lands on the checkout return page. Leave it running while testing.

If you cannot bind port 80, expose the dev server through a tunnel (for example ngrok)
and open the app through the tunnel URL instead. PayChangu will then redirect to the
tunnel's portless HTTPS URL. No PayChangu dashboard changes are needed for either option.

## Limits of this project (say so in the report)
- Orders, events and tickets live in the backend database; the browser only keeps the token and a short-lived payment reference.
- Backend 1.5 also exposes `POST /payments/paychangu/webhook`, but refunds are not implemented.
- Ticket purchases still start through `/api/paychangu/*` in `server/paychangu.ts`, which runs inside the Vite dev/preview server. The backend checkout endpoints are available for orders created through `/orders`.
