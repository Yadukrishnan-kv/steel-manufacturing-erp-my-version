# Steel Manufacturing ERP System

A comprehensive Enterprise Resource Planning (ERP) system for premium steel door, window, and frame manufacturing operations. The system integrates manufacturing, sales, procurement, inventory, finance, service, and HR operations across multiple branches.

## 🏗️ Architecture

This is a monorepo containing:
- **Backend**: Node.js/Express API with TypeScript
- **Frontend**: React web application with Material-UI
- **Mobile Apps**: Flutter applications for field operations
  - Sales App (lead capture, measurements)
  - QC App (quality control inspections)
  - Service App (installation, maintenance)
  - Store App (inventory management)
  - Production App (production tracking)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Flutter SDK 3.10+ (for mobile apps)
- PostgreSQL 15+ (via Docker)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd steel-manufacturing-erp
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit the .env files with your configuration
```

3. **Start the database:**
```bash
npm run docker:up
```

4. **Set up the database:**
```bash
cd backend
npm run db:generate
npm run db:push
```

5. **Start the development servers:**
```bash
npm run dev
```

This will start:
- Backend API on http://localhost:3000
- Frontend on http://localhost:5173
- PostgreSQL on localhost:5432
- PgAdmin on http://localhost:8080

## 📱 Mobile Development

Each mobile app can be developed independently:

```bash
cd mobile/sales_app
flutter pub get
flutter run
```

## 🧪 Testing

Run tests across all workspaces:
```bash
npm run test
```

Or run tests for specific workspace:
```bash
npm run test --workspace=backend
npm run test --workspace=frontend
```

## 📋 Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all applications
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run format` - Format code with Prettier
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

## 🏢 Business Modules

### Core Modules
- **Manufacturing**: Production scheduling, BOM management, capacity planning
- **Sales**: Lead management, estimation engine, order processing
- **Inventory**: Multi-warehouse management, barcode tracking, batch control
- **Procurement**: Supplier management, RFQ processing, purchase orders
- **Quality Control**: Multi-stage inspections, photo documentation
- **Service**: Installation tracking, AMC management, warranty handling
- **Finance**: Accounting, GST compliance, cost tracking
- **HR**: Payroll, attendance, KPI tracking

### Supporting Systems
- **Alerts & SLA**: Automated notifications and escalations
- **Business Intelligence**: Dashboards and reporting
- **Customer Portal**: Self-service order tracking
- **Employee Portal**: Self-service HR functions

## 🔧 Technology Stack

### Backend
- Node.js 18+ with TypeScript
- Express.js with Helmet security
- PostgreSQL with Prisma ORM
- JWT authentication
- Winston logging

### Frontend
- React 18 with TypeScript
- Material-UI (MUI) components
- Redux Toolkit for state management
- React Router for navigation
- Recharts for data visualization

### Mobile
- Flutter 3.10+ with Dart
- Bloc/Cubit for state management
- Dio for HTTP requests
- Hive/SQLite for offline storage
- Camera and location services

### Infrastructure
- Docker for containerization
- PostgreSQL for data storage
- Redis for caching (optional)
- Nginx for load balancing (production)

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Request rate limiting
- Input validation with Zod
- SQL injection prevention
- XSS protection with Helmet
- Comprehensive audit logging

## 📊 Key Features

### Manufacturing
- Automated production scheduling with Gantt charts
- Multi-level BOM management with revision control
- Capacity-based routing for all operations
- Real-time scrap tracking and costing
- Engineering change management

### Sales & CRM
- Lead capture from Meta/Google advertising
- Geo-tagged site measurements with photos
- Comprehensive estimation engine
- Automated sales order to production conversion
- Customer portal for order tracking

### Inventory Management
- Multi-warehouse stock management
- Rack/bin location tracking with barcodes
- Batch/lot tracking for materials
- Order-wise material allocation
- Automated reorder point monitoring

### Quality Control
- Stage-specific inspection checklists
- Photo documentation and scoring
- Automatic rework job card generation
- Customer-specific requirement embedding
- QC report linking to delivery

## 🌐 External Integrations

- **WhatsApp Business API**: Customer notifications
- **Meta Business API**: Facebook/Instagram lead capture
- **Google Ads API**: Google advertising leads
- **Biometric Systems**: Hikvision attendance integration
- **Email/SMS**: Multi-channel notifications

## 📈 Deployment

The system supports both cloud and hybrid deployment models:

- **Cloud**: AWS, Azure, or GCP deployment
- **Hybrid**: On-premises with cloud backup
- **Multi-branch**: Distributed deployment across locations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is proprietary software for steel manufacturing operations.

## 📞 Support

For technical support and questions, please contact the development team.