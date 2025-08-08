## Start up

- cd docker
- docker-compose up --build

## Endpoints

- **Frontend**: http://localhost:3000/dashboard
    - GET: */logins
    - POST: */logins
    - POST: */logins/fake - insert fake data
- **Backend API**: http://localhost:37001
- **WebSocket**: ws://localhost:37002/ws

## Tests

- docker exec -it user-login-backend npm run test