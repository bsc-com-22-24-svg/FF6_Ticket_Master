**TICKET MASTER  |  BACKEND DEPLOYMENT**

# **Backend Deployment Guide**

### Ticket Master API • Docker Hub image v1.1

This guide explains how frontend developers can download and run the Ticket Master NestJS backend using Docker. It assumes the published image is public on Docker Hub.

|**Docker image**|alicekayla/ticket-backend:1.1|
|---|---|
|**API base URL**|http://localhost:3000|
|**Swagger documentation**|http://localhost:3000/api|



## **1. Requirements**

- Install Docker Desktop (Windows/macOS) or Docker Engine (Linux), and make sure it is running.

- Have a PostgreSQL database that uses the Ticket Master project's schema.

- Obtain the project's database schema SQL file (event_ticket_booking_schema.sql) or connection details for a database already prepared by the team.

- Have the database host, port, database name, username and password supplied by the team.

Important: The Docker image contains the backend application only. It does not contain PostgreSQL, the database schema, or the team's existing records. Each developer must connect to an accessible database. Do not point a local test backend at a production database unless the team explicitly authorizes it.

## **2. Download the backend image**

Open a terminal (PowerShell, Command Prompt, Git Bash or a Linux/macOS terminal) and run:

<mark>docker pull alicekayla/ticket-backend:1.1</mark>

A Docker Hub login is normally not required if the repository is public. If Docker reports that the image cannot be found or access is denied, confirm that the image has been pushed and that the repository visibility/access permissions are correct.

## **3. Prepare PostgreSQL**

Choose ONE of the following database arrangements. The backend must be able to reach PostgreSQL from inside its Docker container.

### **Option A — Use a database supplied by the team**

- Ask the backend/database team for the database host, port, database name, username and password.

- The database must already contain the Ticket Master tables expected by backend version 1.1.

- Use the hostname/IP and port that are reachable from your computer and Docker environment.

### **Option B — Run your own PostgreSQL container**

Create a dedicated Docker network so the backend can reach PostgreSQL by container name. Use a local development database and a password of your own choice:

docker network create ticket-network docker volume create ticket-db-data docker run -d --name ticket-db --network ticket-network \

Ticket Master Backend • Image version 1.1

**TICKET MASTER  |  BACKEND DEPLOYMENT**

-e POSTGRES_USER=postgres \ -e POSTGRES_PASSWORD=CHANGE_THIS_LOCAL_PASSWORD \ -e POSTGRES_DB=ticket_master \ -p 5433:5432 \ -v ticket-db-data:/var/lib/postgresql/data \ postgres:16

Next, initialize the database using the project's event_ticket_booking_schema.sql file. Ask the team for this file if it is not available in the project repository. For example, from the directory containing the SQL file, run:

<mark>docker exec -i ticket-db psql -U postgres -d ticket_master < event_ticket_booking_schema.sql</mark>

Run the schema import only against a new, empty development database. The import may fail or duplicate objects if the schema was already applied. Do not delete the Docker volume to solve schema problems; ask the team to inspect the database first.

For Option B, the backend's database host is ticket-db and its database port is 5432 (container-to-container port, not the host-mapped port 5433).

## **4. Create the backend environment file**

In the directory where you will run the backend container, create a file named .env.docker. Do not commit this file to Git or share its passwords in chat.

NODE_ENV=production PORT=3000 DB_HOST=ticket-db DB_PORT=5432 DB_USERNAME=postgres DB_PASSWORD=CHANGE_THIS_LOCAL_PASSWORD DB_NAME=ticket_master

JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS_LONG JWT_EXPIRES_IN=15m

Environment values depend on the database arrangement:

- For Option B above, keep DB_HOST=ticket-db and DB_PORT=5432.

- For a database running directly on the same Windows/Mac host, use DB_HOST=host.docker.internal and the host-published port (for example, 5433).

- For a remote team database, use the host and port supplied by the team. The remote database must allow connections from your environment.

Use the same database password that was configured for PostgreSQL. Generate a strong JWT secret of at least 32 characters. Never use the example placeholders literally.

## **5. Run the backend container**

If using Option B, make sure the backend joins the same Docker network:

docker run -d --name ticket-backend \ --network ticket-network \

Ticket Master Backend • Image version 1.1

**TICKET MASTER  |  BACKEND DEPLOYMENT**

--env-file .env.docker \ -p 3000:3000 \ alicekayla/ticket-backend:1.1

If using Option A (a team/remote database or a host database), the backend usually does not need the ticket-network argument. Run:

docker run -d --name ticket-backend \ --env-file .env.docker \ -p 3000:3000 \ alicekayla/ticket-backend:1.1

If port 3000 is already in use, change the host side of the mapping, for example -p 3001:3000, and open http://localhost:3001/api. Keep PORT=3000 inside the container.

## **6. Verify that the backend is running**

Check the container status:

<mark>docker ps</mark>

View startup logs:

<mark>docker logs ticket-backend</mark>

A successful startup should include: “Nest application successfully started”. If the container exits, inspect the logs before trying to recreate it.

Open the Swagger API documentation in a browser:

<mark>http://localhost:3000/api</mark>

The API base URL for the frontend is:

<mark>http://localhost:3000</mark>

## **7. Configure the frontend**

Set the frontend's API base URL to http://localhost:3000 when the frontend is running on the same developer computer. If the frontend runs in another container, localhost refers to that frontend container; use a shared Docker network and the backend service/container name, or the host address as appropriate. Browser-based frontend code generally calls the host-published URL.

Use the API routes and request/response formats shown in Swagger. Authentication-protected endpoints require the access token returned by the login endpoint, supplied as a Bearer token.

## **8. Useful Docker commands**

|**Task**|**Command**|
|---|---|
|See running containers|docker ps|
|See all containers, including stopped ones|docker ps -a|
|Follow backend logs|docker logs -f ticket-backend|
|Stop the backend|docker stop ticket-backend|



Ticket Master Backend • Image version 1.1

**TICKET MASTER  |  BACKEND DEPLOYMENT**

|Start the existing backend container|docker start ticket-backend|
|---|---|
|Remove only the backend container|docker rm -f ticket-backend|
|Pull a newer published image|docker pull alicekayla/ticket-backend:1.1|



## **9. Troubleshooting**

**ECONNREFUSED / connection refused —** Check that PostgreSQL is running, the host and port are correct, and the database accepts network connections. For two containers on ticket-network, use DB_HOST=ticket-db and DB_PORT=5432.

**password authentication failed —** The DB_USERNAME or DB_PASSWORD in .env.docker does not match the PostgreSQL account. Correct the values, then recreate the backend container so it reads the updated environment file.

**Nest application starts then exits —** Run docker logs ticket-backend and inspect the first error. Common causes are database connectivity, invalid environment variables, or a missing schema.

**port is already allocated —** Choose another host port, such as -p 3001:3000, and use the matching localhost URL. **container name already in use —** If it is your own old backend container, inspect it first. You may remove only that backend container with docker rm -f ticket-backend, then run it again. Do not remove the database container or volume.

**API responds but a route returns an error —** Check the route, HTTP method, authentication/role requirements and request schema in Swagger. A successful container start does not guarantee every endpoint or workflow has been tested.

## **10. Important notes**

- The backend image does not bundle PostgreSQL or database records.

- Do not run TypeORM migrations or enable schema synchronization unless the backend/database team explicitly instructs you to. Version 1.1 is intended to use the project's existing schema.

- A Docker volume stores PostgreSQL data independently of the container. Do not run docker volume rm, docker volume prune, or docker system prune as a troubleshooting shortcut.

- Never publish .env.docker, database passwords, JWT secrets or production credentials.

- The image tag 1.1 is a fixed version. If the team publishes a newer tag, use the exact tag announced by the team.

## **Quick start checklist**

- ☐ Docker is installed and running.

- ☐ The image alicekayla/ticket-backend:1.1 has been pulled.

- ☐ A compatible Ticket Master PostgreSQL database is available and initialized.

- ☐ .env.docker contains the correct DB settings and a strong JWT_SECRET.

- ☐ The backend container is running.

- ☐ docker logs ticket-backend shows successful Nest application startup.

- ☐ Swagger opens at http://localhost:3000/api.

_If database credentials or the schema file are unavailable, contact the backend team before proceeding._

Ticket Master Backend • Image version 1.1
