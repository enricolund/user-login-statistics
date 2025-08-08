# Node.js Test Assignment: Real-time Statistics Dashboard

## Goal

Build a Node.js backend service that simulates collecting user login statistics, stores them in PostgreSQL, performs aggregations, and pushes updates via WebSockets to the provided frontend dashboard for real-time visualization. The service should handle WebSocket connections robustly, including a heartbeat mechanism. Containerize the application using Docker for easy setup and testing.

## Technologies

* **Backend:** Node.js (latest LTS version) and Typescript
* **Framework:** NestJS or Nestia.js (https://nestia.io Recommended), or NodeJS based framework of your choice
* **Database:** PostgreSQL
* **DB Driver:** TypeORM or Prisma (Recommended)
* **WebSockets:** Websocket
* **Frontend:** Any Typescript supported framework or Vanilla JS with typescript
* **Containerization:** Docker, Docker Compose

## Assignment Details

### Part 1: Backend Setup & Data Generation

1.  **Project Structure:** Set up a standard Node.js project with NestJS/Nestia.js. Include directories like `src/modules`, `src/services`, `src/controllers`, `src/entities`, `src/generators`, `src/websocket`, `public`.
2.  **Database Schema:** Define a SQL schema for PostgreSQL and generate dummy data or use free API feeds. 
3.  **Initial Data:** **A `sample_data.sql` file containing approximately 100 rows of sample `INSERT` statements for the `user_logins` table is provided separately. This script should be run against the database after the schema is created to populate it with initial data for testing.**
4.  **Data Generator (`src/generators`):**
    * Create a Node.js program that can generate *additional* realistic-looking fake data in real time for the `user_logins` table and insert it into PostgreSQL. Can be done any way you think is suitable in thise case (cron, api hooks, cli, etc).
5.  **Configuration:** Use environment variables or a simple config file (`.env` or similar) for database connection strings, server ports, etc. Load these appropriately in your application.

### Part 2: Backend - Aggregation & WebSocket Service

1.  **Repository Layer (`src/repositories`):**
    * Implement functions using Prisma/TypeORM to interact with the database: Insert raw data, perform/update aggregations, retrieve aggregated data.
2.  **Aggregation Logic (`src/services`):**
    * Create services that call the repository aggregation update methods.
    * **Triggering:** Implement a periodic trigger using NestJs cron job within the main service (recommended) running every N seconds (e.g., 10-30 seconds).
3.  **WebSocket Handler (`src/websocket`):**
    * Use WebSocket to handle connections on `/ws`.
    * **Connection Management:** Maintain a pool of active client connections. Register new connections, and properly handle cleanup (unregistering, resource release) when they close or error.
    * **Incoming Messages:** Handle and parse JSON messages from clients:
        * `{ "type": "request_initial_data" }`: Query latest aggregated stats and send them back *directly to the requesting client* using the `stats_update` format.
        * **`{ "type": "ping" }` (Heartbeat): Immediately send back a `{ "type": "pong" }` message *to the specific client that sent the ping*.**
    * **Data Broadcasting (Server-to-Client):**
        * After periodic aggregation, fetch or get via WebSocket the latest aggregated data.
        * Broadcast a `{ "type": "stats_update", "payload": { "deviceStats": [...], "regionDeviceStats": [...], "sessionStats": [...] } }` message to *all* connected clients.
4.  **HTTP Server (`src/main.ts`):**
    * Initialize your NestJS/Nestia.js/NodeJS application. Setup database connection, WebSocket gateway/handler, other routes (e.g., `/health`). Start the periodic aggregation interval. Start the server. Configure CORS if needed.

### Part 3: Frontend

* Create HTML, CSS, and JavaScript/TypeScript files for the frontend. TypeScript is preferred but not mandatory.
* The frontend should:
    * Connect to the WebSocket endpoint `/ws`
    * Request initial data on connection
    * Implement a ping/pong heartbeat mechanism
    * Listen for `stats_update` messages to update the UI with charts and tables
    * Display the statistics in a visually appealing dashboard
* **Your WebSocket implementation must be compatible with the frontend:**
    * Handle the `/ws` endpoint correctly.
    * Respond to `{ "type": "request_initial_data" }` with a `stats_update` message.
    * **Respond correctly to `{ "type": "ping" }` with a `{ "type": "pong" }` message.**
    * Periodically broadcast `{ "type": "stats_update", "payload": ... }` messages.
    * Use the expected `payload` structure within `stats_update` messages for the frontend to parse.

### Part 4: Containerization (Docker)

1.  **`Dockerfile` (Backend):** Multi-stage build for the Node.js application.
2.  **`Dockerfile` (Frontend):** Simple `nginx:alpine` or similar serving the static files.
3.  **`docker-compose.yml`:** Orchestrate `db` (Postgres), `backend`, and `frontend` services.

### Part 5: Testing

1.  **Unit Tests:** Write 1-2 meaningful unit tests (e.g., repository mocks).
2.  **E2E Tests (Backend Focused):**
    * Write end-to-end tests interacting with the running service (ideally via Docker Compose).
    * **WebSocket Test:** Implement a test using a WebSocket client:
        * Connect to `/ws`.
        * Send `{ "type": "request_initial_data" }` and validate the response.
        * **Send `{ "type": "ping" }` and validate the `{ "type": "pong" }` response.**
        * Receive and validate broadcast `{ "type": "stats_update" }` messages.

## Deliverables

* Complete Node.js source code for the backend service using NestJS/Nestia.js.
* Frontend files (HTML, CSS, JavaScript/TypeScript) placed correctly within the project structure.
* `Dockerfile` for the backend Node.js application.
* `Dockerfile` for the frontend static web server.
* `docker-compose.yml` file to orchestrate all services.
* Test files containing the unit and E2E tests.
* A `README.md` file explaining:
    * Project overview.
    * Prerequisites (Docker, Docker Compose, Node.js).
    * Setup instructions (e.g., `docker-compose build`, `docker-compose up`).
    * How to run the optional data generator (if implemented).
    * How to run the tests.
    * Brief explanation of the architecture, chosen framework, WebSocket communication flow **(including ping/pong heartbeat)**.
