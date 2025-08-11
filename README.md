# Real-time User Login Statistics Dashboard

---

## Project Overview

This project is a Node.js backend service designed to collect, aggregate, and broadcast user login statistics in real time. It stores login data in PostgreSQL, performs periodic aggregations, and pushes updates to a frontend dashboard via WebSockets.

---

## Setup Instructions

1. Start the backend:
   ```bash
   cd backend
   docker-compose up --build
   ```
2. Start the frontend:
   ```bash
   cd frontend
   docker-compose up --build
   ```

---

## Endpoints

- **Frontend**: http://localhost:3000/dashboard
- **Backend API**: http://localhost:37001
  - GET: \*/health
- **WebSocket**: ws://localhost:3002/ws

---

## Running the Optional Data Generator

Data generation is triggered by a cron job. You can change the interval in the `.env` file.

---

## Running the Tests

Unit and end-to-end (E2E) tests are provided:

```bash
# Run unit tests
docker exec -it user-login-backend npm run test

# Run E2E tests (backend)
# docker exec -it user-login-backend npm run test:e2e
# Note: E2E tests are not finished; they may be affected by the fake data cron.
# Upd: didn't get them to run with docker for now
```

---

## Architecture

The backend follows a modular, layered architecture typical of the modern NestJS framework. Each domain or functionality is organized in its own module with dedicated services, controllers, and interfaces to separate concerns and improve maintainability.

---

## General Flow

- **Cache warmup** upon module initialization (expiry: 2 minutes, configurable in `.env`)
- **request_initial_data**:
  - If cache hit → return cached result
  - If no cache hit → request fresh data
- **ping**:
  - immediate response with `type: pong`
