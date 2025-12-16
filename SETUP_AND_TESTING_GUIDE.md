# Steel Manufacturing ERP - Setup and Testing Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed and running
- Git installed
- Docker (optional, for containerized setup)

## Quick Start Guide

### 1. Database Setup

First, ensure PostgreSQL is running and create a database:

```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE steel_erp_dev;
CREATE USER steel_erp_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE steel_erp_dev TO steel_erp_user;
```

### 2. One-Click Setup (Recommended)

**Windows:**
```bash
# Setup database and dependencies
setup-database.bat

# Test the setup
test-setup.bat

# Start all servers
start-dev.bat
```

**Linux/Mac:**
```bash
# Setup database and dependencies
./setup-database.sh

# Start all servers
./start-dev.sh
```

### 3. Manual Setup (Alternative)

**Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your database credentials
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The backend will start on `http://localhost:3001`

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Edit .env file
# VITE_API_URL=http://localhost:3001/api/v1

# Start the frontend development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Customer Portal Setup

```bash
# Open a new terminal and navigate to customer portal directory
cd customer-portal

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Edit .env file
# VITE_API_URL=http://localhost:3001/api/v1

# Start the customer portal development server
npm run dev
```

The customer portal will start on `http://localhost:5174`

### 5. Mobile App Setup (Sales App)

```bash
# Navigate to mobile sales app directory
cd mobile/sales_app

# Get Flutter dependencies
flutter pub get

# Run the app (ensure you have an emulator running or device connected)
flutter run
```

## Test User Accounts

After running the seed script, you'll have the following test accounts:

### Super Admin Account
- **Email**: `admin@steelmanufacturing.com`
- **Password**: `Admin123!`
- **Role**: Super Admin
- **Access**: Full system access

### Branch Manager Account
- **Email**: `manager.kerala@steelmanufacturing.com`
- **Password**: `Manager123!`
- **Role**: Branch Manager
- **Branch**: Kerala Branch
- **Access**: Branch-level management access

### Production Manager Account
- **Email**: `production@steelmanufacturing.com`
- **Password**: `Production123!`
- **Role**: Production Manager
- **Access**: Manufacturing and production modules

### Sales Executive Account
- **Email**: `sales@steelmanufacturing.com`
- **Password**: `Sales123!`
- **Role**: Sales Executive
- **Access**: Sales, leads, and customer management

### QC Inspector Account
- **Email**: `qc@steelmanufacturing.com`
- **Password**: `QC123!`
- **Role**: QC Inspector
- **Access**: Quality control and inspection modules

### Service Technician Account
- **Email**: `service@steelmanufacturing.com`
- **Password**: `Service123!`
- **Role**: Service Technician
- **Access**: Service management and installation tracking

### Customer Account (for Customer Portal)
- **Email**: `customer@example.com`
- **Password**: `Customer123!`
- **Customer Code**: `CUST001`
- **Access**: Customer portal for order tracking and service requests

### Employee Account (for Employee Portal)
- **Employee Code**: `EMP001`
- **Email**: `employee@steelmanufacturing.com`
- **Password**: `Employee123!`
- **Access**: Employee self-service portal

## Testing the Application

### 1. Main ERP System (Frontend)

1. Open `http://localhost:5173` in your browser
2. Login with any of the test accounts above
3. Navigate through different modules based on your role:
   - **Manufacturing Dashboard**: View production orders and schedules
   - **Sales Management**: Create leads, estimates, and sales orders
   - **Inventory Management**: Manage stock, locations, and transactions
   - **Procurement**: Handle purchase requisitions and supplier management
   - **Quality Control**: Manage QC inspections and checklists
   - **Service Management**: Handle service requests and installations
   - **Finance**: View invoices, payments, and financial reports
   - **HR Management**: Manage employees, attendance, and payroll
   - **Business Intelligence**: View dashboards and reports

### 2. Customer Portal

1. Open `http://localhost:5174` in your browser
2. Login with customer credentials: `customer@example.com` / `Customer123!`
3. Test features:
   - View order status and tracking
   - Submit service requests
   - View invoices and documents
   - Provide feedback and ratings

### 3. Employee Self-Service Portal

1. Access through the main ERP system or customer portal
2. Login with employee credentials: `employee@steelmanufacturing.com` / `Employee123!`
3. Test features:
   - View attendance and overtime records
   - Submit leave requests
   - Access salary slips and payroll information
   - View KPI metrics and performance reviews

### 4. Mobile Sales App

1. Run the Flutter app on your device/emulator
2. Login with sales executive credentials: `sales@steelmanufacturing.com` / `Sales123!`
3. Test features:
   - Create and manage leads
   - Capture geo-tagged site measurements
   - Generate estimates and quotes
   - Sync data with backend when online

## Sample Data Included

The seed script creates comprehensive test data including:

### Master Data
- **Branches**: Kerala Branch, Tamil Nadu Branch
- **Warehouses**: Main Warehouse, Raw Material Warehouse
- **Inventory Items**: Steel sheets, coating materials, hardware components
- **Customers**: 10 sample customers with complete profiles
- **Suppliers**: 5 suppliers with contact and banking details
- **Employees**: 20+ employees across different roles and departments

### Transactional Data
- **Sales Orders**: 5 sample orders in different stages
- **Production Orders**: Linked to sales orders with scheduling
- **Purchase Orders**: Sample procurement transactions
- **Stock Transactions**: Inventory movements and transfers
- **QC Inspections**: Sample quality control records
- **Service Requests**: Customer service and maintenance requests

### Configuration Data
- **Roles and Permissions**: Complete RBAC setup
- **Work Centers**: Production facilities and operations
- **BOM (Bill of Materials)**: Product structures and components
- **Price Lists**: Product pricing and costing information

## API Testing

You can test the APIs directly using tools like Postman or curl:

### Authentication
```bash
# Login to get JWT token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@steelmanufacturing.com", "password": "Admin123!"}'
```

### Sample API Calls
```bash
# Get all sales orders (replace TOKEN with actual JWT)
curl -X GET http://localhost:3001/api/v1/sales/orders \
  -H "Authorization: Bearer TOKEN"

# Get inventory items
curl -X GET http://localhost:3001/api/v1/inventory/items \
  -H "Authorization: Bearer TOKEN"

# Get production orders
curl -X GET http://localhost:3001/api/v1/manufacturing/production-orders \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database and user exist

2. **Migration Errors**
   - Reset database: `npx prisma migrate reset --force`
   - Run migrations: `npx prisma migrate dev`

3. **Seed Data Issues (Username conflicts, etc.)**
   - **Windows**: Run `reset-database.bat`
   - **Linux/Mac**: Run `./reset-database.sh`
   - Or manually: `npx prisma migrate reset --force && npx prisma db seed`

4. **External API Warnings (Normal in Development)**
   - Warnings about WhatsApp, Meta, Google, SMS credentials are normal
   - These are optional integrations for production use
   - The system works fully without them in development

5. **Port Conflicts**
   - Backend (3001): Change PORT in backend/.env
   - Frontend (5174): Change in vite.config.ts
   - Customer Portal (5175): Change in vite.config.ts

6. **Frontend API Connection Issues (404 errors)**
   - ✅ **FIXED**: Frontend .env now has correct API URL: `VITE_API_URL=http://localhost:3000/api/v1`
   - ✅ **FIXED**: API response transformation to match frontend expectations
   - ✅ **FIXED**: React infinite re-render issue in authentication components
   - Backend runs on port 3001, frontend on port 5174 (or 5173)
   - Both servers are running and API connection is working
   - Use `test-auth.bat` to verify API connectivity

7. **Rate Limiting Issues (429 Too Many Requests)**
   - ✅ **FIXED**: Increased rate limits for development (1000 requests per minute)
   - ✅ **FIXED**: Backend moved to port 3001 to avoid conflicts
   - If you still get 429 errors, wait 1 minute or restart the backend server
   - Rate limits: `RATE_LIMIT_WINDOW_MS=60000` and `RATE_LIMIT_MAX_REQUESTS=1000`

8. **React Infinite Re-render Issues**
   - ✅ **FIXED**: "Maximum update depth exceeded" error in ProtectedRoute
   - ✅ **FIXED**: API response transformation mismatch between backend and frontend
   - ✅ **FIXED**: useEffect dependency array causing infinite loops
   - If you see navigation throttling warnings, restart the frontend server

9. **CORS Issues**
   - Ensure frontend URLs are in CORS_ORIGIN environment variable

### Development Commands

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npx prisma studio    # Open database GUI

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests

# Mobile
flutter run          # Run on device/emulator
flutter build apk    # Build Android APK
flutter test         # Run tests
```

## Next Steps

1. **Explore the System**: Login with different user roles to see role-based access
2. **Test Workflows**: Try complete business processes like order-to-delivery
3. **Mobile Testing**: Test the sales app with offline/online scenarios
4. **API Integration**: Test external integrations (WhatsApp, Email, SMS)
5. **Customize**: Modify configurations, add new users, or test with your own data

## Support

If you encounter any issues:
1. Check the console logs in browser developer tools
2. Check backend server logs in terminal
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed
5. Check that all required services (PostgreSQL) are running

The system is now ready for comprehensive testing and development!