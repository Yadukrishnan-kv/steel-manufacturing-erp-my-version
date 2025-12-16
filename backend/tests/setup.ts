// Test setup file for Jest
import dotenv from 'dotenv';

// Load test environment variables first
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Ensure required environment variables are set for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-super-secret-jwt-key-for-testing-only-32-chars-minimum';
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test-super-secret-session-key-for-testing-only-32-chars-minimum';
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./test.db';
}

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};