# Steel Manufacturing ERP System Design

## Overview

The Steel Manufacturing ERP system is a comprehensive enterprise solution designed for premium steel door, window, and frame manufacturing operations. The system integrates manufacturing, sales, procurement, inventory, finance, service, and HR operations across multiple branches, providing real-time visibility and automated workflows throughout the organization.

The architecture follows microservices principles with event-driven communication, ensuring scalability, maintainability, and high availability. The system supports both cloud and hybrid deployment models with robust security, audit capabilities, and mobile-first design for field operations.

## Architecture

### System Architecture Pattern
The system follows a **modular monolith architecture** with the following key principles:
- **Domain-Driven Design (DDD)** for module boundaries
- **RESTful API** design for client-server communication
- **Layered Architecture** with clear separation of concerns
- **Database-per-module** logical separation within PostgreSQL
- **Synchronous Communication** between modules via direct function calls

### Technology Stack

**Backend Services:**
- **Runtime**: Node.js 18+ with TypeScript 5.0+
- **Framework**: Express.js with Helmet for security
- **Database**: PostgreSQL 15+ for transactional data
- **Session Management**: Express-session with in-memory store
- **ORM**: Prisma for database operations and migrations
- **Validation**: Zod for request validation and type safety
- **Testing**: Jest with Supertest for API testing
- **Authentication**: JWT tokens with bcrypt for password hashing

**Frontend Applications:**
- **Web Dashboard**: React 18+ with TypeScript
- **UI Framework**: Material-UI (MUI) or Ant Design
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with Yup validation
- **Charts**: Recharts or Chart.js for dashboards
- **Testing**: Jest with React Testing Library

**Mobile Applications:**
- **Framework**: Flutter 3.10+ with Dart
- **State Management**: Bloc/Cubit or Riverpod
- **HTTP Client**: Dio for API communication
- **Local Storage**: Hive or SQLite for offline data
- **Navigation**: GoRouter for declarative routing
- **UI Components**: Material Design 3 widgets
- **Testing**: Flutter Test framework

**Infrastructure:**
- **Containerization**: Docker for development and production
- **Cloud Platform**: Single region deployment (AWS/Azure/GCP)
- **File Storage**: Local file system with backup to cloud storage
- **Load Balancer**: Nginx for production deployment
- **SSL**: Let's Encrypt for HTTPS certificates

**Integration Layer:**
- **Authentication**: JWT tokens with bcrypt password hashing
- **External APIs**: WhatsApp Business API, Meta Business API, Google Ads API
- **File Upload**: Multer for handling file uploads
- **Image Processing**: Sharp for image optimization and resizing

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                 ERP Application Server                      │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │Manufacturing│    Sales    │  Inventory  │   Finance   │  │
│  │   Module    │   Module    │   Module    │   Module    │  │
│  └─────────────┼─────────────┼─────────────┼─────────────┘  │
│  ┌─────────────┼─────────────┼─────────────┼─────────────┐  │
│  │     QC      │   Service   │     HR      │     BI      │  │
│  │   Module    │   Module    │   Module    │   Module    │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Shared Data Layer (PostgreSQL)                │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Core Services

**1. Manufacturing Service**
- **Responsibilities**: Production scheduling, BOM management, capacity planning, scrap tracking, engineering change management
- **Key APIs**: 
  - `POST /api/manufacturing/production-orders` - Create production orders with material validation
  - `GET /api/manufacturing/schedule` - Get Gantt chart and calendar visualization
  - `PUT /api/manufacturing/bom/{id}` - Update multi-level BOM with revision control
  - `POST /api/manufacturing/capacity-routing` - Calculate capacity-based routing for cutting, CNC, bending, welding, coating, assembly
  - `POST /api/manufacturing/scrap-tracking` - Record scrap by operation with costing integration
  - `POST /api/manufacturing/engineering-changes` - Manage engineering changes with BOM updates
  - `GET /api/manufacturing/material-consumption` - Track actual vs planned material usage
- **Database Tables**: production_orders, bom_items, bom_revisions, work_centers, capacity_schedules, operations, scrap_records, engineering_changes, material_consumption

**2. Sales Service**
- **Responsibilities**: Lead management, estimation engine, order processing, customer portal
- **Key APIs**:
  - `POST /api/sales/leads` - Create leads from Meta/Google with source tracking
  - `POST /api/sales/estimates` - Generate pricing based on size, coating, hardware, labor
  - `POST /api/sales/orders` - Create sales orders with material validation
  - `POST /api/sales/measurements` - Geo-tagged site measurements with photos
  - `GET /api/sales/customer-portal` - Customer self-service portal for order tracking
  - `POST /api/sales/discount-approval` - Route discount approvals through hierarchy
- **External Integrations**: Meta Business API, Google Ads API, WhatsApp Cloud API for notifications

**3. Inventory Service**
- **Responsibilities**: Multi-warehouse stock management, rack/bin operations, barcode tracking, order-wise allocation
- **Key APIs**:
  - `GET /api/inventory/stock/{item}` - Get multi-warehouse stock levels
  - `POST /api/inventory/transactions` - Record stock movements with audit trails
  - `GET /api/inventory/locations` - Get rack/bin locations with barcode mapping
  - `POST /api/inventory/allocate-order` - Order-wise material allocation with rack/bin segregation
  - `POST /api/inventory/barcode-scan` - Process barcode/QR code scanning
  - `GET /api/inventory/batch-tracking` - Track coating materials and TATA steel batches with expiry
  - `POST /api/inventory/inter-branch-transfer` - Manage stock transfers between branches
- **Features**: Multi-warehouse support, batch/lot tracking, automated reorder points, rack/bin mapping, order-wise segregation

**4. Procurement Service**
- **Responsibilities**: Purchase requisitions, supplier evaluation, RFQ processing, GRN with QC integration
- **Key APIs**:
  - `POST /api/procurement/requisitions` - Auto-generate PRs from stock-outs
  - `POST /api/procurement/rfq` - Send RFQ with vendor comparison tools
  - `POST /api/procurement/orders` - Create POs with approval hierarchy
  - `POST /api/procurement/grn` - Goods receipt with QC integration before stock update
  - `GET /api/procurement/supplier-rating` - Supplier performance evaluation
  - `POST /api/procurement/inter-branch-transfer` - Manage inter-branch stock transfers

**5. Quality Control Service**
- **Responsibilities**: Multi-stage QC (cutting, fabrication, coating, assembly, dispatch, installation), customer-specific requirements
- **Key APIs**:
  - `POST /api/qc/inspections` - Record QC with photos and scoring
  - `GET /api/qc/checklists/{stage}` - Stage-specific checklists (cutting, CNC, bending, welding, coating, assembly)
  - `POST /api/qc/rework` - Generate rework job cards for failed QC
  - `POST /api/qc/customer-requirements` - Embed customer-specific concerns in QC forms
  - `GET /api/qc/reports` - Link QC reports to final delivery documentation

**6. Service Management Service**
- **Responsibilities**: Service booking, technician allocation, AMC/warranty tracking, RMA workflow, installation with geo-tagging
- **Key APIs**:
  - `POST /api/service/bookings` - Auto-assign technicians based on location and expertise
  - `GET /api/service/warranty/{product}` - Validate warranty and guarantee tracking
  - `POST /api/service/installations` - Geo-tagged installation with photo capture
  - `POST /api/service/amc` - AMC contract management and tracking
  - `POST /api/service/rma` - RMA workflow for replacements
  - `POST /api/service/costing` - Service costing with parts consumption and labor tracking

**7. Finance Service**
- **Responsibilities**: Accounts receivable/payable, GST/TDS/statutory automation, branch-wise P&L, cash flow forecasting, manufacturing costing
- **Key APIs**:
  - `POST /api/finance/invoices` - Auto-generate invoices with GST/TDS calculation
  - `GET /api/finance/reports/pl` - Branch-wise and consolidated P&L statements
  - `POST /api/finance/payments` - Record payments with statutory compliance
  - `GET /api/finance/cashflow` - Cash flow forecasting based on receivables/payables
  - `GET /api/finance/manufacturing-cost` - Standard vs actual manufacturing cost analysis

**8. HR Service**
- **Responsibilities**: Biometric attendance integration, payroll with statutory deductions, KPI tracking linked to JD, geo-tagged field attendance
- **Key APIs**:
  - `POST /api/hr/biometric-attendance` - Integrate with Hikvision biometric systems
  - `POST /api/hr/geo-attendance` - Geo-tagged attendance for field executives
  - `GET /api/hr/kpi/{employee}` - Employee KPIs linked to job descriptions
  - `POST /api/hr/payroll` - Payroll with PF, ESI, PT automation
  - `POST /api/hr/shift-management` - Shift, OT, early-out tracking
  - `POST /api/hr/appraisal` - KPI-based appraisal, promotion, and incentives

**9. Alert and SLA Management Service**
- **Responsibilities**: SLA-based alerts, escalation hierarchy, multi-channel notifications, follow-up loops
- **Key APIs**:
  - `POST /api/alerts/sla-monitoring` - Monitor SLAs for leads, tasks, QC, service, production
  - `POST /api/alerts/escalation` - Escalate through Employee → TL → Manager → GM hierarchy
  - `POST /api/alerts/notifications` - Send alerts via Email, App, WhatsApp, SMS
  - `POST /api/alerts/reminders` - Auto-reminders and follow-up loops
  - `GET /api/alerts/audit-trail` - Maintain audit trails of all notifications and responses

**10. Business Intelligence Service**
- **Responsibilities**: Role-based dashboards, trend analysis, Power BI-style drill-down, real-time monitoring
- **Key APIs**:
  - `GET /api/bi/dashboards/{role}` - Role-based views for production, sales, finance, HR, service
  - `GET /api/bi/trends` - Historical data with forecasting capabilities
  - `GET /api/bi/drill-down` - Power BI-style navigation from summary to detailed views
  - `GET /api/bi/real-time` - Real-time operational data updates
  - `GET /api/bi/reports` - Restricted access based on user roles and permissions

**11. Customer Portal Service**
- **Responsibilities**: Self-service portal, order tracking, service requests, WhatsApp integration
- **Key APIs**:
  - `GET /api/customer-portal/login` - Secure customer login with order/invoice visibility
  - `GET /api/customer-portal/orders` - Real-time production progress and delivery estimates
  - `POST /api/customer-portal/service-requests` - Customer service booking and tracking
  - `POST /api/customer-portal/whatsapp` - WhatsApp notifications for order milestones
  - `POST /api/customer-portal/feedback` - Customer ratings and service quality metrics

**12. Employee Self-Service Portal Service**
- **Responsibilities**: Employee portal, personal information management, leave management, payroll access, performance tracking
- **Key APIs**:
  - `GET /api/employee-portal/login` - Secure employee login with personal dashboard
  - `GET /api/employee-portal/profile` - Employee profile and personal information management
  - `GET /api/employee-portal/attendance` - Biometric attendance history and overtime tracking
  - `POST /api/employee-portal/leave-requests` - Submit leave applications with approval routing
  - `GET /api/employee-portal/payroll` - Access salary slips and tax documents
  - `GET /api/employee-portal/kpi` - View personal KPI metrics and performance reviews
  - `POST /api/employee-portal/self-assessment` - Submit self-assessment for performance reviews
  - `GET /api/employee-portal/notifications` - Employee-specific alerts and announcements

### Mobile Applications (Flutter)

**1. Sales Mobile App**
- **Features**: Lead capture, site measurement, geo-tagging, photo capture
- **Flutter Packages**: geolocator, image_picker, camera, google_maps_flutter
- **Offline Capabilities**: Hive database for lead data, customer information, basic estimation
- **Sync Strategy**: Background sync using WorkManager when connectivity restored

**2. QC Mobile App**
- **Features**: Inspection checklists, photo documentation, scoring
- **Flutter Packages**: camera, image_picker, flutter_form_builder, signature
- **Offline Capabilities**: Local SQLite for QC forms, inspection data, photos
- **Real-time Updates**: WebSocket connection for QC status updates to production system

**3. Service Mobile App**
- **Features**: Service booking, installation tracking, parts consumption
- **Flutter Packages**: geolocator, google_maps_flutter, camera, signature
- **Offline Capabilities**: Local storage for service history, warranty information, completion forms
- **GPS Integration**: Real-time location tracking for service calls with geofencing

**4. Store/Inventory Mobile App**
- **Features**: Barcode scanning, stock movements, cycle counting
- **Flutter Packages**: mobile_scanner, qr_code_scanner, camera
- **Offline Capabilities**: Local database for stock transaction recording, location updates
- **Barcode Support**: QR codes and traditional barcodes with batch scanning capability

**5. Production Mobile App**
- **Features**: Production order tracking, operation completion, scrap recording, material consumption
- **Flutter Packages**: camera, barcode_scanner, geolocator
- **Offline Capabilities**: Production data recording, material consumption tracking
- **Real-time Updates**: Production status updates and schedule changes

### Integration Interfaces

**External System Integrations:**
- **WhatsApp Business API**: Customer communication and automated notifications
- **Meta Business API**: Lead capture from Facebook/Instagram advertising campaigns
- **Google Ads API**: Lead capture from Google advertising with attribution tracking
- **Biometric Systems**: Hikvision attendance system integration for employee tracking
- **Banking APIs**: Payment gateway integration for customer payments and reconciliation
- **Email Services**: SMTP integration for email notifications and alerts
- **SMS Gateway**: SMS service integration for multi-channel notifications
- **Cloud Storage**: Integration with AWS S3/Azure Blob for file storage and backup

## Data Models

### Core Entity Relationships

```
Customer ||--o{ SalesOrder : places
SalesOrder ||--o{ ProductionOrder : generates
ProductionOrder ||--o{ BOMItem : requires
BOMItem }o--|| InventoryItem : references
InventoryItem ||--o{ StockTransaction : tracks
ProductionOrder ||--o{ QCInspection : undergoes
SalesOrder ||--o{ ServiceRequest : generates
Employee ||--o{ Attendance : records
Employee ||--o{ KPIMetric : measures
```

### Key Data Models

**Production Order**
```typescript
interface ProductionOrder {
  id: string;
  salesOrderId: string;
  productCode: string;
  quantity: number;
  scheduledStartDate: Date;
  scheduledEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  workCenterAllocations: WorkCenterAllocation[];
  bomRevision: string;
  priority: number;
  bufferDays: number;
}
```

**BOM (Bill of Materials)**
```typescript
interface BOM {
  id: string;
  productCode: string;
  revision: string;
  effectiveDate: Date;
  items: BOMItem[];
  engineeringChangeNumber?: string;
  approvedBy: string;
  status: 'DRAFT' | 'APPROVED' | 'OBSOLETE';
}

interface BOMItem {
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  scrapPercentage: number;
  operation: string;
  level: number;
}
```

**Inventory Item**
```typescript
interface InventoryItem {
  itemCode: string;
  description: string;
  category: 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED_GOOD' | 'CONSUMABLE';
  unit: string;
  standardCost: number;
  reorderLevel: number;
  safetyStock: number;
  leadTimeDays: number;
  batchTracked: boolean;
  locations: InventoryLocation[];
}

interface InventoryLocation {
  warehouseCode: string;
  rackCode: string;
  binCode: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  barcode: string;
}
```

**Quality Control Inspection**
```typescript
interface QCInspection {
  id: string;
  productionOrderId: string;
  stage: 'CUTTING' | 'FABRICATION' | 'COATING' | 'ASSEMBLY' | 'DISPATCH' | 'INSTALLATION';
  inspectorId: string;
  inspectionDate: Date;
  checklist: QCChecklistItem[];
  overallScore: number;
  status: 'PASSED' | 'FAILED' | 'REWORK_REQUIRED';
  photos: string[];
  customerSpecificRequirements?: string[];
  reworkOrderId?: string;
}

interface QCChecklistItem {
  checkpointId: string;
  description: string;
  expectedValue: string;
  actualValue: string;
  status: 'PASS' | 'FAIL' | 'NA';
  photos: string[];
  comments?: string;
}
```

**Service Request**
```typescript
interface ServiceRequest {
  id: string;
  customerId: string;
  salesOrderId?: string;
  type: 'INSTALLATION' | 'MAINTENANCE' | 'REPAIR' | 'WARRANTY_CLAIM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scheduledDate: Date;
  assignedTechnicianId: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  location: GeoLocation;
  amcContractId?: string;
  warrantyInfo?: WarrantyInfo;
  partsConsumed: PartsConsumption[];
  completionPhotos: string[];
  customerSignature?: string;
}
```

**Employee KPI**
```typescript
interface EmployeeKPI {
  employeeId: string;
  period: string; // YYYY-MM format
  metrics: KPIMetric[];
  overallScore: number;
  targetAchievement: number;
  ranking: number;
  appraisalEligible: boolean;
}

interface KPIMetric {
  metricId: string;
  metricName: string;
  targetValue: number;
  actualValue: number;
  weightage: number;
  score: number;
  jobDescriptionReference: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Manufacturing Properties

**Property 1: Sales Order to Production Order Generation**
*For any* confirmed sales order with valid product specifications, the system should automatically generate a production order with calculated start and end dates based on available capacity routing
**Validates: Requirements 1.1**

**Property 2: Capacity Constraint Validation**
*For any* production schedule, no machine or operator should be allocated beyond their available capacity during any time period
**Validates: Requirements 1.3**

**Property 3: Delivery Date Calculation Consistency**
*For any* order-to-delivery calculation, the computed delivery date should always include configured buffer days and material lead times
**Validates: Requirements 1.4**

**Property 4: BOM Change Propagation**
*For any* multi-level BOM revision, all affected production orders should be updated and maintain proper revision control with engineering change tracking
**Validates: Requirements 1.5**

### Procurement Properties

**Property 5: Automatic Purchase Requisition Generation**
*For any* material validation that detects stock-out conditions, the system should automatically trigger purchase requisitions for the required quantities
**Validates: Requirements 2.1**

**Property 6: RFQ Comparison Completeness**
*For any* RFQ process, vendor quote comparisons should include price, delivery time, and quality rating analysis for all responding vendors
**Validates: Requirements 2.2**

**Property 7: Purchase Order Approval Routing**
*For any* purchase order requiring approval, the system should route it through the correct approval hierarchy based on configured value thresholds
**Validates: Requirements 2.3**

**Property 8: GRN-QC-Stock Update Sequence**
*For any* material receipt through GRN, stock levels should only be updated after successful QC process validation
**Validates: Requirements 2.4**

**Property 9: Inter-branch Transfer Audit Trail**
*For any* inter-branch stock transfer, the system should maintain complete documentation and tracking throughout the transfer workflow
**Validates: Requirements 2.5**

### Inventory Properties

**Property 10: Location Assignment and Barcode Generation**
*For any* received material, the system should assign specific rack-bin locations and generate unique barcode or QR code labels
**Validates: Requirements 3.1**

**Property 11: Order-wise Material Segregation**
*For any* material allocation to orders, materials should be properly segregated by rack and bin locations with clear identification
**Validates: Requirements 3.2**

**Property 12: Stock Movement Audit Trail**
*For any* stock movement across warehouses, the system should create complete audit trails for raw materials, semi-finished goods, and finished goods
**Validates: Requirements 3.3**

**Property 13: Safety Stock Alert and PR Generation**
*For any* inventory item that breaches safety stock or minimum levels, the system should generate alerts and automatically trigger purchase requisitions
**Validates: Requirements 3.4**

**Property 14: Batch Tracking and Expiry Management**
*For any* batch-tracked item (coating materials, consumables, TATA steel), the system should maintain complete traceability and expiry date management
**Validates: Requirements 3.5**

### Sales Properties

**Property 15: External Lead Source Attribution**
*For any* lead captured from Meta or Google advertising platforms, the system should create lead records with proper source tracking and attribution
**Validates: Requirements 4.1**

**Property 16: Geo-tagged Measurement Documentation**
*For any* site measurement performed, the system should capture geo-location tags and photo documentation as mandatory requirements
**Validates: Requirements 4.2**

**Property 17: Comprehensive Pricing Calculation**
*For any* estimation engine calculation, the computed pricing should include all components: size, coating type, hardware specifications, and labor requirements
**Validates: Requirements 4.3**

**Property 18: Discount Approval Workflow Routing**
*For any* estimate requiring discount approval, the system should route it through the configured approval workflow hierarchy based on discount thresholds
**Validates: Requirements 4.4**

**Property 19: Sales Order Conversion Validation**
*For any* sales order converted to production order, the system should validate material availability and automatically update production schedules
**Validates: Requirements 4.5**

### Quality Control Properties

**Property 20: Stage-specific QC Checklist Presentation**
*For any* production order reaching QC checkpoints, the system should present the correct stage-specific checklist for cutting, fabrication, coating, assembly, dispatch, or installation
**Validates: Requirements 5.1**

**Property 21: QC Inspection Data Completeness**
*For any* QC inspection performed, the system should capture both photos and scoring data for each checkpoint as mandatory requirements
**Validates: Requirements 5.2**

**Property 22: QC Failure Rework Generation**
*For any* QC inspection that fails, the system should automatically generate rework job cards and update production schedules accordingly
**Validates: Requirements 5.3**

**Property 23: Customer Requirement Embedding**
*For any* order with customer-specific requirements, those requirements should be embedded in all relevant QC forms and checklists
**Validates: Requirements 5.4**

**Property 24: QC Report Delivery Linking**
*For any* final delivery, the system should link all related QC reports to the delivery documentation for complete traceability
**Validates: Requirements 5.5**

### Employee Self-Service Properties

**Property 25: Employee Portal Access Control**
*For any* employee accessing the self-service portal, the system should only display information and allow actions appropriate to their role and permissions
**Validates: Requirements 15.1**

**Property 26: Leave Request Approval Routing**
*For any* leave request submitted through the employee portal, the system should route it through the correct approval hierarchy based on leave type and employee level
**Validates: Requirements 15.3**

**Property 27: Payroll Data Security**
*For any* employee accessing payroll information, the system should only display their own salary data and maintain complete confidentiality
**Validates: Requirements 15.4**

**Property 28: Performance Review Completeness**
*For any* performance review cycle, employees should be able to complete self-assessments and view their KPI metrics with proper validation
**Validates: Requirements 15.5**

## Error Handling

### Error Categories and Strategies

**1. Business Logic Errors**
- **Validation Errors**: Input validation failures, business rule violations
- **Strategy**: Return structured error responses with specific field-level messages
- **Example**: Invalid BOM structure, insufficient stock for production

**2. Integration Errors**
- **External API Failures**: WhatsApp API, Meta API, Google API timeouts or errors
- **Strategy**: Implement circuit breaker pattern with exponential backoff retry
- **Fallback**: Queue messages for later processing, notify administrators

**3. Data Consistency Errors**
- **Concurrent Modification**: Multiple users updating same records
- **Strategy**: Optimistic locking with version control, conflict resolution workflows
- **Example**: Stock allocation conflicts, production schedule overlaps

**4. System Errors**
- **Database Failures**: Connection timeouts, query failures
- **Strategy**: Connection pooling, automatic failover, transaction rollback
- **Monitoring**: Real-time alerts for system health issues

**5. Mobile Offline Errors**
- **Sync Conflicts**: Data modified both online and offline
- **Strategy**: Last-write-wins with conflict detection, manual resolution UI
- **Data Integrity**: Validate offline data before sync, maintain local transaction logs

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    requestId: string;
  };
}
```

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Testing Requirements:**
- Unit tests verify specific examples, edge cases, and error conditions
- Integration tests verify component interactions and API contracts
- Unit tests cover concrete scenarios and business logic validation
- Target coverage: 80% code coverage for critical business logic

**Property-Based Testing Requirements:**
- Property tests verify universal properties that should hold across all inputs
- Each correctness property must be implemented as a property-based test
- Property tests should run a minimum of 100 iterations per test
- Property tests complement unit tests by testing general correctness across input ranges

### Testing Framework Selection

**Backend Testing (Node.js/TypeScript):**
- **Property-Based Testing Library**: fast-check for TypeScript
- **Unit Testing**: Jest with Supertest for API testing
- **Integration Testing**: Testcontainers for database testing
- **Mocking**: Jest mocks for external service dependencies

**Frontend Testing (React/TypeScript):**
- **Unit Testing**: Jest with React Testing Library
- **Component Testing**: Storybook for component isolation
- **E2E Testing**: Playwright for critical user workflows
- **Property Testing**: fast-check for complex form validation

**Mobile Testing (Flutter):**
- **Unit Testing**: Flutter Test framework
- **Widget Testing**: Flutter widget testing for UI components
- **Integration Testing**: Flutter integration tests for app flows
- **Property Testing**: Dart test with custom property generators

### Property-Based Test Implementation

Each property-based test must:
1. Be tagged with a comment referencing the design document property
2. Use the format: `**Feature: steel-manufacturing-erp, Property {number}: {property_text}**`
3. Run minimum 100 iterations with randomized inputs
4. Generate realistic test data that respects business constraints
5. Validate the universal property holds across all generated inputs

### Test Data Strategy

**Test Data Generation:**
- **Realistic Generators**: Create generators that produce business-valid data
- **Edge Case Coverage**: Include boundary conditions, empty sets, maximum values
- **Constraint Respect**: Ensure generated data respects business rules and relationships
- **Deterministic Seeds**: Use fixed seeds for reproducible test failures

**Test Environment:**
- **Isolated Databases**: Each test suite uses isolated database instances
- **Mock External Services**: Mock WhatsApp, Meta, Google APIs for consistent testing
- **Test Data Cleanup**: Automatic cleanup after test execution
- **Performance Testing**: Load testing for critical workflows with realistic data volumes

**Engineering Change Management**
```typescript
interface EngineeringChange {
  id: string;
  changeNumber: string;
  description: string;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  effectiveDate: Date;
  affectedBOMs: string[];
  affectedProductionOrders: string[];
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IMPLEMENTED' | 'CANCELLED';
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Multi-Branch Operations**
```typescript
interface Branch {
  id: string;
  code: string;
  name: string;
  address: Address;
  contactInfo: ContactInfo;
  warehouses: Warehouse[];
  employees: Employee[];
  isActive: boolean;
  regionCode: 'KERALA' | 'TAMIL_NADU';
}

interface Warehouse {
  id: string;
  branchId: string;
  code: string;
  name: string;
  type: 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED_GOODS' | 'MIXED';
  racks: Rack[];
  isActive: boolean;
}

interface Rack {
  id: string;
  warehouseId: string;
  code: string;
  bins: Bin[];
  capacity: number;
}

interface Bin {
  id: string;
  rackId: string;
  code: string;
  barcode: string;
  capacity: number;
  currentStock: number;
  reservedStock: number;
}
```

**Lead Management and CRM**
```typescript
interface Lead {
  id: string;
  source: 'META' | 'GOOGLE' | 'DIRECT' | 'REFERRAL' | 'WHATSAPP';
  sourceId?: string; // External lead ID from Meta/Google
  customerInfo: CustomerInfo;
  requirements: ProductRequirement[];
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'QUOTED' | 'WON' | 'LOST';
  assignedTo: string;
  estimatedValue: number;
  probability: number;
  expectedCloseDate: Date;
  interactions: CustomerInteraction[];
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerInteraction {
  id: string;
  type: 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'SITE_VISIT';
  description: string;
  employeeId: string;
  timestamp: Date;
  attachments?: string[];
  geoLocation?: GeoLocation;
}
```

**Estimation and Pricing**
```typescript
interface Estimate {
  id: string;
  leadId?: string;
  customerId: string;
  items: EstimateItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  validUntil: Date;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  approvalWorkflow?: ApprovalWorkflow;
  createdBy: string;
  createdAt: Date;
}

interface EstimateItem {
  productCode: string;
  description: string;
  dimensions: Dimensions;
  coatingType: string;
  hardwareSpecs: HardwareSpecification[];
  laborHours: number;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  sellingPrice: number;
  margin: number;
}

interface Dimensions {
  length: number;
  width: number;
  height?: number;
  thickness: number;
  unit: 'MM' | 'CM' | 'M' | 'INCH' | 'FEET';
}
```

**SLA and Alert Management**
```typescript
interface SLAConfiguration {
  id: string;
  module: 'LEADS' | 'PRODUCTION' | 'QC' | 'SERVICE' | 'PROCUREMENT';
  processType: string;
  responseTime: number; // in hours
  resolutionTime: number; // in hours
  escalationLevels: EscalationLevel[];
  isActive: boolean;
}

interface EscalationLevel {
  level: number;
  roleId: string;
  escalationTime: number; // in hours
  notificationChannels: ('EMAIL' | 'SMS' | 'WHATSAPP' | 'APP')[];
}

interface Alert {
  id: string;
  type: 'SLA_BREACH' | 'STOCK_OUT' | 'QC_FAILURE' | 'SYSTEM_ERROR';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  entityId: string;
  entityType: string;
  assignedTo: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalationHistory: EscalationHistory[];
}
```

**Approval Workflows**
```typescript
interface ApprovalWorkflow {
  id: string;
  workflowType: 'DISCOUNT' | 'PURCHASE_ORDER' | 'ENGINEERING_CHANGE' | 'EXPENSE';
  currentLevel: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvalLevels: ApprovalLevel[];
  createdAt: Date;
  completedAt?: Date;
}

interface ApprovalLevel {
  level: number;
  approverRole: string;
  approverId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  approvedAt?: Date;
  thresholdAmount?: number;
}
```

**Geo-Location and Field Operations**
```typescript
interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp: Date;
}

interface SiteMeasurement {
  id: string;
  leadId?: string;
  customerId: string;
  location: GeoLocation;
  measurements: MeasurementData[];
  photos: string[];
  notes: string;
  measuredBy: string;
  measuredAt: Date;
  verified: boolean;
}

interface MeasurementData {
  itemType: 'DOOR' | 'WINDOW' | 'FRAME';
  dimensions: Dimensions;
  specifications: Record<string, any>;
  photos: string[];
}
```

**Role-Based Access Control (RBAC)**
```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  module: 'MANUFACTURING' | 'SALES' | 'INVENTORY' | 'PROCUREMENT' | 'QC' | 'SERVICE' | 'FINANCE' | 'HR' | 'BI' | 'ADMIN';
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'EXPORT';
  resource: string; // Specific resource within module
  conditions?: AccessCondition[]; // Additional conditions like branch, department
}

interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  branchId?: string; // Branch-specific access
  departmentId?: string; // Department-specific access
  isActive: boolean;
  lastLogin?: Date;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AccessCondition {
  field: string; // e.g., 'branchId', 'departmentId', 'amount'
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'NOT_IN';
  value: any;
}
```

**RBAC Implementation Details:**

**Predefined Roles:**
- **Super Admin**: Full system access across all modules and branches
- **Branch Manager**: Full access within assigned branch
- **Production Manager**: Manufacturing, QC, and inventory access
- **Sales Manager**: Sales, CRM, and customer portal access
- **Finance Manager**: Finance, accounting, and reporting access
- **HR Manager**: HR, payroll, and employee management access
- **Warehouse Manager**: Inventory and warehouse operations access
- **QC Inspector**: Quality control and inspection access
- **Service Technician**: Service and installation access
- **Sales Executive**: Lead management and order creation access
- **Store Keeper**: Inventory transactions and stock movements
- **Accountant**: Financial transactions and basic reporting
- **Employee**: Basic profile and attendance access

**Permission Matrix:**
```
Module          | Super | Branch | Prod | Sales | Finance | HR | Warehouse | QC | Service | Sales Exec | Store | Account | Employee
                | Admin | Mgr    | Mgr  | Mgr   | Mgr     | Mgr| Mgr       | Insp| Tech   | utive      | Keeper| ant     |
Manufacturing   | CRUD  | CRUD   | CRUD | R     | R       | -  | R         | RU  | -      | R          | R     | R       | -
Sales/CRM       | CRUD  | CRUD   | R    | CRUD  | R       | -  | R         | -   | R      | CRU        | -     | R       | -
Inventory       | CRUD  | CRUD   | CRUD | R     | R       | -  | CRUD      | R   | RU     | R          | CRUD  | R       | -
Procurement     | CRUD  | CRUD   | CRUD | R     | RU      | -  | RU        | -   | -      | R          | R     | R       | -
Quality Control | CRUD  | CRUD   | RU   | R     | R       | -  | R         | CRUD| R      | R          | -     | R       | -
Service         | CRUD  | CRUD   | R    | RU    | R       | -  | R         | -   | CRUD   | R          | -     | R       | -
Finance         | CRUD  | CRUD   | R    | R     | CRUD    | R  | R         | -   | R      | R          | -     | RU      | -
HR/Payroll      | CRUD  | CRUD   | R    | R     | R       | CRUD| R        | -   | R      | R          | -     | -       | R
Employee Portal | CRUD  | CRUD   | -    | -     | -       | RU | -         | -   | -      | -          | -     | -       | RU*
BI/Reports      | CRUD  | CRUD   | R    | R     | R       | R  | R         | R   | R      | R          | R     | R       | R
Admin/Security  | CRUD  | RU     | -    | -     | -       | -  | -         | -   | -      | -          | -     | -       | -

Legend: C=Create, R=Read, U=Update, D=Delete, A=Approve, -=No Access, *=Own Data Only
```

**Employee Portal Specific Permissions:**
- **All Employees**: Can access their own profile, attendance, leave requests, payroll, and performance data
- **HR Managers**: Can view and manage employee portal configurations and assist with employee queries
- **Branch Managers**: Can view employee portal usage and approve leave requests through the portal
- **Data Isolation**: Employees can only access their own personal data, never other employees' information

**Branch and Department Level Access:**
- Users can be restricted to specific branches (Kerala/Tamil Nadu)
- Department-level access within branches
- Cross-branch access for senior management roles
- Data isolation based on branch assignments

**Dynamic Permission Evaluation:**
- Real-time permission checking for all API endpoints
- Context-aware permissions (e.g., users can only modify their own records)
- Time-based access restrictions (e.g., payroll access only during payroll periods)
- Amount-based restrictions (e.g., approval limits based on user role)
**Employee Self-Service Portal**
```typescript
interface EmployeeProfile {
  employeeId: string;
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  emergencyContacts: EmergencyContact[];
  bankDetails: BankDetails;
  documents: EmployeeDocument[];
  preferences: EmployeePreferences;
  lastUpdated: Date;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'COMP_OFF';
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
  comments?: string;
  attachments?: string[];
}

interface LeaveBalance {
  employeeId: string;
  year: number;
  leaveType: string;
  allocated: number;
  used: number;
  pending: number;
  available: number;
  carryForward: number;
}

interface SalarySlip {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM format
  basicSalary: number;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  grossSalary: number;
  netSalary: number;
  pfContribution: number;
  esiContribution: number;
  taxDeducted: number;
  generatedDate: Date;
  status: 'DRAFT' | 'FINALIZED' | 'PAID';
}

interface SalaryComponent {
  componentType: string;
  componentName: string;
  amount: number;
  isStatutory: boolean;
}

interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewPeriod: string; // YYYY-MM format
  selfAssessment?: SelfAssessment;
  managerAssessment?: ManagerAssessment;
  kpiScores: KPIScore[];
  overallRating: number;
  status: 'PENDING_SELF' | 'PENDING_MANAGER' | 'COMPLETED';
  reviewDate?: Date;
  nextReviewDate: Date;
}

interface SelfAssessment {
  achievements: string;
  challenges: string;
  goals: string;
  trainingNeeds: string;
  feedback: string;
  submittedDate: Date;
}

interface EmployeeNotification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  type: 'ANNOUNCEMENT' | 'LEAVE_STATUS' | 'PAYROLL' | 'PERFORMANCE' | 'POLICY' | 'BIRTHDAY' | 'WORK_ANNIVERSARY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isRead: boolean;
  createdDate: Date;
  expiryDate?: Date;
  actionRequired?: boolean;
  actionUrl?: string;
}
```