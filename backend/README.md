# Steel ERP Backend API

Node.js/Express backend API for the Steel Manufacturing ERP system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## 📋 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── services/        # Business logic services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── routes/         # API route definitions
└── index.ts        # Application entry point
```

## 🔧 Environment Variables

See `.env.example` for required environment variables.

## 🧪 Testing

The backend uses Jest for testing with the following setup:
- Unit tests for services and utilities
- Integration tests for API endpoints
- Property-based tests using fast-check
- Test coverage reporting

## 📊 API Documentation

The API is fully documented using **Swagger/OpenAPI 3.0**.

### Accessing Documentation

- **Swagger UI**: `http://localhost:{PORT}/api-docs` - Interactive API documentation
- **OpenAPI JSON**: `http://localhost:{PORT}/api-docs.json` - Raw OpenAPI specification

### Available API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Authentication | `/api/v1/auth` | User login, logout, token refresh, password management |
| Manufacturing | `/api/v1/manufacturing` | Production orders, BOM, work centers, scheduling |
| Sales | `/api/v1/sales` | Leads, estimates, orders, customers |
| Inventory | `/api/v1/inventory` | Stock management, warehouses, transactions |
| Procurement | `/api/v1/procurement` | Purchase requisitions, RFQs, purchase orders, GRN |
| Quality Control | `/api/v1/qc` | Inspections, certificates, analytics |
| Service | `/api/v1/service` | Service requests, AMC contracts, warranty |
| Finance | `/api/v1/finance` | Invoices, payments, P&L, tax calculations |
| HR | `/api/v1/hr` | Employees, attendance, payroll |
| Health | `/health` | System health status |

### Quick Reference

```bash
# Health Check
GET /health

# Authentication
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me

# For complete API documentation, visit /api-docs
```