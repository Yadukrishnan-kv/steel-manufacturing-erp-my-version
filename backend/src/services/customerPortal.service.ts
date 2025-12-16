import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../auth/password';
import { generateTokenPair } from '../auth/jwt';
import { AppError } from '../middleware/error';
import { logger } from '../utils/logger';
import { WhatsAppService } from './whatsapp.service';

const prisma = new PrismaClient();

export interface CustomerLoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface CustomerRegistrationRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
}

export interface ServiceBookingRequest {
  customerId: string;
  type: 'INSTALLATION' | 'MAINTENANCE' | 'REPAIR' | 'WARRANTY_CLAIM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  preferredDate: Date;
  address: string;
  salesOrderId?: string;
}

export interface CustomerFeedbackRequest {
  customerId: string;
  serviceRequestId?: string;
  salesOrderId?: string;
  rating: number; // 1-5
  feedback: string;
  category: 'PRODUCT' | 'SERVICE' | 'DELIVERY' | 'SUPPORT';
}

export interface OrderTrackingData {
  id: string;
  orderNumber: string;
  orderDate: Date;
  deliveryDate: Date;
  status: string;
  totalAmount: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  productionProgress: Array<{
    stage: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    startDate?: Date;
    endDate?: Date;
    completionPercentage: number;
  }>;
  qcStatus: Array<{
    stage: string;
    status: 'PENDING' | 'PASSED' | 'FAILED' | 'REWORK';
    inspectionDate?: Date;
    inspector?: string;
  }>;
}

/**
 * Customer Portal Service
 * Handles customer authentication, order tracking, service requests, and feedback
 */
export class CustomerPortalService {
  /**
   * Register a new customer
   */
  static async registerCustomer(data: CustomerRegistrationRequest) {
    const { name, email, phone, password, address, city, state, pincode, gstNumber } = data;

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (existingCustomer) {
      throw new AppError(
        'Customer with this email or phone already exists',
        409,
        'CUSTOMER_EXISTS'
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Get default branch (first active branch)
    const defaultBranch = await prisma.branch.findFirst({
      where: { isActive: true },
    });

    if (!defaultBranch) {
      throw new AppError(
        'No active branch found',
        500,
        'NO_ACTIVE_BRANCH'
      );
    }

    // Generate customer code
    const customerCount = await prisma.customer.count();
    const customerCode = `CUST${String(customerCount + 1).padStart(6, '0')}`;

    // Create customer with password
    const customer = await prisma.customer.create({
      data: {
        code: customerCode,
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        gstNumber: gstNumber || null,
        branchId: defaultBranch.id,
        // Store password in a separate table for portal access
      },
    });

    // Create customer portal credentials
    await prisma.customerPortalCredentials.create({
      data: {
        customerId: customer.id,
        email,
        passwordHash: hashedPassword,
      },
    });

    logger.info('Customer registered successfully', {
      customerId: customer.id,
      email: customer.email,
      phone: customer.phone,
    });

    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    };
  }

  /**
   * Authenticate customer and create session
   */
  static async loginCustomer(loginData: CustomerLoginRequest) {
    const { email, phone, password } = loginData;

    if (!email && !phone) {
      throw new AppError(
        'Email or phone is required',
        400,
        'MISSING_CREDENTIALS'
      );
    }

    // Find customer
    const customer = await prisma.customer.findFirst({
      where: {
        AND: [
          {
            OR: [
              email ? { email } : {},
              phone ? { phone } : {},
            ],
          },
          { isActive: true },
        ],
      },
    });

    if (!customer) {
      throw new AppError(
        'Invalid credentials or account inactive',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Get password hash from credentials table
    const credentials = await prisma.customerPortalCredentials.findUnique({
      where: { customerId: customer.id },
    });

    if (!credentials) {
      throw new AppError(
        'Customer portal access not configured',
        401,
        'NO_PORTAL_ACCESS'
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, credentials.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(
        'Invalid credentials',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Generate tokens
    const tokenPayload = {
      userId: customer.id,
      email: customer.email || '',
      roles: ['customer'],
      sessionId: 'customer-session',
    };

    const tokens = generateTokenPair(tokenPayload);

    logger.info('Customer logged in successfully', {
      customerId: customer.id,
      email: customer.email,
    });

    return {
      customer: {
        id: customer.id,
        code: customer.code,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      tokens,
    };
  }

  /**
   * Get customer orders with tracking information
   */
  static async getCustomerOrders(customerId: string): Promise<OrderTrackingData[]> {
    const orders = await prisma.salesOrder.findMany({
      where: {
        customerId,
        isDeleted: false,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        productionOrders: {
          include: {
            operations: true,
            qcInspections: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    return orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      status: order.status,
      totalAmount: order.finalAmount,
      items: order.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      productionProgress: this.calculateProductionProgress(order.productionOrders),
      qcStatus: this.calculateQCStatus(order.productionOrders),
    }));
  }

  /**
   * Get specific order details
   */
  static async getOrderDetails(customerId: string, orderId: string): Promise<OrderTrackingData> {
    const order = await prisma.salesOrder.findFirst({
      where: {
        id: orderId,
        customerId,
        isDeleted: false,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        productionOrders: {
          include: {
            operations: true,
            qcInspections: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError(
        'Order not found',
        404,
        'ORDER_NOT_FOUND'
      );
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      status: order.status,
      totalAmount: order.finalAmount,
      items: order.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      productionProgress: this.calculateProductionProgress(order.productionOrders),
      qcStatus: this.calculateQCStatus(order.productionOrders),
    };
  }

  /**
   * Book a service request
   */
  static async bookServiceRequest(data: ServiceBookingRequest) {
    const { customerId, type, priority, description, preferredDate, address, salesOrderId } = data;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError(
        'Customer not found',
        404,
        'CUSTOMER_NOT_FOUND'
      );
    }

    // Generate service request number
    const serviceCount = await prisma.serviceRequest.count();
    const serviceNumber = `SRV${String(serviceCount + 1).padStart(6, '0')}`;

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        serviceNumber,
        customerId,
        salesOrderId: salesOrderId || null,
        type,
        priority,
        description,
        scheduledDate: preferredDate,
        status: 'SCHEDULED',
        location: JSON.stringify({ address }),
      },
    });

    // Send WhatsApp notification
    try {
      // TODO: Implement WhatsApp service booking confirmation
      logger.info('Service booking confirmation would be sent via WhatsApp', {
        phone: customer.phone,
        serviceNumber: serviceRequest.serviceNumber,
      });
    } catch (error) {
      logger.warn('Failed to send WhatsApp notification', { error });
    }

    logger.info('Service request booked successfully', {
      serviceRequestId: serviceRequest.id,
      customerId,
      type,
    });

    return serviceRequest;
  }

  /**
   * Get customer service requests
   */
  static async getCustomerServiceRequests(customerId: string) {
    return await prisma.serviceRequest.findMany({
      where: {
        customerId,
      },
      include: {
        assignedTechnician: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        salesOrder: {
          select: {
            orderNumber: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });
  }

  /**
   * Submit customer feedback
   */
  static async submitFeedback(data: CustomerFeedbackRequest) {
    const { customerId, serviceRequestId, salesOrderId, rating, feedback, category } = data;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError(
        'Customer not found',
        404,
        'CUSTOMER_NOT_FOUND'
      );
    }

    // Create feedback record
    const feedbackRecord = await prisma.customerFeedback.create({
      data: {
        customerId,
        serviceRequestId: serviceRequestId || null,
        salesOrderId: salesOrderId || null,
        rating,
        feedback,
        category,
      },
    });

    logger.info('Customer feedback submitted', {
      feedbackId: feedbackRecord.id,
      customerId,
      rating,
      category,
    });

    return feedbackRecord;
  }

  /**
   * Get customer documents (invoices, warranties, certificates)
   */
  static async getCustomerDocuments(customerId: string) {
    const documents = await prisma.document.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        filePath: true,
        createdAt: true,
      },
    });

    return documents.map(doc => ({
      id: doc.id,
      type: doc.documentType,
      name: doc.fileName,
      url: doc.filePath,
      created_at: doc.createdAt,
    }));
  }

  /**
   * Send WhatsApp order update
   */
  static async sendOrderUpdate(customerId: string, orderId: string, status: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
    });

    if (customer && order) {
      try {
        // TODO: Implement WhatsApp order status update
        logger.info('Order status update would be sent via WhatsApp', {
          phone: customer.phone,
          orderNumber: order.orderNumber,
          status,
        });
      } catch (error) {
        logger.warn('Failed to send WhatsApp order update', { error });
      }
    }
  }

  /**
   * Calculate production progress from production orders
   */
  private static calculateProductionProgress(productionOrders: any[]) {
    const stages = ['CUTTING', 'CNC', 'BENDING', 'WELDING', 'COATING', 'ASSEMBLY'];
    
    return stages.map(stage => {
      const operations = productionOrders.flatMap(po => 
        po.operations?.filter((op: any) => op.operationType === stage) || []
      );
      
      if (operations.length === 0) {
        return {
          stage,
          status: 'PENDING' as const,
          completionPercentage: 0,
        };
      }

      const completedOps = operations.filter((op: any) => op.status === 'COMPLETED');
      const inProgressOps = operations.filter((op: any) => op.status === 'IN_PROGRESS');
      
      let status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
      let completionPercentage: number;

      if (completedOps.length === operations.length) {
        status = 'COMPLETED';
        completionPercentage = 100;
      } else if (inProgressOps.length > 0 || completedOps.length > 0) {
        status = 'IN_PROGRESS';
        completionPercentage = Math.round((completedOps.length / operations.length) * 100);
      } else {
        status = 'PENDING';
        completionPercentage = 0;
      }

      return {
        stage,
        status,
        startDate: operations[0]?.startDate,
        endDate: completedOps.length === operations.length ? operations[operations.length - 1]?.endDate : undefined,
        completionPercentage,
      };
    });
  }

  /**
   * Calculate QC status from production orders
   */
  private static calculateQCStatus(productionOrders: any[]) {
    const qcStages = ['CUTTING', 'FABRICATION', 'COATING', 'ASSEMBLY', 'DISPATCH', 'INSTALLATION'];
    
    return qcStages.map(stage => {
      const inspections = productionOrders.flatMap(po => 
        po.qcInspections?.filter((qc: any) => qc.stage === stage) || []
      );
      
      if (inspections.length === 0) {
        return {
          stage,
          status: 'PENDING' as const,
        };
      }

      const latestInspection = inspections.sort((a: any, b: any) => 
        new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime()
      )[0];

      return {
        stage,
        status: latestInspection.status,
        inspectionDate: latestInspection.inspectionDate,
        inspector: latestInspection.inspector?.firstName + ' ' + latestInspection.inspector?.lastName,
      };
    });
  }
}