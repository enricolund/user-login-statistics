FROM node:22-slim

WORKDIR /app

# Install postgresql-client for psql commands
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY backend/package*.json ./

# Install app dependencies
RUN npm install

# Copy source code
COPY backend/ .

# Copy .env file from docker directory
COPY docker/.env ./

# Copy initial data for seeding
COPY backend/initial_data.sql ./

# Regenerate Prisma client with new binary targets
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose ports
EXPOSE 37001 37002

# Initialize prisma schema, import initial data if user_login count 0, start the application
CMD ["sh", "-c", "npx prisma migrate deploy && \
  COUNT=$(PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c 'SELECT COUNT(*) FROM user_logins;' | xargs) && \
  if [ \"$COUNT\" = \"0\" ]; then \
    PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f initial_data.sql; \
  fi && \
  npm run start"]