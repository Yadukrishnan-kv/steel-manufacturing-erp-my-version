# Steel Manufacturing ERP - Frontend

A modern React-based frontend application for the Steel Manufacturing ERP system.

## Technology Stack

- **React 18+** with TypeScript
- **Material-UI (MUI)** for UI components
- **Redux Toolkit** with RTK Query for state management
- **React Router v6** for routing
- **React Hook Form** with Yup validation
- **Vite** for build tooling
- **Vitest** for testing

## Features

- ✅ JWT-based authentication and authorization
- ✅ Role-based access control (RBAC)
- ✅ Responsive layout with Material-UI
- ✅ Protected routes and navigation
- ✅ Redux Toolkit with RTK Query for API management
- ✅ TypeScript for type safety
- ✅ Comprehensive testing setup

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   └── layout/         # Layout components (AppBar, Sidebar)
├── pages/              # Page components
├── store/              # Redux store and slices
├── services/           # API services with RTK Query
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── config/             # Configuration files
└── test/               # Test setup and utilities
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update environment variables in `.env` as needed.

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Linting

Run ESLint:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

## Authentication

The application uses JWT-based authentication with the following features:

- Login form with email/password
- Protected routes that require authentication
- Role-based access control
- Automatic token refresh
- Secure token storage

## State Management

Redux Toolkit is used for state management with:

- **Auth Slice**: User authentication state
- **RTK Query**: API data fetching and caching
- **Type-safe**: Full TypeScript support

## Routing

React Router v6 is configured with:

- Protected routes for authenticated users
- Role-based route protection
- Nested routing for module organization
- 404 and unauthorized error pages

## UI Components

Material-UI provides:

- Responsive design system
- Consistent theming
- Accessible components
- Mobile-first approach

## API Integration

RTK Query handles:

- Automatic API calls
- Response caching
- Loading states
- Error handling
- Background refetching

## Module Structure

The application is organized into business modules:

- **Manufacturing**: Production orders, BOM, scheduling
- **Sales**: Leads, orders, customers, estimates
- **Inventory**: Items, stock levels, transactions
- **Procurement**: Purchase orders, suppliers, RFQ
- **Quality Control**: Inspections, checklists, reports
- **Service**: Requests, installations, AMC, warranty
- **HR**: Employees, attendance, payroll, performance
- **Finance**: Invoices, payments, reports, cost analysis
- **Business Intelligence**: Dashboards, analytics, trends

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/api` |
| `VITE_APP_NAME` | Application name | `Steel Manufacturing ERP` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |

## Contributing

1. Follow the existing code structure and patterns
2. Write tests for new components and features
3. Use TypeScript for type safety
4. Follow Material-UI design guidelines
5. Ensure responsive design for mobile devices

## Next Steps

This frontend structure is ready for implementing the business module interfaces in subsequent tasks:

- Task 26: Implement core business module interfaces
- Task 27: Implement advanced frontend features and dashboards