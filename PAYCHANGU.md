# PayChangu payments

The frontend does not call PayChangu directly and does not store a PayChangu
secret. It asks the backend to create an order and start checkout; the backend
owns PayChangu credentials, payment verification, and the final order state.

## Backend configuration

Configure the PayChangu secret and callback/webhook URLs in the backend
environment, following the backend deployment documentation. Do not put
PayChangu credentials in this frontend repository or in a `VITE_` variable.

Set `BACKEND_URL` in the frontend `.env` to the backend base URL (default:
`http://localhost:3000`). The Vite development server proxies `/be` requests
to that backend. Restart Vite after changing `.env`.

## Payment flow

1. The frontend submits the selected event and ticket quantities to
   `POST /orders`.
2. It starts hosted checkout through
   `POST /payments/orders/{orderNumber}/checkout`.
3. The customer completes payment on PayChangu and returns to the frontend.
4. The frontend asks the backend to verify the transaction with
   `GET /payments/{txRef}/verify`.
5. Once the backend reports successful payment, the frontend claims tickets
   using `POST /tickets/purchase` with the verified `txRef`. Tickets and
   payment status remain backend-owned.

The frontend requires the backend to return the order number, checkout URL,
transaction reference, and verification status expected by these API calls.
Missing or unsuccessful payment details are reported as errors; the frontend
does not issue tickets as a fallback.

## Development and troubleshooting

- Start the backend and configure its PayChangu test credentials there before
  testing a payment.
- Ensure `BACKEND_URL` points to the reachable backend and that the backend
  has PayChangu callback and webhook routes configured.
- The frontend stores only a pending transaction reference locally to match a
  browser return to the checkout attempt. It does not treat local storage as
  payment confirmation or as a source of order/ticket data.
- If checkout or verification fails, inspect the backend logs and API response.
  Do not add a direct browser-to-PayChangu request or expose backend secrets
  in the frontend.
