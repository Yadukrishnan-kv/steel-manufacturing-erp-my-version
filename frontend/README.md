# Steel ERP Frontend

React web application for the Steel Manufacturing ERP system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev
```

## 📋 Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run Vitest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## 🏗️ Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── services/       # API service functions
├── store/          # Redux store and slices
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── test/           # Test utilities and setup
├── App.tsx         # Main App component
└── main.tsx        # Application entry point
```

## 🎨 UI Framework

The frontend uses Material-UI (MUI) for consistent design:
- Material Design 3 components
- Responsive layout system
- Dark/light theme support
- Customizable theme configuration

## 🔄 State Management

Redux Toolkit is used for state management:
- RTK Query for API calls
- Slice-based state organization
- TypeScript integration
- DevTools support

## 🧪 Testing

The frontend uses Vitest and React Testing Library:
- Component testing
- Integration testing
- Property-based testing with fast-check
- Coverage reporting

## 📱 Responsive Design

The application is designed to work across devices:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🌐 API Integration

The frontend communicates with the backend API:
- Axios for HTTP requests
- RTK Query for caching
- Error handling and retry logic
- Loading states and optimistic updates