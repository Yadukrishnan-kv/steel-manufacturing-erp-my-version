# Steel ERP Customer Portal

A React-based customer portal for the Steel Manufacturing ERP system, allowing customers to track orders, book services, and manage their account.

## Features

- **Customer Authentication**: Secure login with email or phone
- **Order Tracking**: Real-time order status and production progress
- **Service Requests**: Book and track installation, maintenance, and repair services
- **Document Management**: Access invoices, warranties, and certificates
- **Feedback System**: Submit ratings and feedback for products and services
- **Profile Management**: Update personal information and view account statistics
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI)
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router v6
- **Date Handling**: Day.js with MUI Date Pickers
- **HTTP Client**: Axios
- **Testing**: Vitest with React Testing Library
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API server running on port 3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update the API base URL in `.env` if needed:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main layout with navigation
├── pages/              # Page components
│   ├── Login.tsx       # Customer login
│   ├── Register.tsx    # Customer registration
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Orders.tsx      # Order listing
│   ├── OrderDetails.tsx # Order details with progress
│   ├── ServiceRequests.tsx # Service booking and tracking
│   ├── Documents.tsx   # Document management
│   ├── Feedback.tsx    # Feedback submission
│   └── Profile.tsx     # Profile management
├── store/              # Redux store and slices
│   ├── store.ts        # Store configuration
│   └── slices/         # Redux slices
├── services/           # API services
│   └── api.ts          # API client and endpoints
└── test/               # Test utilities
    └── setup.ts        # Test setup
```

## API Integration

The portal integrates with the following backend endpoints:

- `POST /customer-portal/register` - Customer registration
- `POST /customer-portal/login` - Customer authentication
- `GET /customer-portal/orders` - Get customer orders
- `GET /customer-portal/orders/:id` - Get order details
- `POST /customer-portal/service-requests` - Book service request
- `GET /customer-portal/service-requests` - Get service requests
- `POST /customer-portal/feedback` - Submit feedback
- `GET /customer-portal/documents` - Get customer documents

## Features in Detail

### Order Tracking
- View all orders with status and delivery dates
- Detailed production progress tracking
- Quality control status for each stage
- Real-time updates via WhatsApp integration

### Service Management
- Book installation, maintenance, repair, and warranty services
- Track assigned technicians and service status
- View service history and completion reports

### Document Access
- Download invoices, warranties, and certificates
- Organized by document type with search functionality
- Secure access to customer-specific documents

### Feedback System
- Rate products and services (1-5 stars)
- Categorized feedback (Product, Service, Delivery, Support)
- Link feedback to specific orders or services

## Security

- JWT-based authentication
- Secure API communication with HTTPS
- Customer data isolation
- Session management with automatic logout

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Update documentation as needed
4. Ensure responsive design works on all screen sizes

## License

This project is part of the Steel Manufacturing ERP system.