# Frontend Menu Items to Backend API Mapping - Dependency-Based Implementation Order

## Overview
This document provides a complete mapping of frontend menu items to their corresponding backend APIs, organized by implementation dependencies and complexity. The menu structure has been reordered to facilitate easier development and testing.

---

## 🎯 **IMPLEMENTATION PHASES**

### **PHASE 1: FOUNDATION MODULES** ✅ (Complete - No Dependencies)
### **PHASE 2: CORE BUSINESS MODULES** (High Priority)  
### **PHASE 3: OPERATIONAL MODULES** (Medium Priority)
### **PHASE 4: SERVICE & SUPPORT MODULES** (Medium Priority)
### **PHASE 5: HR & EMPLOYEE MODULES** (Medium Priority)
### **PHASE 6: ANALYTICS & SYSTEM MODULES** (Low Priority)

---

## ⚙️ **PHASE 1: ADMINISTRATION MODULE** ✅ (Foundation Complete)

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Branch Management** | `/admin/branches` | `POST /admin/branches`<br>`GET /admin/branches`<br>`PUT /admin/branches/:id` | 🔄 Partial Frontend | 🔥 Critical |
| **User Management** | `/admin/users` | `POST /admin/users`<br>`GET /admin/users`<br>`PUT /admin/users/:id` | 🔄 Partial Frontend | 🔥 Critical |
| **Roles & Permissions** | `/admin/roles` | `GET /rbac/roles`<br>`POST /rbac/roles`<br>`GET /rbac/permissions`<br>`PUT /rbac/roles/:id` | ✅ Backend Ready | 🔥 Critical |

**Dependencies:** ❌ None (Foundation)  
**Used By:** All other modules (users, permissions, branches)  
**Implementation Order:** 1st (Foundation for everything)

---

## 🏭 **PHASE 1: MANUFACTURING MODULE** ✅ (Foundation Complete)

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Manufacturing Dashboard** | `/manufacturing` | `GET /manufacturing/dashboard`<br>`GET /manufacturing/production-orders`<br>`GET /manufacturing/schedule` | ✅ Complete | 🔥 High |
| **Work Center Management** | `/manufacturing/work-center-management` | `POST /manufacturing/work-centers`<br>`GET /manufacturing/work-centers`<br>`PUT /manufacturing/work-centers/:id` | ✅ Complete | 🔥 High |
| **BOM Management** | `/manufacturing/bom-management` | `POST /manufacturing/bom`<br>`GET /manufacturing/boms`<br>`GET /manufacturing/bom/:id`<br>`PUT /manufacturing/bom/engineering-change` | ✅ Complete | 🔥 High |
| **Production Orders** | `/manufacturing/production-orders` | `POST /manufacturing/production-orders`<br>`GET /manufacturing/production-orders`<br>`GET /manufacturing/production-orders/:id`<br>`PUT /manufacturing/production-orders/:id/status` | ✅ Complete | 🔥 High |
| **Material Consumption** | `/manufacturing/material-consumption` | `POST /manufacturing/material-consumption`<br>`GET /manufacturing/material-consumption` | ✅ Backend Ready | 🔶 Medium |
| **Scrap Tracking** | `/manufacturing/scrap-tracking` | `POST /manufacturing/scrap-tracking`<br>`GET /manufacturing/scrap-records` | ✅ Backend Ready | 🔶 Medium |
| **Production Schedule** | `/manufacturing/gantt-chart` | `GET /manufacturing/schedule`<br>`GET /manufacturing/production-orders` | ✅ Backend Ready | 🔥 High |
| **Engineering Changes** | `/manufacturing/engineering-changes` | `POST /manufacturing/engineering-changes`<br>`GET /manufacturing/engineering-changes`<br>`PUT /manufacturing/engineering-changes/:id` | ✅ Backend Ready | 🔶 Medium |

**Dependencies:** ❌ None for foundation modules (Work Centers, BOM, Production Orders)  
**Dependent Modules:** Material Consumption (Production Orders + Inventory), Scrap Tracking (Production Orders + Work Centers), Production Schedule (Production Orders + Work Centers), Engineering Changes (BOMs + Production Orders)  
**Implementation Order:** 2nd (Core business operations)

### Required CRUD Operations:
- **Create:** Production orders, BOMs, work centers, material consumption records, scrap records, engineering changes
- **Read:** All entities with filtering, pagination, search
- **Update:** Production order status, BOM revisions, work center details, engineering change approval
- **Delete:** Soft delete for production orders, BOMs (with revision control)

---

## 🛒 **PHASE 2: SALES MODULE** (High Priority - Core Business)

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Sales Dashboard** | `/sales/dashboard` | `GET /sales/analytics`<br>`GET /sales/leads`<br>`GET /sales/orders` | 🔄 Partial Frontend | 🔥 High |
| **Customer Management** | `/sales/customers` | `POST /sales/customers`<br>`GET /sales/customers`<br>`GET /sales/customers/:id`<br>`PUT /sales/customers/:id` | ✅ Backend Ready | 🔥 High |
| **Lead Management** | `/sales/lead-management` | `POST /sales/leads`<br>`GET /sales/leads`<br>`GET /sales/leads/:id`<br>`PUT /sales/leads/:id` | 🔄 Partial Frontend | 🔥 High |
| **Estimates** | `/sales/estimates` | `POST /sales/estimates`<br>`GET /sales/estimates`<br>`GET /sales/estimates/:id`<br>`PUT /sales/estimates/:id` | 🔄 Partial Frontend | 🔥 High |
| **Sales Orders** | `/sales/orders` | `POST /sales/orders`<br>`GET /sales/orders`<br>`GET /sales/orders/:id`<br>`PUT /sales/orders/:id` | 🔄 Partial Frontend | 🔥 High |
| **Site Measurements** | `/sales/site-measurements` | `POST /sales/measurements`<br>`GET /sales/measurements` | ✅ Backend Ready | 🔶 Medium |
| **Discount Approval** | `/sales/discount-approval` | `POST /sales/discount-approval`<br>`GET /sales/discount-approvals`<br>`PUT /sales/discount-approvals/:id` | ✅ Backend Ready | 🔶 Medium |
| **Sales Analytics** | `/sales/analytics` | `GET /sales/analytics`<br>`GET /sales/reports` | ✅ Backend Ready | 🔵 Low |

**Dependencies:** Administration (users, customers)  
**Used By:** Manufacturing (sales orders → production orders), Finance (invoicing)  
**Implementation Order:** 3rd (Revenue generation)

### Required CRUD Operations:
- **Create:** Leads, estimates, sales orders, customers, site measurements, discount requests
- **Read:** All entities with advanced filtering, search, pagination
- **Update:** Lead status, estimate revisions, order modifications, customer details
- **Delete:** Soft delete for leads, orders; hard delete for estimates (with approval)

---

## 📦 **PHASE 2: INVENTORY MODULE** (High Priority - Required by Manufacturing)

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Inventory Items** | `/inventory/items` | `POST /inventory/items`<br>`GET /inventory/items`<br>`PUT /inventory/items/:id` | ✅ Backend Ready | 🔥 High |
| **Stock Levels** | `/inventory/stock-levels` | `GET /inventory/stock/:itemCode`<br>`GET /inventory/items/warehouse/:warehouseId` | ✅ Backend Ready | 🔥 High |
| **Stock Transactions** | `/inventory/stock-transactions` | `POST /inventory/transactions`<br>`GET /inventory/transactions` | ✅ Backend Ready | 🔥 High |
| **Location Management** | `/inventory/location-management` | `POST /inventory/locations/assign`<br>`GET /inventory/locations/warehouse/:warehouseId` | ✅ Backend Ready | 🔶 Medium |
| **Batch Tracking** | `/inventory/batch-tracking` | `POST /inventory/batches`<br>`GET /inventory/batches/item/:itemId`<br>`GET /inventory/batches/expiring` | ✅ Backend Ready | 🔶 Medium |
| **Material Allocation** | `/inventory/material-allocation` | `POST /inventory/allocate-order`<br>`GET /inventory/allocations` | ✅ Backend Ready | 🔶 Medium |
| **Safety Stock Alerts** | `/inventory/safety-stock` | `GET /inventory/alerts/low-stock`<br>`POST /inventory/alerts/generate-reorder` | ✅ Backend Ready | 🔶 Medium |
| **Inter-branch Transfers** | `/inventory/inter-branch-transfers` | `POST /inventory/transfers`<br>`GET /inventory/transfers`<br>`PUT /inventory/transfers/:id/status` | ✅ Backend Ready | 🔶 Medium |
| **Barcode Scanning** | `/inventory/barcode-scanning` | `GET /inventory/barcode/:barcode` | ✅ Backend Ready | 🔵 Low |
| **Inventory Valuation** | `/inventory/inventory-valuation` | `GET /inventory/valuation` | ✅ Backend Ready | 🔵 Low |

**Dependencies:** Administration (branches, users)  
**Used By:** Manufacturing (material consumption), Sales (product availability), Procurement (stock levels)  
**Implementation Order:** 4th (Required by multiple modules)

### Required CRUD Operations:
- **Create:** Inventory items, stock transactions, batches, location assignments, transfers
- **Read:** Stock levels, transaction history, batch details, location mappings
- **Update:** Item details, location assignments, transfer status
- **Delete:** Soft delete for items; audit trail for transactions

---

## 🛍️ PROCUREMENT MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Purchase Requisitions** | `/procurement/purchase-requisitions` | `POST /procurement/requisitions`<br>`GET /procurement/requisitions`<br>`PUT /procurement/requisitions/:id/approve`<br>`PUT /procurement/requisitions/:id/reject` | ✅ Backend Ready | 🔥 High |
| **RFQ Management** | `/procurement/rfq-management` | `POST /procurement/rfq`<br>`GET /procurement/rfq`<br>`POST /procurement/rfq/responses`<br>`GET /procurement/rfq/:id/comparison` | ✅ Backend Ready | 🔥 High |
| **Purchase Orders** | `/procurement/purchase-orders` | `POST /procurement/orders`<br>`GET /procurement/orders`<br>`PUT /procurement/orders/:id/approve` | ✅ Backend Ready | 🔥 High |
| **Supplier Evaluation** | `/procurement/supplier-evaluation` | `POST /procurement/suppliers/evaluate`<br>`GET /procurement/suppliers/:id/performance` | ✅ Backend Ready | 🔶 Medium |
| **GRN Processing** | `/procurement/grn-processing` | `POST /procurement/grn`<br>`GET /procurement/grn` | ✅ Backend Ready | 🔶 Medium |

### Required CRUD Operations:
- **Create:** Purchase requisitions, RFQs, purchase orders, supplier evaluations, GRNs
- **Read:** All entities with approval status, supplier comparisons
- **Update:** Approval status, RFQ responses, PO modifications
- **Delete:** Soft delete with approval workflow

---

## ✅ QUALITY CONTROL MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **QC Inspections** | `/qc/inspections` | `POST /qc/inspections`<br>`GET /qc/inspections`<br>`PUT /qc/inspections/:id` | ✅ Backend Ready | 🔥 High |
| **Inspection Checklists** | `/qc/checklists` | `GET /qc/checklists/:stage`<br>`POST /qc/checklists` | ✅ Backend Ready | 🔥 High |
| **Rework Management** | `/qc/rework-management` | `POST /qc/rework`<br>`GET /qc/rework-orders` | ✅ Backend Ready | 🔶 Medium |
| **QC Reports** | `/qc/reports` | `GET /qc/reports`<br>`POST /qc/reports/generate` | ✅ Backend Ready | 🔶 Medium |

### Required CRUD Operations:
- **Create:** QC inspections, rework orders, inspection reports
- **Read:** Inspection history, checklist templates, QC status by production order
- **Update:** Inspection results, rework completion status
- **Delete:** Soft delete with audit trail

---

## 🔧 SERVICE MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Service Requests** | `/service/requests` | `POST /service/requests`<br>`GET /service/requests`<br>`GET /service/requests/:id`<br>`PUT /service/requests/:id/status` | ✅ Backend Ready | 🔥 High |
| **Technician Assignment** | `/service/technician-assignment` | `POST /service/assign-technician`<br>`GET /service/technicians` | ✅ Backend Ready | 🔥 High |
| **AMC Contracts** | `/service/amc-contracts` | `POST /service/amc-contracts`<br>`GET /service/amc-contracts`<br>`GET /service/amc-contracts/:id` | ✅ Backend Ready | 🔶 Medium |
| **Warranty Validation** | `/service/warranty-validation` | `GET /service/warranty/:warrantyNumber` | ✅ Backend Ready | 🔶 Medium |
| **Installation Scheduling** | `/service/installation-scheduling` | `POST /service/schedule-installation` | ✅ Backend Ready | 🔶 Medium |
| **RMA Management** | `/service/rma-management` | `POST /service/rma-requests`<br>`GET /service/rma-requests` | ✅ Backend Ready | 🔶 Medium |
| **Service Completion** | `/service/service-completion` | `POST /service/complete`<br>`GET /service/completions` | ✅ Backend Ready | 🔶 Medium |
| **Performance Metrics** | `/service/performance-metrics` | `GET /service/performance-metrics` | ✅ Backend Ready | 🔵 Low |
| **Cost Breakdown** | `/service/cost-breakdown` | `GET /service/cost-breakdown/:serviceRequestId` | ✅ Backend Ready | 🔵 Low |
| **Mobile Sync** | `/service/mobile-sync` | `GET /service/mobile/sync/:technicianId`<br>`PUT /service/mobile/update/:serviceRequestId` | ✅ Backend Ready | 🔵 Low |

### Required CRUD Operations:
- **Create:** Service requests, AMC contracts, RMA requests, installation schedules
- **Read:** Service history, technician availability, warranty status, performance metrics
- **Update:** Service status, technician assignments, completion details
- **Delete:** Soft delete for service requests; audit trail for completions

---

## 👥 HR MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Employee Management** | `/hr/employee-master` | `POST /hr/employees`<br>`GET /hr/employees`<br>`GET /hr/employees/:id`<br>`PUT /hr/employees/:id` | 🔄 Partial Frontend | 🔥 High |
| **Biometric Attendance** | `/hr/biometric-attendance` | `POST /hr/attendance/biometric`<br>`GET /hr/attendance/biometric` | ✅ Backend Ready | 🔶 Medium |
| **Geo-tagged Attendance** | `/hr/geo-attendance` | `POST /hr/attendance/geo`<br>`GET /hr/attendance/geo` | ✅ Backend Ready | 🔶 Medium |
| **Payroll Management** | `/hr/payroll-management` | `POST /hr/payroll/calculate`<br>`GET /hr/payroll`<br>`GET /hr/payroll/:employeeId` | ✅ Backend Ready | 🔶 Medium |
| **KPI Management** | `/hr/kpi-management` | `POST /hr/kpi-metrics`<br>`GET /hr/employees/:id/kpi` | ✅ Backend Ready | 🔶 Medium |
| **Leave Management** | `/hr/leave-management` | `POST /hr/leave-requests`<br>`GET /hr/leave-requests`<br>`PUT /hr/leave-requests/:id/process` | ✅ Backend Ready | 🔶 Medium |
| **Performance Reviews** | `/hr/performance-reviews` | `POST /hr/performance-reviews`<br>`GET /hr/performance-reviews`<br>`PUT /hr/performance-reviews/:id` | ✅ Backend Ready | 🔵 Low |

### Required CRUD Operations:
- **Create:** Employee records, attendance entries, payroll records, KPI metrics, leave requests, performance reviews
- **Read:** Employee directory, attendance reports, payroll history, KPI dashboards
- **Update:** Employee details, attendance corrections, leave approval, performance scores
- **Delete:** Soft delete for employees; audit trail for attendance/payroll

---

## 👤 EMPLOYEE PORTAL MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Employee Dashboard** | `/employee-portal/dashboard` | `GET /employee-portal/dashboard` | ✅ Backend Ready | 🔶 Medium |
| **Profile Management** | `/employee-portal/profile` | `GET /employee-portal/profile`<br>`PUT /employee-portal/profile` | ✅ Backend Ready | 🔶 Medium |
| **Attendance Tracking** | `/employee-portal/attendance` | `GET /employee-portal/attendance` | ✅ Backend Ready | 🔶 Medium |
| **Leave Requests** | `/employee-portal/leave-requests` | `POST /employee-portal/leave-requests`<br>`GET /employee-portal/leave-requests` | ✅ Backend Ready | 🔶 Medium |
| **Payroll Access** | `/employee-portal/payroll` | `GET /employee-portal/payroll` | ✅ Backend Ready | 🔶 Medium |
| **Performance Reviews** | `/employee-portal/performance` | `GET /employee-portal/performance`<br>`POST /employee-portal/self-assessment` | ✅ Backend Ready | 🔵 Low |

### Required CRUD Operations:
- **Create:** Leave requests, self-assessments
- **Read:** Personal dashboard, profile, attendance history, payroll records, performance data
- **Update:** Profile information, self-assessment responses
- **Delete:** Limited delete operations (own leave requests only)

---

## 💰 FINANCE MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Accounts Receivable** | `/finance/accounts-receivable` | `GET /finance/accounts-receivable` | ✅ Backend Ready | 🔥 High |
| **Invoice Management** | `/finance/invoices` | `POST /finance/invoices`<br>`GET /finance/invoices`<br>`PUT /finance/invoices/:id` | 🔄 Partial Frontend | 🔥 High |
| **Payment Management** | `/finance/payments` | `POST /finance/payments`<br>`GET /finance/payments` | ✅ Backend Ready | 🔥 High |
| **Tax Calculations** | `/finance/tax-calculations` | `POST /finance/tax-calculations`<br>`GET /finance/tax-reports` | ✅ Backend Ready | 🔶 Medium |
| **P&L Reporting** | `/finance/pl-reporting` | `GET /finance/reports/profit-loss` | ✅ Backend Ready | 🔶 Medium |
| **Cash Flow Forecasting** | `/finance/cash-flow-forecasting` | `GET /finance/cashflow-forecast` | ✅ Backend Ready | 🔵 Low |
| **Bank Reconciliation** | `/finance/bank-reconciliation` | `POST /finance/bank-reconciliation`<br>`GET /finance/bank-reconciliation` | ✅ Backend Ready | 🔵 Low |

### Required CRUD Operations:
- **Create:** Invoices, payments, tax calculations, bank reconciliations
- **Read:** Financial reports, account balances, payment history, tax summaries
- **Update:** Invoice status, payment details, reconciliation status
- **Delete:** Soft delete with approval workflow for financial records

---

## 🏢 SUPPLIER MANAGEMENT MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Supplier Master** | `/suppliers/master` | `POST /suppliers`<br>`GET /suppliers`<br>`GET /suppliers/:id`<br>`PUT /suppliers/:id` | ✅ Backend Ready | 🔥 High |
| **Vendor Performance** | `/suppliers/performance` | `GET /suppliers/:id/performance`<br>`GET /suppliers/top-performers` | ✅ Backend Ready | 🔶 Medium |
| **Quote Comparison** | `/suppliers/quote-comparison` | `GET /suppliers/rfq/:rfqId/quote-comparison`<br>`GET /suppliers/:id/quote-history` | ✅ Backend Ready | 🔶 Medium |
| **Payment Terms** | `/suppliers/payment-terms` | `PUT /suppliers/:id/payment-terms`<br>`GET /suppliers/:id/credit-utilization` | ✅ Backend Ready | 🔶 Medium |
| **Communication Log** | `/suppliers/communications` | `POST /suppliers/:id/communications`<br>`GET /suppliers/:id/communications` | ✅ Backend Ready | 🔵 Low |
| **Document Management** | `/suppliers/documents` | `POST /suppliers/:id/documents`<br>`GET /suppliers/:id/documents` | ✅ Backend Ready | 🔵 Low |
| **Vendor Portal** | `/suppliers/vendor-portal` | `POST /suppliers/:id/portal-access`<br>`PUT /suppliers/:id/portal-access`<br>`GET /suppliers/:id/portal-activity` | ✅ Backend Ready | 🔵 Low |

### Required CRUD Operations:
- **Create:** Supplier records, communications, documents, portal access
- **Read:** Supplier directory, performance metrics, quote history, communication logs
- **Update:** Supplier details, payment terms, portal settings
- **Delete:** Soft delete for suppliers; audit trail for communications

---

## 🚨 ALERT MANAGEMENT MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **SLA Configuration** | `/alerts/sla-configuration` | `POST /alerts/sla-configurations`<br>`GET /alerts/sla-configurations`<br>`PUT /alerts/sla-configurations/:id` | ✅ Backend Ready | 🔶 Medium |
| **Alert Management** | `/alerts/management` | `POST /alerts`<br>`GET /alerts`<br>`PUT /alerts/:id` | ✅ Backend Ready | 🔶 Medium |
| **Notifications** | `/alerts/notifications` | `POST /alerts/notifications`<br>`GET /alerts/notifications` | ✅ Backend Ready | 🔶 Medium |
| **Escalation Processing** | `/alerts/escalation` | `GET /alerts/escalations`<br>`POST /alerts/escalate` | ✅ Backend Ready | 🔵 Low |

### Required CRUD Operations:
- **Create:** SLA configurations, alerts, notifications, escalation rules
- **Read:** Alert history, SLA performance, notification logs
- **Update:** Alert status, SLA rules, escalation settings
- **Delete:** Soft delete with audit trail

---

## 📊 BUSINESS INTELLIGENCE MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Role-based Dashboards** | `/bi/dashboards` | `GET /bi/dashboards/:role` | ✅ Backend Ready | 🔶 Medium |
| **Trend Analysis** | `/bi/trends` | `POST /bi/trends`<br>`GET /bi/trends` | ✅ Backend Ready | 🔵 Low |
| **Drill-down Reports** | `/bi/drill-down` | `POST /bi/drill-down` | ✅ Backend Ready | 🔵 Low |
| **Real-time Data** | `/bi/real-time` | `GET /bi/real-time` | ✅ Backend Ready | 🔵 Low |
| **Custom Reports** | `/bi/custom-reports` | `POST /bi/reports/custom`<br>`GET /bi/reports/custom` | ✅ Backend Ready | 🔵 Low |

### Required CRUD Operations:
- **Create:** Custom reports, dashboard configurations, trend analysis queries
- **Read:** Dashboard data, report results, real-time metrics
- **Update:** Dashboard layouts, report parameters
- **Delete:** Custom reports and saved queries

---

## 🔗 EXTERNAL INTEGRATIONS MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Meta Lead Sync** | `/integrations/meta-sync` | `POST /external-integration/sync/meta` | ✅ Backend Ready | 🔵 Low |
| **Google Ads Integration** | `/integrations/google-ads` | `POST /external-integration/sync/google` | ✅ Backend Ready | 🔵 Low |
| **WhatsApp Notifications** | `/integrations/whatsapp` | `POST /external-integration/notifications/whatsapp` | ✅ Backend Ready | 🔵 Low |
| **Communication Management** | `/integrations/communications` | `POST /external-integration/communications` | ✅ Backend Ready | 🔵 Low |
| **Lead Scoring** | `/integrations/lead-scoring` | `GET /external-integration/lead-scoring`<br>`POST /external-integration/lead-scoring` | ✅ Backend Ready | 🔵 Low |

### Required CRUD Operations:
- **Create:** Integration configurations, sync jobs, communication records
- **Read:** Integration status, sync history, lead scores
- **Update:** Integration settings, sync parameters
- **Delete:** Sync logs and temporary data

---

## ⚙️ ADMINISTRATION MODULE

### Frontend Menu Items → Backend APIs

| Menu Item | Route | Backend Endpoints | Implementation Status | Priority |
|-----------|-------|-------------------|----------------------|----------|
| **Branch Management** | `/admin/branches` | `POST /admin/branches`<br>`GET /admin/branches`<br>`PUT /admin/branches/:id` | 🔄 Partial Frontend | 🔥 High |
| **User Management** | `/admin/users` | `POST /admin/users`<br>`GET /admin/users`<br>`PUT /admin/users/:id` | 🔄 Partial Frontend | 🔥 High |
| **Roles & Permissions** | `/admin/roles` | `GET /rbac/roles`<br>`POST /rbac/roles`<br>`GET /rbac/permissions`<br>`PUT /rbac/roles/:id` | ✅ Backend Ready | 🔥 High |

### Required CRUD Operations:
- **Create:** Branches, users, roles, permissions
- **Read:** Organization structure, user directory, role definitions
- **Update:** Branch details, user profiles, role assignments
- **Delete:** Soft delete for users; careful role deletion with dependency checks

---

## 🎯 IMPLEMENTATION PRIORITY GUIDE

### 🔥 **Phase 1: Core Business Operations (Weeks 1-8)**
1. **Manufacturing:** Production Orders, BOM Management, Work Centers
2. **Sales:** Lead Management, Customer Management, Sales Orders, Estimates
3. **Administration:** User Management, Branch Management, Roles & Permissions

### 🔶 **Phase 2: Operational Efficiency (Weeks 9-16)**
4. **Inventory:** Items, Stock Levels, Transactions, Location Management
5. **Procurement:** Purchase Requisitions, RFQ Management, Purchase Orders
6. **Quality Control:** QC Inspections, Checklists
7. **Service:** Service Requests, Technician Assignment

### 🔵 **Phase 3: Advanced Features (Weeks 17-24)**
8. **Finance:** Invoice Management, Payment Management, Accounts Receivable
9. **HR:** Employee Management, Attendance, Payroll
10. **Supplier Management:** Supplier Master, Performance Tracking
11. **Employee Portal:** Dashboard, Profile, Leave Requests

### 🔵 **Phase 4: Analytics & Integrations (Weeks 25-30)**
12. **Business Intelligence:** Dashboards, Reports, Analytics
13. **Alert Management:** SLA Configuration, Notifications
14. **External Integrations:** Meta Sync, WhatsApp, Communication

---

## 📋 IMPLEMENTATION CHECKLIST

For each menu item, implement:

### ✅ **Frontend Components Required:**
- [ ] **List View:** Data table with pagination, search, filtering, sorting
- [ ] **Create Form:** Modal/page with validation, field dependencies
- [ ] **Edit Form:** Pre-populated form with update capabilities
- [ ] **Detail View:** Read-only detailed information display
- [ ] **Delete Confirmation:** Safe deletion with confirmation dialogs
- [ ] **Bulk Operations:** Multi-select for bulk actions where applicable

### ✅ **API Integration Required:**
- [ ] **RTK Query Endpoints:** Define all CRUD endpoints
- [ ] **Error Handling:** Proper error states and user feedback
- [ ] **Loading States:** Skeleton loaders and progress indicators
- [ ] **Optimistic Updates:** Immediate UI updates with rollback
- [ ] **Cache Management:** Proper cache invalidation and updates

### ✅ **UI/UX Requirements:**
- [ ] **Responsive Design:** Mobile-first approach
- [ ] **Accessibility:** ARIA labels, keyboard navigation
- [ ] **Consistent Styling:** Follow design system
- [ ] **User Feedback:** Success/error messages, confirmations
- [ ] **Performance:** Lazy loading, virtualization for large lists

---

## 🚀 **QUICK START GUIDE**

### 1. **Choose a Module** (Start with Manufacturing/Sales)
### 2. **Review Backend APIs** (All endpoints are ready)
### 3. **Create RTK Query Services** (Define API endpoints)
### 4. **Build CRUD Components** (List, Create, Edit, Delete)
### 5. **Implement Forms** (Validation, error handling)
### 6. **Add Navigation** (Breadcrumbs, menu highlighting)
### 7. **Test Integration** (API calls, error scenarios)
### 8. **Polish UI/UX** (Loading states, responsive design)

This mapping provides everything you need to systematically implement all frontend CRUD operations with confidence that the backend APIs are ready and waiting!