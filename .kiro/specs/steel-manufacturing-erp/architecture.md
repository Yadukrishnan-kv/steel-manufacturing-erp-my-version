# Steel Manufacturing ERP - Architecture Design Document

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Principles](#architecture-principles)
4. [System Architecture](#system-architecture)
5. [Technology Stack](#technology-stack)
6. [Data Architecture](#data-architecture)
7. [Security Architecture](#security-architecture)
8. [Integration Architecture](#integration-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Performance & Scalability](#performance--scalability)
11. [Monitoring & Observability](#monitoring--observability)
12. [Disaster Recovery](#disaster-recovery)

## Executive Summary

The Steel Manufacturing ERP system is designed as a comprehensive enterprise solution for premium steel door, window, and frame manufacturing operations. The architecture follows a **modular monolith** approach with clear domain boundaries, providing the benefits of microservices organization while maintaining the simplicity of a single deployable unit.

### Key Architectural Decisions
- **Modular Monolith**: Single application with clear module boundaries
- **Domain-Driven Design**: Business-focused module organization
- **API-First Design**: RESTful APIs for all client interactions
- **Multi-Tenant**: Branch-level data isolation within single database
- **Mobile-First**: Offline-capable Flutter applications for field operations
- **Cloud-Native**: Containerized deployment with horizontal scaling capability

## System Overview

### Business Context
- **Industry**: Premium steel door, window, and frame manufacturing
- **Operations**: Multi-branch operations across Kerala and Tamil Nadu
- **Users**: 200+ employees across manufacturing, sales, service, and administration
- **Transactions**: 1000+ orders/month, 5000+ inventory transactions/day
- **Integration**: External APIs (WhatsApp, Meta, Google, Hikvision biometrics)

### System Scope
The ERP system encompasses:
- Manufacturing & Production Planning
- Sales & Customer Relationship Management
- Inventory & Warehouse Management
- Procurement & Supplier Management
- Quality Control & Inspection
- Service & Installation Management
- Finance & Accounting
- Human Resources & Payroll
- Business Intelligence & Reporting
- Customer & Employee Self-Service Portals

## Architecture Principles

### 1. Domain-Driven Design (DDD)
- **Bounded Contexts**: Clear boundaries between business domains
- **Ubiquitous Language**: Consistent terminology across business and technical teams
- **Domain Models**: Rich domain objects that encapsulate business logic
- **Anti-Corruption Layers**: Protect domain integrity during external integrations

### 2. Separation of Concerns
- **Layered Architecture**: Presentation, Application, Domain, Infrastructure layers
- **Single Responsibility**: Each module has a single, well-defined purpose
- **Loose Coupling**: Minimal dependencies between modules
- **High Cohesion**: Related functionality grouped together

### 3. API-First Design
- **Contract-First**: API contracts defined before implementation
- **Versioning Strategy**: Backward-compatible API evolution
- **Documentation**: OpenAPI specifications for all endpoints
- **Consistency**: Uniform API patterns across all modules

### 4. Security by Design
- **Zero Trust**: Verify every request regardless of source
- **Principle of Least Privilege**: Minimal required permissions
- **Defense in Depth**: Multiple security layers
- **Data Protection**: Encryption at rest and in transit

### 5. Scalability & Performance
- **Horizontal Scaling**: Scale by adding more instances
- **Caching Strategy**: Multi-level caching for performance
- **Database Optimization**: Proper indexing and query optimization
- **Asynchronous Processing**: Non-blocking operations where possible

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (Nginx)                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    API Gateway Layer                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Authentication & Authorization Middleware              │   │
│  │  Rate Limiting & Request Validation                     │   │
│  │  Logging & Monitoring                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                 Application Layer                               │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │Manufacturing│    Sales    │  Inventory  │   Finance   │     │
│  │   Module    │   Module    │   Module    │   Module    │     │
│  └─────────────┼─────────────┼─────────────┼─────────────┘     │
│  ┌─────────────┼─────────────┼─────────────┼─────────────┐     │
│  │     QC      │   Service   │     HR      │     BI      │     │
│  │   Module    │   Module    │   Module    │   Module    │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                   Domain Layer                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Domain Models & Business Logic                         │   │
│  │  Domain Services & Repositories                         │   │
│  │  Business Rules & Validations                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                Infrastructure Layer                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │  Database   │   External  │    File     │   Caching   │     │
│  │  (PostgreSQL│ Integrations│   Storage   │   (Memory)  │     │
│  │     )       │             │             │             │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Module Architecture

Each business module follows a consistent internal architecture:

```
Module (e.g., Manufacturing)
├── Controllers/          # HTTP request handlers
├── Services/            # Application services & business logic
├── Models/              # Domain models & entities
├── Repositories/        # Data access layer
├── DTOs/               # Data transfer objects
├── Validators/         # Input validation
├── Middleware/         # Module-specific middleware
└── Tests/              # Unit & integration tests
```

### Client Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │    Web      │   Customer  │  Employee   │   Mobile    │     │
│  │ Dashboard   │   Portal    │   Portal    │    Apps     │     │
│  │  (React)    │  (React)    │  (React)    │ (Flutter)   │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS/REST APIs
┌─────────────────────▼───────────────────────────────────────────┐
│                    ERP Backend                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend Technologies

**Runtime & Framework:**
- **Node.js 18+**: JavaScript runtime with excellent performance
- **TypeScript 5.0+**: Type safety and enhanced developer experience
- **Express.js**: Lightweight, flexible web framework
- **Helmet**: Security middleware for HTTP headers

**Database & ORM:**
- **PostgreSQL 15+**: Robust relational database with JSON support
- **Prisma**: Type-safe ORM with excellent TypeScript integration
- **Connection Pooling**: pgBouncer for connection management

**Authentication & Security:**
- **JWT**: Stateless authentication tokens
- **bcrypt**: Password hashing
- **express-session**: Session management
- **CORS**: Cross-origin resource sharing configuration

**Validation & Serialization:**
- **Zod**: Runtime type validation and parsing
- **class-transformer**: Object transformation
- **class-validator**: Decorator-based validation

### Frontend Technologies

**Web Applications:**
- **React 18+**: Component-based UI library
- **TypeScript**: Type safety for frontend code
- **Material-UI (MUI)**: Comprehensive component library
- **Redux Toolkit**: Predictable state management
- **RTK Query**: Data fetching and caching
- **React Router v6**: Client-side routing
- **React Hook Form**: Performant form handling
- **Recharts**: Data visualization and charts

**Mobile Applications:**
- **Flutter 3.10+**: Cross-platform mobile framework
- **Dart**: Programming language for Flutter
- **Bloc/Cubit**: State management pattern
- **Dio**: HTTP client for API communication
- **Hive**: Lightweight local database
- **GoRouter**: Declarative routing
- **Material Design 3**: UI components

### Development & Deployment

**Development Tools:**
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **Docker**: Containerization
- **Docker Compose**: Multi-container development

**CI/CD & Deployment:**
- **GitHub Actions**: Continuous integration
- **Docker**: Production containerization
- **Nginx**: Reverse proxy and load balancer
- **Let's Encrypt**: SSL certificate management
- **PM2**: Process management for Node.js

## Data Architecture

### Database Design Principles

**1. Normalization:**
- Third Normal Form (3NF) for transactional data
- Denormalization for reporting and analytics
- Proper foreign key relationships

**2. Multi-Tenancy:**
- Branch-level data isolation using branch_id
- Row-level security for sensitive data
- Shared schema with tenant filtering

**3. Audit & Compliance:**
- Audit trails for all critical operations
- Soft deletes with deleted_at timestamps
- Created/updated timestamps on all entities

**4. Performance Optimization:**
- Strategic indexing on frequently queried columns
- Composite indexes for multi-column queries
- Partial indexes for filtered queries

### Database Schema Overview

```sql
-- Core Business Entities
branches (id, code, name, region, address, contact_info)
users (id, username, email, branch_id, roles, is_active)
customers (id, name, contact_info, branch_id, created_at)

-- Manufacturing
products (id, code, name, category, specifications)
bom (id, product_id, revision, effective_date, status)
bom_items (id, bom_id, item_code, quantity, level, operation)
production_orders (id, sales_order_id, product_id, quantity, status, dates)
work_centers (id, name, capacity, branch_id, is_active)

-- Inventory
inventory_items (id, code, description, category, unit, branch_id)
warehouses (id, branch_id, name, type, is_active)
racks (id, warehouse_id, code, capacity)
bins (id, rack_id, code, barcode, capacity)
stock_transactions (id, item_id, transaction_type, quantity, location)

-- Sales & CRM
leads (id, source, customer_info, status, assigned_to, branch_id)
estimates (id, lead_id, items, total_amount, status, valid_until)
sales_orders (id, customer_id, items, total_amount, status, branch_id)

-- Quality Control
qc_inspections (id, production_order_id, stage, inspector_id, status)
qc_checklist_items (id, inspection_id, checkpoint, status, photos)

-- Service Management
service_requests (id, customer_id, type, priority, status, technician_id)
amc_contracts (id, customer_id, start_date, end_date, terms)

-- Finance
invoices (id, sales_order_id, amount, gst_amount, status, branch_id)
payments (id, invoice_id, amount, payment_method, status)

-- HR & Payroll
employees (id, employee_code, personal_info, branch_id, department_id)
attendance (id, employee_id, date, check_in, check_out, status)
leave_requests (id, employee_id, leave_type, dates, status)
salary_slips (id, employee_id, month, components, net_salary)
```

### Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   API       │───▶│  Business   │
│ Application │    │ Controller  │    │   Logic     │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Database  │◀───│ Repository  │◀───│   Domain    │
│ (PostgreSQL)│    │   Layer     │    │   Models    │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Security Architecture

### Authentication & Authorization

**1. Authentication Flow:**
```
Client Request → JWT Validation → User Verification → Role/Permission Check → API Access
```

**2. JWT Token Structure:**
```json
{
  "sub": "user_id",
  "username": "john.doe",
  "branch_id": "branch_001",
  "roles": ["production_manager"],
  "permissions": ["manufacturing:read", "manufacturing:write"],
  "exp": 1640995200,
  "iat": 1640908800
}
```

**3. Role-Based Access Control (RBAC):**
- Hierarchical role structure
- Granular permissions per module and action
- Branch and department-level access control
- Dynamic permission evaluation

### Security Layers

**1. Network Security:**
- HTTPS/TLS 1.3 for all communications
- Firewall rules restricting database access
- VPN access for administrative functions
- Rate limiting and DDoS protection

**2. Application Security:**
- Input validation and sanitization
- SQL injection prevention via ORM
- XSS protection through content security policy
- CSRF protection for state-changing operations

**3. Data Security:**
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Database connection encryption
- Sensitive data masking in logs

**4. API Security:**
- JWT token-based authentication
- API rate limiting per user/IP
- Request/response validation
- Audit logging for all API calls

### Security Monitoring

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Security  │───▶│   SIEM      │───▶│   Alert     │
│    Logs     │    │  Analysis   │    │  Management │
└─────────────┘    └─────────────┘    └─────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Audit     │    │ Threat      │    │ Incident    │
│   Trail     │    │ Detection   │    │ Response    │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Integration Architecture

### External System Integrations

**1. WhatsApp Business API:**
```
ERP System → WhatsApp API → Customer Notifications
          ← Delivery Status ←
```

**2. Meta Business API (Facebook/Instagram):**
```
Meta Ads → Lead Webhook → ERP Lead Management
```

**3. Google Ads API:**
```
Google Ads → API Polling → ERP Lead Import
```

**4. Hikvision Biometric System:**
```
Biometric Device → Local Server → ERP Attendance API
```

### Integration Patterns

**1. Webhook Pattern:**
- Real-time data synchronization
- Event-driven architecture
- Retry mechanisms for failed deliveries
- Signature verification for security

**2. API Polling Pattern:**
- Scheduled data synchronization
- Rate limiting compliance
- Incremental data fetching
- Error handling and recovery

**3. File-Based Integration:**
- Batch data processing
- CSV/Excel import/export
- Scheduled file transfers
- Data validation and cleansing

### API Design Standards

**1. RESTful Principles:**
- Resource-based URLs
- HTTP methods for operations
- Stateless communication
- Uniform interface

**2. Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

**3. Error Handling:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    Load Balancer                                │
│                   (Nginx + SSL)                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                 Application Tier                                │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │   App       │   App       │   App       │   App       │     │
│  │ Instance 1  │ Instance 2  │ Instance 3  │ Instance 4  │     │
│  │ (Docker)    │ (Docker)    │ (Docker)    │ (Docker)    │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                   Database Tier                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Primary                         │   │
│  │            (Read/Write Operations)                      │   │
│  └─────────────────────┬───────────────────────────────────┘   │
│                        │                                       │
│  ┌─────────────────────▼───────────────────────────────────┐   │
│  │              PostgreSQL Replica                         │   │
│  │             (Read-Only Operations)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Container Architecture

**Docker Configuration:**
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Docker Compose for Development:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/erp
    depends_on:
      - db
      
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=erp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
volumes:
  postgres_data:
```

### Scaling Strategy

**Horizontal Scaling:**
- Stateless application design
- Load balancer distribution
- Database connection pooling
- Session storage externalization

**Vertical Scaling:**
- CPU and memory optimization
- Database performance tuning
- Query optimization
- Caching implementation

## Performance & Scalability

### Performance Targets

**Response Time:**
- API responses: < 200ms (95th percentile)
- Database queries: < 100ms (average)
- Page load times: < 2 seconds
- Mobile app startup: < 3 seconds

**Throughput:**
- Concurrent users: 200+
- API requests: 1000 req/sec
- Database transactions: 5000 TPS
- File uploads: 100 MB/min

**Availability:**
- System uptime: 99.9%
- Planned maintenance: < 4 hours/month
- Recovery time: < 15 minutes
- Data backup: Daily with 30-day retention

### Caching Strategy

**1. Application-Level Caching:**
```javascript
// In-memory caching for frequently accessed data
const cache = new Map();

async function getCachedData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetchFromDatabase(key);
  cache.set(key, data);
  return data;
}
```

**2. Database Query Optimization:**
- Strategic indexing on frequently queried columns
- Query result caching
- Connection pooling
- Read replica for reporting queries

**3. Static Asset Caching:**
- CDN for static files
- Browser caching headers
- Gzip compression
- Image optimization

### Database Performance

**Indexing Strategy:**
```sql
-- Primary indexes for unique identification
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE UNIQUE INDEX idx_products_code ON products(code);

-- Composite indexes for multi-column queries
CREATE INDEX idx_sales_orders_customer_date ON sales_orders(customer_id, created_at);
CREATE INDEX idx_inventory_item_location ON inventory_items(item_code, warehouse_id);

-- Partial indexes for filtered queries
CREATE INDEX idx_active_employees ON employees(branch_id) WHERE is_active = true;
CREATE INDEX idx_pending_orders ON sales_orders(status) WHERE status = 'PENDING';
```

**Query Optimization:**
- Use of prepared statements
- Proper JOIN strategies
- LIMIT and OFFSET for pagination
- Aggregate query optimization

## Monitoring & Observability

### Logging Strategy

**1. Application Logs:**
```javascript
// Structured logging with Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**2. Audit Logging:**
- User actions and data changes
- API access and authentication events
- System configuration changes
- Security-related events

**3. Performance Monitoring:**
- Response time tracking
- Database query performance
- Memory and CPU usage
- Error rate monitoring

### Health Checks

**Application Health:**
```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      external_apis: await checkExternalAPIs(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  res.json(health);
});
```

**Database Health:**
```sql
-- Database connection and performance check
SELECT 
  'database' as component,
  CASE 
    WHEN COUNT(*) > 0 THEN 'healthy'
    ELSE 'unhealthy'
  END as status,
  COUNT(*) as active_connections
FROM pg_stat_activity 
WHERE state = 'active';
```

### Alerting & Notifications

**Alert Conditions:**
- Response time > 1 second
- Error rate > 5%
- Database connection failures
- Disk space > 80%
- Memory usage > 85%

**Notification Channels:**
- Email alerts for critical issues
- SMS for system outages
- Slack integration for team notifications
- Dashboard alerts for operators

## Disaster Recovery

### Backup Strategy

**1. Database Backups:**
```bash
# Daily full backup
pg_dump -h localhost -U postgres -d erp_production > backup_$(date +%Y%m%d).sql

# Continuous WAL archiving for point-in-time recovery
archive_command = 'cp %p /backup/wal_archive/%f'
```

**2. File System Backups:**
- Daily backup of uploaded files
- Configuration file backups
- Application code backups
- Log file archival

**3. Backup Verification:**
- Regular restore testing
- Backup integrity checks
- Recovery time testing
- Documentation updates

### Recovery Procedures

**1. Database Recovery:**
```bash
# Point-in-time recovery
pg_basebackup -h localhost -D /recovery/data -U postgres -v -P -W
# Restore to specific timestamp
recovery_target_time = '2024-01-15 10:30:00'
```

**2. Application Recovery:**
- Container image rollback
- Configuration restoration
- Service restart procedures
- Health check validation

**3. Recovery Testing:**
- Monthly disaster recovery drills
- Recovery time measurement
- Process documentation updates
- Team training and preparation

### Business Continuity

**1. High Availability:**
- Database replication
- Application clustering
- Load balancer redundancy
- Geographic distribution

**2. Failover Procedures:**
- Automatic database failover
- Application instance switching
- DNS updates for traffic routing
- User notification procedures

**3. Data Protection:**
- Regular backup verification
- Offsite backup storage
- Encryption of backup data
- Compliance with data retention policies

---

## Conclusion

This architecture design provides a robust, scalable, and secure foundation for the Steel Manufacturing ERP system. The modular monolith approach balances simplicity with maintainability, while the comprehensive security and monitoring strategies ensure reliable operation in a production environment.

The architecture supports the business requirements for multi-branch operations, real-time data processing, and integration with external systems, while providing the flexibility to evolve and scale as the business grows.

**Next Steps:**
1. Review and approve architecture design
2. Set up development environment
3. Begin implementation following the task plan
4. Establish monitoring and deployment pipelines
5. Conduct security and performance testing