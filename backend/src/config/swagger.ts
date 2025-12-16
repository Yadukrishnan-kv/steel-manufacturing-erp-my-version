/**
 * Swagger/OpenAPI Configuration
 * API Documentation for Steel Manufacturing ERP
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Steel Manufacturing ERP API',
      version: '1.0.0',
      description: `
## Overview
Comprehensive REST API for Steel Manufacturing ERP system supporting multi-branch operations, 
manufacturing, sales, inventory, procurement, quality control, and more.

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting
- Window: 15 minutes
- Max Requests: 100 per window

## Response Format
All responses follow a consistent format:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
\`\`\`

## Error Format
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
\`\`\`
      `,
      contact: {
        name: 'Steel ERP Support',
        email: 'support@steelforge.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.steelforge.com/api/v1',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and session management' },
      { name: 'Manufacturing', description: 'Production orders, BOM, work centers, scheduling' },
      { name: 'Sales', description: 'Leads, estimates, orders, customers' },
      { name: 'Inventory', description: 'Stock management, warehouses, transactions' },
      { name: 'Procurement', description: 'Purchase orders, RFQs, suppliers' },
      { name: 'Quality Control', description: 'Inspections, checklists, certificates' },
      { name: 'Service', description: 'Service requests, AMC, warranty' },
      { name: 'HR', description: 'Employees, attendance, payroll, performance' },
      { name: 'Finance', description: 'Invoices, payments, reports' },
      { name: 'Alerts', description: 'Notifications and SLA management' },
      { name: 'Administration', description: 'System administration, branches, users' },
      { name: 'Business Intelligence', description: 'Dashboards, analytics, and reporting' },
      { name: 'RBAC', description: 'Role-based access control and permissions' },
      { name: 'Suppliers', description: 'Supplier management and vendor portal' },
      { name: 'Customer Portal', description: 'Customer self-service portal' },
      { name: 'Employee Portal', description: 'Employee self-service portal' },
      { name: 'External Integration', description: 'Meta, Google Ads, WhatsApp integrations' },
      { name: 'Health', description: 'System health checks' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid input data' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
          },
        },
        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@steelmanufacturing.com' },
            password: { type: 'string', format: 'password', example: 'Admin123!' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'integer', example: 86400 },
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Manufacturing schemas
        ProductionOrder: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'string', example: 'PO-2024-001' },
            productId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer', example: 100 },
            status: { 
              type: 'string', 
              enum: ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              example: 'PLANNED'
            },
            priority: { type: 'integer', minimum: 1, maximum: 5, example: 3 },
            plannedStartDate: { type: 'string', format: 'date-time' },
            plannedEndDate: { type: 'string', format: 'date-time' },
            actualStartDate: { type: 'string', format: 'date-time' },
            actualEndDate: { type: 'string', format: 'date-time' },
            branchId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateProductionOrder: {
          type: 'object',
          required: ['productId', 'quantity', 'branchId'],
          properties: {
            productId: { type: 'string', format: 'uuid' },
            salesOrderId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer', minimum: 1, example: 100 },
            priority: { type: 'integer', minimum: 1, maximum: 5, example: 3 },
            plannedStartDate: { type: 'string', format: 'date-time' },
            branchId: { type: 'string', format: 'uuid' },
            notes: { type: 'string' },
          },
        },
        BOM: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            version: { type: 'integer', example: 1 },
            status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'OBSOLETE'] },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/BOMItem' },
            },
          },
        },
        BOMItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            materialId: { type: 'string', format: 'uuid' },
            quantity: { type: 'number', example: 2.5 },
            unit: { type: 'string', example: 'KG' },
            scrapPercentage: { type: 'number', example: 5 },
          },
        },
        WorkCenter: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'CNC Machine 1' },
            code: { type: 'string', example: 'WC-CNC-001' },
            type: { type: 'string', example: 'CNC' },
            capacity: { type: 'number', example: 8 },
            capacityUnit: { type: 'string', example: 'HOURS' },
            costPerHour: { type: 'number', example: 150 },
            isActive: { type: 'boolean' },
          },
        },
        // Sales schemas
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            leadNumber: { type: 'string', example: 'LD-2024-001' },
            customerName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            source: { type: 'string', enum: ['WEBSITE', 'REFERRAL', 'WALK_IN', 'SOCIAL_MEDIA', 'ADVERTISEMENT'] },
            status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            assignedTo: { type: 'string', format: 'uuid' },
            estimatedValue: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateLead: {
          type: 'object',
          required: ['customerName', 'phone', 'source'],
          properties: {
            customerName: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '+91-9876543210' },
            source: { type: 'string', enum: ['WEBSITE', 'REFERRAL', 'WALK_IN', 'SOCIAL_MEDIA', 'ADVERTISEMENT'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
            notes: { type: 'string' },
            branchId: { type: 'string', format: 'uuid' },
          },
        },
        Estimate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            estimateNumber: { type: 'string', example: 'EST-2024-001' },
            leadId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'] },
            totalAmount: { type: 'number' },
            discountPercentage: { type: 'number' },
            validUntil: { type: 'string', format: 'date' },
            items: { type: 'array', items: { $ref: '#/components/schemas/EstimateItem' } },
          },
        },
        EstimateItem: {
          type: 'object',
          properties: {
            productId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'number' },
            discount: { type: 'number' },
          },
        },
        SalesOrder: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'string', example: 'SO-2024-001' },
            customerId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED'] },
            totalAmount: { type: 'number' },
            paidAmount: { type: 'number' },
            deliveryDate: { type: 'string', format: 'date' },
          },
        },
        // Administration schemas
        Branch: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'KL001', maxLength: 20 },
            name: { type: 'string', example: 'Kochi Branch', maxLength: 100 },
            address: { type: 'string', example: 'Industrial Area, Kochi', maxLength: 500 },
            city: { type: 'string', example: 'Kochi', maxLength: 100 },
            state: { type: 'string', example: 'Kerala', maxLength: 100 },
            pincode: { type: 'string', example: '682001', minLength: 6, maxLength: 10 },
            phone: { type: 'string', example: '+91-484-1234567', minLength: 10, maxLength: 15 },
            email: { type: 'string', format: 'email', example: 'kochi@steel-erp.com' },
            gstNumber: { type: 'string', example: '32ABCDE1234F1Z5' },
            isActive: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            _count: {
              type: 'object',
              properties: {
                warehouses: { type: 'integer' },
                employees: { type: 'integer' },
                customers: { type: 'integer' },
                salesOrders: { type: 'integer' },
                productionOrders: { type: 'integer' },
              },
            },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerCode: { type: 'string', example: 'CUST-001' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            gstNumber: { type: 'string' },
            creditLimit: { type: 'number' },
          },
        },
        // Inventory schemas
        InventoryItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sku: { type: 'string', example: 'MAT-STEEL-001' },
            name: { type: 'string' },
            category: { type: 'string' },
            currentStock: { type: 'number' },
            unit: { type: 'string' },
            reorderLevel: { type: 'number' },
            warehouseId: { type: 'string', format: 'uuid' },
          },
        },
        StockTransaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            itemId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'] },
            quantity: { type: 'number' },
            referenceType: { type: 'string' },
            referenceId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // QC schemas
        QCInspection: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            inspectionNumber: { type: 'string' },
            productionOrderId: { type: 'string', format: 'uuid' },
            stage: { type: 'string', enum: ['CUTTING', 'FABRICATION', 'COATING', 'ASSEMBLY', 'DISPATCH', 'INSTALLATION'] },
            status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'REWORK_REQUIRED'] },
            inspectorId: { type: 'string', format: 'uuid' },
            overallScore: { type: 'number' },
            inspectionDate: { type: 'string', format: 'date-time' },
          },
        },
        QCCertificate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            certificateNumber: { type: 'string' },
            productionOrderId: { type: 'string', format: 'uuid' },
            certificateType: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'ISSUED', 'APPROVED', 'REJECTED'] },
            issuedBy: { type: 'string' },
            issuedDate: { type: 'string', format: 'date-time' },
          },
        },
        // Service schemas
        ServiceRequest: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            serviceNumber: { type: 'string' },
            customerId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['INSTALLATION', 'MAINTENANCE', 'REPAIR', 'WARRANTY_CLAIM'] },
            status: { type: 'string', enum: ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            description: { type: 'string' },
            scheduledDate: { type: 'string', format: 'date-time' },
            assignedTo: { type: 'string', format: 'uuid' },
          },
        },
        AMCContract: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            contractNumber: { type: 'string' },
            customerId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED'] },
          },
        },
        // Finance schemas
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            invoiceNumber: { type: 'string' },
            customerId: { type: 'string', format: 'uuid' },
            invoiceDate: { type: 'string', format: 'date' },
            dueDate: { type: 'string', format: 'date' },
            totalAmount: { type: 'number' },
            paidAmount: { type: 'number' },
            status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'] },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            invoiceId: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            paymentDate: { type: 'string', format: 'date-time' },
            paymentMethod: { type: 'string', enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD'] },
            referenceNumber: { type: 'string' },
          },
        },
        // Procurement schemas
        PurchaseRequisition: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            prNumber: { type: 'string' },
            requestedBy: { type: 'string' },
            department: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            requiredDate: { type: 'string', format: 'date' },
          },
        },
        PurchaseOrder: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            poNumber: { type: 'string' },
            supplierId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] },
            totalAmount: { type: 'number' },
            deliveryDate: { type: 'string', format: 'date' },
          },
        },
        GRN: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            grnNumber: { type: 'string' },
            poId: { type: 'string', format: 'uuid' },
            receivedDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['PENDING_QC', 'QC_PASSED', 'QC_FAILED', 'COMPLETED'] },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Access token required',
                  timestamp: '2024-01-15T10:00:00.000Z',
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions for this operation',
                  timestamp: '2024-01-15T10:00:00.000Z',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
