// Global test setup for e2e tests
import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Set default test timeout
jest.setTimeout(10000);
