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

API endpoints will be documented here as they are implemented.

### Health Check
- `GET /health` - System health status

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token

More endpoints will be added as modules are implemented.