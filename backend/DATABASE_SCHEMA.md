# Steel Manufacturing ERP - Database Schema Documentation

## Overview

This document describes the comprehensive database schema for the Steel Manufacturing ERP system. The schema is designed to support multi-branch operations with complete audit trails, role-based access control, and comprehensive business process management.

## Database Technology

- **Development**: SQLite (file-based database for local development)
- **Production**: PostgreSQL (recommended for production deployment)
- **ORM**: Prisma with TypeScript support

## Core Schema Features

### 1. Multi-Branch Support
- **Branch Management**: Support for multiple branches across Kerala and Tamil Nadu
- **Warehouse Management**: Multiple warehouses per branch with rack/bin location tracking
- **Data Isolation**: Branch-level data access control and reporting

### 2. Role-Based Access Control (RBAC)
- **Granular Permissions**: Module-level and action-level permissions
- **Predefined Roles**: Super Admin, Branch Manager, Production Manager, Sales Executive, Store Keeper, QC Inspector
- **Branch-Level Access**: Users can have different roles in different branches

### 3. Audit Trail and Soft Delete
- **Complete Audit Logging**: All CRUD operations tracked with user, timestamp, and IP
- **Soft Delete**: Records marked as deleted but preserved for audit purposes
- **Change Tracking**: Old and new values stored for all updates

### 4. Inventory Management
- **Multi-Level Storage**: Warehouse → Rack → Bin hierarchy
- **Barcode Tracking**: Unique barcode generation for all inventory items
- **Batch/Lot Tracking**: Expiry management for coating materials and TATA steel
- **Order-wise Allocation**: Material segregation by sales orders

### 5. Manufacturing Management
- **Multi-Level BOM**: Hierarchical bill of materials with revision control
- **Engineering Change Management**: BOM versioning and approval workflows
- **Capacity-Based Scheduling**: Work center and operation scheduling
- **Scrap Tracking**: Operation-wise scrap recording with costing

## Key Entity Relationships

```
Branch (1) → (N) Warehouse (1) → (N) Rack (1) → (N) Bin
Branch (1) → (N) Employee
Branch (1) → (N) Customer
Branch (1) → (N) Supplier

Customer (1) → (N) Lead (1) → (N) Estimate (1) → (1) SalesOrder
SalesOrder (1) → (N) ProductionOrder
ProductionOrder (1) → (N) QCInspection
ProductionOrder (1) → (N) ScrapRecord

Product (1) → (N) BOM (1) → (N) BOMItem
BOM (1) → (N) ProductionOrder

InventoryItem (1) → (N) StockTransaction
InventoryItem (1) → (N) BatchRecord

User (1) → (N) UserRole (N) → (1) Role
Role (1) → (N) RolePermission (N) → (1) Permission
```

## Default Data Seeded

### Branches
- **KL001**: Kochi Branch (Kerala)
- **TN001**: Chennai Branch (Tamil Nadu)

### Roles and Permissions
- **SUPER_ADMIN**: Full system access
- **BRANCH_MANAGER**: Branch-level management access
- **PRODUCTION_MANAGER**: Manufacturing and QC access
- **SALES_EXECUTIVE**: Sales and service access
- **STORE_KEEPER**: Inventory management access
- **QC_INSPECTOR**: Quality control access

### Default Admin User
- **Email**: admin@steel-erp.com
- **Password**: admin123
- **Role**: Super Admin

### Work Centers
- Cutting Station, CNC Machine, Bending Station, Welding Station, Coating Station, Assembly Station

### Sample Products
- Standard Steel Door (DOOR-001)
- Standard Steel Window (WINDOW-001)

## Database Files

- **Schema**: `backend/prisma/schema.prisma`
- **Migrations**: `backend/prisma/migrations/`
- **Seed Data**: `backend/prisma/seed.ts`
- **Database File**: `backend/dev.db` (SQLite for development)

## Key Features Implemented

### 1. Comprehensive Entity Coverage
✅ Branch and warehouse management with rack/bin tracking
✅ User management with RBAC and granular permissions
✅ Employee management with attendance and KPI tracking
✅ Customer and supplier management
✅ Product catalog with multi-level BOM support
✅ Manufacturing with production orders and operations
✅ Inventory with batch tracking and barcode support
✅ Sales management with leads, estimates, and orders
✅ Procurement with RFQ, PO, and GRN workflows
✅ Quality control with multi-stage inspections
✅ Service management with AMC and warranty tracking
✅ Finance management with invoice and payment tracking
✅ HR management with payroll and leave management
✅ Alert and SLA management with escalation
✅ Comprehensive audit logging

### 2. Data Integrity Features
✅ Foreign key constraints for referential integrity
✅ Unique constraints for business rules
✅ Soft delete functionality across all entities
✅ Audit trail for all data changes
✅ Optimistic locking support through updatedAt fields

### 3. Performance Optimization
✅ Strategic indexes on frequently queried fields
✅ Composite indexes for complex queries
✅ Efficient relationship modeling
✅ Optimized for both read and write operations

### 4. SQLite Adaptations
✅ JSON fields converted to String fields for SQLite compatibility
✅ Cascade delete constraints adapted for SQLite
✅ Optimized for development environment

## Usage Commands

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Requirements Validation

This database schema addresses the following requirements:

- **Requirement 1.5**: Multi-level BOM structure with revision control ✅
- **Requirement 3.1**: Rack/bin location mapping and barcode tracking ✅
- **Requirement 3.3**: Comprehensive audit trail functionality ✅
- **Requirement 3.5**: Batch/lot tracking with expiry management ✅
- **Requirement 12.1**: Role-based access control with granular permissions ✅
- **Requirement 12.2**: User management and authentication ✅
- **Requirement 13.3**: Engineering change management ✅
- **Requirement 21.1**: Multi-branch operations support ✅
- **Requirement 21.3**: Branch-level access control and reporting ✅

## Next Steps

1. **API Development**: Create REST APIs for all entities
2. **Business Logic**: Implement business rules and validations
3. **Integration**: Connect with external APIs (WhatsApp, Meta, Google)
4. **Testing**: Implement comprehensive test coverage
5. **Performance**: Optimize queries and add caching
6. **Production**: Migrate to PostgreSQL for production deployment