# ---- Stage 1: Build ----
FROM node:22-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:22-slim
WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/lib ./lib
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

COPY initial_data.sql ./

EXPOSE 37001 37002
CMD ["sh", "-c", "npx prisma migrate deploy && \
  COUNT=$(PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c 'SELECT COUNT(*) FROM user_logins;' | xargs) && \
  if [ \"$COUNT\" = \"0\" ]; then \
  PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f initial_data.sql; \
  fi && \
  npm run start"]
