# Running the app

This guide runs the full stack locally:

- Frontend: Vite + React on `http://localhost:5173`
- Backend: NestJS in Docker on `http://localhost:3000`
- Database: PostgreSQL 16 in Docker
- API docs: `http://localhost:3000/api`

The backend image contains the application only. PostgreSQL, the schema, and the data are separate.

## Requirements

- Node.js and npm
- Docker Engine or Docker Desktop
- The repository checked out locally

Run all commands from the repository root unless stated otherwise.

## 1. Start PostgreSQL

Create the Docker network and a database volume:

```bash
docker network create ticket-network 2>/dev/null || true
docker volume create ticket-db-data
```

Start PostgreSQL:

```bash
docker run -d --name ticket-db --network ticket-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ticket_master \
  -p 5433:5432 \
  -v ticket-db-data:/var/lib/postgresql/data \
  postgres:16
```

Wait until it is ready:

```bash
docker exec ticket-db pg_isready -U postgres
```

If the `ticket-db` container already exists, start it instead:

```bash
docker start ticket-db
```

## 2. Load the database schema

Import the schema once into a new database:

```bash
docker exec -i ticket-db psql -v ON_ERROR_STOP=1 -U postgres -d ticket_master \
  < event_ticket_booking_schema.sql
```

Do not import it again into a database that already has the schema. The import will fail or create duplicate objects.

## 3. Create the backend environment file

Generate a JWT secret:

```bash
openssl rand -base64 48
```

Create a local env file outside the repository, or use another file that is not committed:

```bash
cat > /tmp/ticket-backend.env <<'EOF'
NODE_ENV=production
PORT=3000
DB_HOST=ticket-db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ticket_master
JWT_SECRET=PASTE_THE_GENERATED_SECRET_HERE
JWT_EXPIRES_IN=15m
PAYCHANGU_SECRET_KEY=PASTE_YOUR_PAYCHANGU_TEST_KEY_HERE
FRONTEND_ORIGIN=http://localhost:5173
EOF
```

`JWT_SECRET` must be at least 32 characters. Use the same PayChangu test key in the frontend `.env` and the backend env file.

### Backend environment variables

| Variable | Purpose | Local value |
| --- | --- | --- |
| `NODE_ENV` | Backend mode | `production` |
| `PORT` | Port inside the container | `3000` |
| `DB_HOST` | PostgreSQL hostname | `ticket-db` |
| `DB_PORT` | PostgreSQL port inside the network | `5432` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | Must match `POSTGRES_PASSWORD` |
| `DB_NAME` | Database name | `ticket_master` |
| `JWT_SECRET` | Signs login tokens | Random string, 32+ characters |
| `JWT_EXPIRES_IN` | Login token lifetime | `15m` |
| `PAYCHANGU_SECRET_KEY` | Verifies PayChangu payments | Your test key |
| `FRONTEND_ORIGIN` | Allowed browser origin | `http://localhost:5173` |

## 4. Start the backend

Remove an old backend container if one exists:

```bash
docker rm -f ticket-backend-app 2>/dev/null || true
```

Start the backend:

```bash
docker run -d --name ticket-backend-app --network ticket-network \
  --env-file /tmp/ticket-backend.env \
  -p 3000:3000 \
  alicekayla/ticket-backend:1.2
```

Follow the logs:

```bash
docker logs -f ticket-backend-app
```

Wait for:

```text
Nest application successfully started
```

Check the API:

```bash
curl http://localhost:3000/events?page=1&limit=5
```

Then open Swagger at `http://localhost:3000/api`.

If the container exits, inspect the logs before recreating it:

```bash
docker logs ticket-backend-app
```

Common causes are a short `JWT_SECRET`, wrong database credentials, or a missing schema.

## 5. Configure the frontend

Install dependencies:

```bash
npm install
```

The frontend must use the real backend. Check `.env.local`:

```dotenv
VITE_USE_BACKEND=true
```

Check `.env`:

```dotenv
BACKEND_URL=http://localhost:3000
PAYCHANGU_SECRET_KEY=sec-test-your-key
```

Vite proxies `/be/*` to `BACKEND_URL`, so the browser does not call port `3000` directly.

## 6. Start the frontend

```bash
npm run dev
```

Open `http://localhost:5173`.

## 7. Test the app

The fresh database has no users or events. Register through the app first.

Suggested flow:

1. Register a customer account.
2. Browse events after an organizer publishes one.
3. Buy a ticket and complete the PayChangu test payment.
4. Open **My Tickets** and check the QR code.
5. Register an organizer account, create an event, and publish it.
6. Check the organizer dashboard for attendees and sales.
7. Use the scanner with a staff account and a ticket from the event.

To test scanning, register a normal account, then promote it to check-in staff:

```bash
docker exec -i ticket-db psql -U postgres -d ticket_master \
  -c "UPDATE users SET role = 'CHECK_IN_STAFF' WHERE email = 'staff@example.com';"
```

Log out and log in again so the new role is included in the token. Staff can scan any published event. Admin screens remain unavailable in this frontend.

### PayChangu test payments

- The frontend and backend must both have `PAYCHANGU_SECRET_KEY`.
- Use a PayChangu test key that starts with `sec-test-`.
- The backend re-verifies the payment reference before issuing tickets.
- If the key is missing or invalid, ticket purchase fails even when the frontend payment step succeeds.

## Stopping and resuming

Stop the frontend with `Ctrl+C` in the terminal running `npm run dev`, then stop the backend and database:

```bash
docker stop ticket-backend-app ticket-db
```

Resume later:

```bash
docker start ticket-db
docker start ticket-backend-app
npm run dev
```

Your data stays in the `ticket-db-data` volume, so users, events, and tickets remain. Do not remove that volume or the containers unless you want to reset. The existing backend container keeps its environment settings when started again, so you do not need the env file unless you recreate the container.

## Useful commands

| Task | Command |
| --- | --- |
| Follow backend logs | `docker logs -f ticket-backend-app` |
| Stop the whole backend stack | `docker stop ticket-backend-app ticket-db` |
| Stop the backend | `docker stop ticket-backend-app` |
| Start the backend again | `docker start ticket-backend-app` |
| Stop PostgreSQL | `docker stop ticket-db` |
| Start PostgreSQL again | `docker start ticket-db` |
| Rebuild the frontend | `npm run build` |
| Run unit tests | `npm test` |
| Run lint | `npm run lint` |

The unit tests use the in-browser mock and do not require Docker.

## Resetting local data

To start with an empty database, remove the backend and database containers, then remove the database volume:

```bash
docker rm -f ticket-backend-app ticket-db
docker volume rm ticket-db-data
```

Then repeat steps 1 and 2. This permanently deletes all local database data.

Do not remove volumes or run `docker system prune` on a database you want to keep.

## Troubleshooting

### Backend exits immediately

Run:

```bash
docker logs ticket-backend-app
```

Check `JWT_SECRET` length, database host and password, and whether the schema was imported.

### `ECONNREFUSED` or database connection errors

Confirm PostgreSQL is running and on the same Docker network:

```bash
docker ps
docker exec ticket-db pg_isready -U postgres
```

The backend must use `DB_HOST=ticket-db` and `DB_PORT=5432`.

### `password authentication failed`

`DB_PASSWORD` must match the `POSTGRES_PASSWORD` used when the database container was created.

### Port already in use

If port `3000` or `5433` is taken, change the host side of the mapping and update `BACKEND_URL` in the frontend `.env`. Keep `PORT=3000` and `DB_PORT=5432` inside the containers.

### Frontend still uses mock data

Confirm `.env.local` contains `VITE_USE_BACKEND=true`, then restart `npm run dev`.

### Login works but requests return `401` or `403`

Log out and log in again after changing a user's role. The role is stored inside the JWT, so old tokens keep the old role.

### Tickets cannot be purchased

Check that both frontend and backend use the same valid PayChangu test key, and inspect the backend logs.
