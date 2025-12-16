"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Test setup file for Jest
const dotenv_1 = __importDefault(require("dotenv"));
// Load test environment variables first
dotenv_1.default.config({ path: '.env.test' });
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
    process.env.DATABASE_URL = 'postgresql://steel_user:steel_password@localhost:5432/steel_erp_test?schema=public';
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
//# sourceMappingURL=setup.js.map