# Configuration Documentation

This document describes all the configuration options available for the User Login Statistics backend application.

## Environment Variables

All configuration is managed through environment variables defined in the `.env` file. Use `.env.example` as a template.

### Server Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `API_PORT` | number | `37001` | Port for the REST API server |
| `WS_PORT` | number | `37002` | Port for the WebSocket server |
| `WS_PATH` | string | `/ws` | WebSocket endpoint path |

### Database Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DB_HOST` | string | `localhost` | Database host |
| `DB_PORT` | number | `5432` | Database port |
| `DB_USER` | string | `postgres` | Database username |
| `DB_PASSWORD` | string | `postgres` | Database password |
| `DB_NAME` | string | `user_login_statistics` | Database name |
| `DATABASE_URL` | string | - | Full PostgreSQL connection string |

### Application Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | enum | `development` | Environment mode: `development`, `production`, or `test` |

### Stats and Caching Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `STATS_AGGREGATION_INTERVAL` | number | `30` | How often to aggregate stats (in seconds) |
| `CACHE_TTL_MINUTES` | number | `5` | How long to cache stats (in minutes) |

### Default Values Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DEFAULT_FAKE_DATA_COUNT` | number | `10` | Default number of fake data records to generate |
| `DEFAULT_TOP_USERS_LIMIT` | number | `10` | Default limit for top active users queries |
| `DEFAULT_LOGIN_TRENDS_DAYS` | number | `30` | Default number of days for login trends |

## Configuration Validation

The application validates all configuration values on startup. If any required values are missing or invalid, the application will fail to start with detailed error messages.

### Validation Rules

- **Ports**: Must be integers between 1 and 65535
- **Strings**: Must be non-empty strings
- **Positive Numbers**: Must be positive integers
- **Environment**: Must be one of: `development`, `production`, `test`

## Usage Examples

### Development Environment

```bash
# Copy the example file
cp .env.example .env

# Start the application
npm start
```

### Production Environment

```bash
# Set production values
export NODE_ENV=production
export API_PORT=3000
export WS_PORT=3001
export DATABASE_URL="postgresql://user:pass@prod-db:5432/dbname"

# Start the application
npm run start:prod
```

### Testing with Different Cache Settings

```bash
# Quick cache refresh for testing
export CACHE_TTL_MINUTES=1
export STATS_AGGREGATION_INTERVAL=10

npm start
```

## Configuration Access

Configuration values are accessed through the `MyConfiguration` namespace:

```typescript
import { MyConfiguration } from './MyConfiguration';

// Access configuration values
const apiPort = MyConfiguration.API_PORT();
const wsPort = MyConfiguration.WS_PORT();
const isDevelopment = MyConfiguration.IS_DEVELOPMENT();
```

## Environment-Specific Considerations

### Development
- Lower cache TTL for faster testing
- More frequent stats aggregation
- Detailed logging enabled

### Production
- Higher cache TTL for better performance
- Less frequent stats aggregation
- Optimized logging levels
- Proper database connection pooling

### Testing
- In-memory database or test database
- Minimal cache TTL
- Fast aggregation intervals
- Mock external dependencies
