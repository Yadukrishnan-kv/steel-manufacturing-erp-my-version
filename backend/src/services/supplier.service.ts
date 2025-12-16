import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export interface SupplierCreateData {
  code: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  branchId: string;
  rating?: number;
  isActive?: boolean;
}

export interface SupplierUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  rating?: number;
  isActive?: boolean;
}

export interface SupplierPerformanceMetrics {
  supplierId: string;
  period: {
    fromDate: Date;
    toDate: Date;
  };
  orderMetrics: {
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
  };
  deliveryMetrics: {
    onTimeDeliveries: number;
    lateDeliveries: number;
    deliveryPerformance: number; // percentage
    averageDeliveryDays: number;
  };
  qualityMetrics: {
    totalGRNs: number;
    passedGRNs: number;
    failedGRNs: number;
    qualityPerformance: number; // percentage
  };
  pricingMetrics: {
    averageDiscount: number;
    priceVariance: number;
    competitiveness: number; // compared to market rates
  };
  overallRating: number;
}

export interface SupplierCommunication {
  supplierId: string;
  type: 'EMAIL' | 'PHONE' | 'MEETING' | 'PORTAL' | 'DOCUMENT';
  subject: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'REPLIED';
  attachments?: string; // JSON array of file paths
  communicatedBy: string;
  communicatedAt: Date;
}

export interface SupplierDocument {
  supplierId: string;
  documentType: 'CONTRACT' | 'CERTIFICATE' | 'INVOICE' | 'AGREEMENT' | 'COMPLIANCE' | 'OTHER';
  documentName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: Date;
  isActive: boolean;
  uploadedBy: string;
}

export interface VendorPortalAccess {
  supplierId: string;
  username: string;
  email: string;
  isActive: boolean;
  lastLoginAt?: Date;
  permissions: string[]; // Array of permissions like 'VIEW_RFQ', 'SUBMIT_QUOTE', etc.
}

export class SupplierService {
  // Supplier master data management
  async createSupplier(data: SupplierCreateData, createdBy: string) {
    // Check if supplier code already exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { code: data.code }
    });

    if (existingSupplier) {
      throw new Error(`Supplier with code ${data.code} already exists`);
    }

    const supplier = await prisma.supplier.create({
      data: {
        id: randomUUID(),
        code: data.code,
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstNumber: data.gstNumber || null,
        branchId: data.branchId,
        rating: data.rating || 0,
        isActive: data.isActive !== false,
        createdBy
      }
    });

    // Create extended supplier details in a separate table (we'll need to add this to schema)
    // For now, we'll store extended data as JSON in a custom field or create additional records

    return supplier;
  }

  async updateSupplier(supplierId: string, data: SupplierUpdateData, updatedBy: string) {
    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        ...data,
        updatedBy,
        updatedAt: new Date()
      }
    });

    return supplier;
  }

  async getSupplier(supplierId: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        branch: true,
        purchaseOrders: {
          include: {
            items: true,
            grnRecords: true
          },
          orderBy: { orderDate: 'desc' },
          take: 10 // Latest 10 orders
        },
        rfqResponses: {
          include: {
            rfq: true,
            items: true
          },
          orderBy: { submittedAt: 'desc' },
          take: 5 // Latest 5 RFQ responses
        }
      }
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return supplier;
  }

  async getAllSuppliers(filters?: {
    branchId?: string;
    isActive?: boolean;
    city?: string;
    state?: string;
    rating?: number;
    search?: string;
  }) {
    const whereClause: any = {};

    if (filters?.branchId) whereClause.branchId = filters.branchId;
    if (filters?.isActive !== undefined) whereClause.isActive = filters.isActive;
    if (filters?.city) whereClause.city = filters.city;
    if (filters?.state) whereClause.state = filters.state;
    if (filters?.rating) whereClause.rating = { gte: filters.rating };
    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search } },
        { code: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } }
      ];
    }

    return await prisma.supplier.findMany({
      where: whereClause,
      include: {
        branch: true,
        _count: {
          select: {
            purchaseOrders: true,
            rfqResponses: true
          }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { name: 'asc' }
      ]
    });
  }

  async deactivateSupplier(supplierId: string, deactivatedBy: string, reason?: string) {
    // Check if supplier has active purchase orders
    const activePOs = await prisma.purchaseOrder.count({
      where: {
        supplierId,
        status: { in: ['PENDING', 'APPROVED', 'SENT'] }
      }
    });

    if (activePOs > 0) {
      throw new Error(`Cannot deactivate supplier. ${activePOs} active purchase orders exist.`);
    }

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        isActive: false,
        updatedBy: deactivatedBy,
        updatedAt: new Date()
      }
    });

    // Log the deactivation reason
    if (reason) {
      // In a real implementation, you'd log this to an audit table
      console.log(`Supplier ${supplier.code} deactivated by ${deactivatedBy}. Reason: ${reason}`);
    }

    return supplier;
  }

  // Vendor performance tracking and rating algorithms
  async calculateSupplierPerformance(supplierId: string, periodMonths: number = 12): Promise<SupplierPerformanceMetrics> {
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - periodMonths);
    const toDate = new Date();

    // Get all purchase orders for the supplier in the period
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        orderDate: { gte: fromDate, lte: toDate }
      },
      include: {
        items: true,
        grnRecords: {
          include: {
            items: true
          }
        }
      }
    });

    // Calculate order metrics
    const totalOrders = purchaseOrders.length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.finalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    // Calculate delivery metrics
    let onTimeDeliveries = 0;
    let totalDeliveryDays = 0;
    let deliveredOrders = 0;

    purchaseOrders.forEach(po => {
      const grn = po.grnRecords[0]; // Assuming first GRN
      if (grn) {
        deliveredOrders++;
        const deliveryDays = Math.ceil((grn.receivedDate.getTime() - po.orderDate.getTime()) / (1000 * 60 * 60 * 24));
        totalDeliveryDays += deliveryDays;
        
        const expectedDeliveryDays = Math.ceil((po.deliveryDate.getTime() - po.orderDate.getTime()) / (1000 * 60 * 60 * 24));
        if (deliveryDays <= expectedDeliveryDays) {
          onTimeDeliveries++;
        }
      }
    });

    const lateDeliveries = deliveredOrders - onTimeDeliveries;
    const deliveryPerformance = deliveredOrders > 0 ? (onTimeDeliveries / deliveredOrders) * 100 : 0;
    const averageDeliveryDays = deliveredOrders > 0 ? totalDeliveryDays / deliveredOrders : 0;

    // Calculate quality metrics
    const totalGRNs = purchaseOrders.reduce((sum, po) => sum + po.grnRecords.length, 0);
    const passedGRNs = purchaseOrders.reduce((sum, po) => {
      return sum + po.grnRecords.filter(grn => grn.qcStatus === 'PASSED').length;
    }, 0);
    const failedGRNs = totalGRNs - passedGRNs;
    const qualityPerformance = totalGRNs > 0 ? (passedGRNs / totalGRNs) * 100 : 0;

    // Calculate pricing metrics (simplified)
    const averageDiscount = 0; // Would need discount data in PO
    const priceVariance = 0; // Would need market price comparison
    const competitiveness = 75; // Placeholder - would need market analysis

    // Calculate overall rating (weighted average)
    const deliveryWeight = 0.4;
    const qualityWeight = 0.4;
    const pricingWeight = 0.2;

    const overallRating = (
      (deliveryPerformance * deliveryWeight) +
      (qualityPerformance * qualityWeight) +
      (competitiveness * pricingWeight)
    ) / 100 * 5; // Convert to 5-point scale

    return {
      supplierId,
      period: { fromDate, toDate },
      orderMetrics: {
        totalOrders,
        totalValue,
        averageOrderValue
      },
      deliveryMetrics: {
        onTimeDeliveries,
        lateDeliveries,
        deliveryPerformance: Math.round(deliveryPerformance * 100) / 100,
        averageDeliveryDays: Math.round(averageDeliveryDays * 100) / 100
      },
      qualityMetrics: {
        totalGRNs,
        passedGRNs,
        failedGRNs,
        qualityPerformance: Math.round(qualityPerformance * 100) / 100
      },
      pricingMetrics: {
        averageDiscount,
        priceVariance,
        competitiveness
      },
      overallRating: Math.round(overallRating * 100) / 100
    };
  }

  async updateSupplierRating(supplierId: string, performanceMetrics: SupplierPerformanceMetrics) {
    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        rating: performanceMetrics.overallRating,
        updatedAt: new Date()
      }
    });

    return supplier;
  }

  async getTopPerformingSuppliers(limit: number = 10, branchId?: string) {
    const whereClause: any = { isActive: true };
    if (branchId) whereClause.branchId = branchId;

    return await prisma.supplier.findMany({
      where: whereClause,
      orderBy: { rating: 'desc' },
      take: limit,
      include: {
        branch: true,
        _count: {
          select: {
            purchaseOrders: true
          }
        }
      }
    });
  }

  // Supplier quote comparison and analysis tools
  async compareSupplierQuotes(rfqId: string) {
    const rfqResponses = await prisma.rFQResponse.findMany({
      where: { rfqId },
      include: {
        supplier: true,
        items: {
          include: {
            rfqItem: {
              include: {
                inventoryItem: true
              }
            }
          }
        }
      }
    });

    if (rfqResponses.length === 0) {
      throw new Error('No quotes found for this RFQ');
    }

    // Analyze quotes
    const analysis = rfqResponses.map(response => {
      const supplier = response.supplier;
      
      // Calculate price competitiveness
      const totalAmount = response.totalAmount;
      const itemCount = response.items.length;
      const avgItemPrice = itemCount > 0 ? totalAmount / itemCount : 0;

      // Calculate delivery score
      const deliveryScore = Math.max(0, (30 - response.deliveryDays) / 30 * 100);

      // Get supplier rating
      const supplierRating = supplier.rating || 0;
      const ratingScore = (supplierRating / 5) * 100;

      // Calculate overall score (40% price, 30% delivery, 30% supplier rating)
      const priceScore = 100 - (totalAmount / Math.max(...rfqResponses.map(r => r.totalAmount)) * 100);
      const overallScore = (priceScore * 0.4) + (deliveryScore * 0.3) + (ratingScore * 0.3);

      return {
        responseId: response.id,
        supplier: {
          id: supplier.id,
          name: supplier.name,
          code: supplier.code,
          rating: supplier.rating,
          city: supplier.city,
          state: supplier.state
        },
        quote: {
          totalAmount: response.totalAmount,
          deliveryDays: response.deliveryDays,
          validUntil: response.validUntil,
          terms: response.terms
        },
        analysis: {
          priceScore: Math.round(priceScore * 100) / 100,
          deliveryScore: Math.round(deliveryScore * 100) / 100,
          ratingScore: Math.round(ratingScore * 100) / 100,
          overallScore: Math.round(overallScore * 100) / 100
        },
        items: response.items.map(item => ({
          itemName: item.rfqItem.inventoryItem.name,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          remarks: item.remarks
        }))
      };
    });

    // Sort by overall score (highest first)
    analysis.sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);

    // Calculate market statistics
    const prices = rfqResponses.map(r => r.totalAmount);
    const deliveryTimes = rfqResponses.map(r => r.deliveryDays);

    const marketAnalysis = {
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((sum, price) => sum + price, 0) / prices.length
      },
      deliveryRange: {
        min: Math.min(...deliveryTimes),
        max: Math.max(...deliveryTimes),
        average: deliveryTimes.reduce((sum, days) => sum + days, 0) / deliveryTimes.length
      },
      totalResponses: rfqResponses.length
    };

    return {
      rfqId,
      marketAnalysis,
      supplierAnalysis: analysis,
      recommendation: analysis[0] // Best scoring supplier
    };
  }

  async getSupplierQuoteHistory(supplierId: string, itemId?: string, months: number = 12) {
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);

    const whereClause: any = {
      supplierId,
      submittedAt: { gte: fromDate }
    };

    const includeItems: any = {
      include: {
        rfqItem: {
          include: {
            inventoryItem: true
          }
        }
      }
    };

    if (itemId) {
      includeItems.where = { rfqItem: { inventoryItemId: itemId } };
    }

    const responses = await prisma.rFQResponse.findMany({
      where: whereClause,
      include: {
        rfq: true,
        items: includeItems
      },
      orderBy: { submittedAt: 'desc' }
    });

    return responses.map((response: any) => ({
      rfqTitle: response.rfq.title,
      submittedAt: response.submittedAt,
      totalAmount: response.totalAmount,
      deliveryDays: response.deliveryDays,
      status: response.status,
      items: response.items.map((item: any) => ({
        itemName: item.rfqItem.inventoryItem.name,
        quantity: item.rfqItem.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
    }));
  }

  // Vendor payment terms and credit management
  async updatePaymentTerms(supplierId: string, paymentTerms: {
    terms: string;
    creditLimit?: number;
    creditDays?: number;
    advancePercentage?: number;
  }, updatedBy: string) {
    // In a real implementation, you'd have a separate PaymentTerms table
    // For now, we'll update the supplier record directly
    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        // These fields would need to be added to the Supplier model
        updatedBy,
        updatedAt: new Date()
      }
    });

    // Log payment terms change
    console.log(`Payment terms updated for supplier ${supplier.code}: ${JSON.stringify(paymentTerms)}`);

    return supplier;
  }

  async getCreditUtilization(supplierId: string) {
    // Calculate current outstanding amount
    const outstandingPOs = await prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        status: { in: ['APPROVED', 'SENT', 'RECEIVED'] }
      }
    });

    const totalOutstanding = outstandingPOs.reduce((sum, po) => sum + po.finalAmount, 0);

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // In a real implementation, creditLimit would be a field in the supplier model
    const creditLimit = 1000000; // Placeholder
    const creditUtilization = creditLimit > 0 ? (totalOutstanding / creditLimit) * 100 : 0;

    return {
      supplierId,
      supplierName: supplier.name,
      creditLimit,
      outstandingAmount: totalOutstanding,
      availableCredit: Math.max(0, creditLimit - totalOutstanding),
      creditUtilization: Math.round(creditUtilization * 100) / 100,
      status: creditUtilization > 90 ? 'CRITICAL' : creditUtilization > 75 ? 'WARNING' : 'NORMAL'
    };
  }

  async getOverduePayments(supplierId?: string) {
    const whereClause: any = {
      status: 'RECEIVED' // Assuming received POs need payment
    };

    if (supplierId) {
      whereClause.supplierId = supplierId;
    }

    const overduePOs = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        supplier: true,
        grnRecords: true
      }
    });

    // Calculate overdue amounts (simplified logic)
    const overdueData = overduePOs.map(po => {
      const grn = po.grnRecords[0];
      if (!grn) return null;

      // Assuming 30-day payment terms
      const paymentDueDate = new Date(grn.receivedDate);
      paymentDueDate.setDate(paymentDueDate.getDate() + 30);

      const today = new Date();
      const isOverdue = today > paymentDueDate;
      const daysOverdue = isOverdue ? Math.ceil((today.getTime() - paymentDueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      return isOverdue ? {
        poNumber: po.poNumber,
        supplier: po.supplier,
        amount: po.finalAmount,
        dueDate: paymentDueDate,
        daysOverdue
      } : null;
    }).filter(Boolean);

    return overdueData;
  }

  // Supplier communication and document management
  async logCommunication(communication: Omit<SupplierCommunication, 'id' | 'communicatedAt'>) {
    // In a real implementation, you'd have a SupplierCommunication table
    const communicationRecord = {
      id: randomUUID(),
      ...communication,
      communicatedAt: new Date()
    };

    // For now, just log it
    console.log('Supplier Communication:', communicationRecord);

    return communicationRecord;
  }

  async getCommunicationHistory(supplierId: string, limit: number = 50) {
    // In a real implementation, you'd query the SupplierCommunication table
    // For now, return mock data
    return [
      {
        id: randomUUID(),
        supplierId,
        type: 'EMAIL' as const,
        subject: 'RFQ Response Required',
        content: 'Please submit your quote for RFQ-240101001',
        direction: 'OUTBOUND' as const,
        status: 'DELIVERED' as const,
        communicatedBy: 'system',
        communicatedAt: new Date()
      }
    ];
  }

  async uploadDocument(document: Omit<SupplierDocument, 'id' | 'uploadedAt'>) {
    // In a real implementation, you'd have a SupplierDocument table
    const documentRecord = {
      id: randomUUID(),
      ...document,
      uploadedAt: new Date()
    };

    // For now, just log it
    console.log('Supplier Document Uploaded:', documentRecord);

    return documentRecord;
  }

  async getSupplierDocuments(supplierId: string, documentType?: string) {
    // In a real implementation, you'd query the SupplierDocument table
    // For now, return mock data
    return [
      {
        id: randomUUID(),
        supplierId,
        documentType: 'CONTRACT' as const,
        documentName: 'Annual Supply Agreement 2024',
        filePath: '/documents/suppliers/contract_2024.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        expiryDate: new Date('2024-12-31'),
        isActive: true,
        uploadedBy: 'admin',
        uploadedAt: new Date()
      }
    ];
  }

  // Vendor portal integration
  async createVendorPortalAccess(data: Omit<VendorPortalAccess, 'id' | 'createdAt'>) {
    // In a real implementation, you'd have a VendorPortalUser table
    const portalAccess = {
      id: randomUUID(),
      ...data,
      createdAt: new Date()
    };

    // For now, just log it
    console.log('Vendor Portal Access Created:', portalAccess);

    return portalAccess;
  }

  async updateVendorPortalAccess(supplierId: string, updates: Partial<VendorPortalAccess>) {
    // In a real implementation, you'd update the VendorPortalUser table
    console.log(`Vendor Portal Access Updated for supplier ${supplierId}:`, updates);

    return { supplierId, ...updates, updatedAt: new Date() };
  }

  async getVendorPortalActivity(supplierId: string, days: number = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Get RFQ responses submitted through portal
    const rfqActivity = await prisma.rFQResponse.findMany({
      where: {
        supplierId,
        submittedAt: { gte: fromDate }
      },
      include: {
        rfq: true
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Get PO acknowledgments (in a real implementation, you'd have this data)
    const poActivity = await prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        orderDate: { gte: fromDate }
      },
      orderBy: { orderDate: 'desc' }
    });

    return {
      supplierId,
      period: { fromDate, toDate: new Date() },
      rfqResponses: rfqActivity.length,
      poAcknowledgments: poActivity.length,
      recentActivity: [
        ...rfqActivity.map(response => ({
          type: 'RFQ_RESPONSE',
          description: `Submitted quote for ${response.rfq.title}`,
          date: response.submittedAt,
          amount: response.totalAmount
        })),
        ...poActivity.map(po => ({
          type: 'PO_RECEIVED',
          description: `Purchase Order ${po.poNumber}`,
          date: po.orderDate,
          amount: po.finalAmount
        }))
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20)
    };
  }

  // Reporting and analytics
  async getSupplierDashboard(branchId?: string) {
    const whereClause: any = { isActive: true };
    if (branchId) whereClause.branchId = branchId;

    const [
      totalSuppliers,
      activeSuppliers,
      topSuppliers,
      recentRFQs,
      pendingPayments
    ] = await Promise.all([
      prisma.supplier.count({ where: { ...whereClause, isActive: undefined } }),
      prisma.supplier.count({ where: whereClause }),
      this.getTopPerformingSuppliers(5, branchId),
      prisma.rFQ.count({ where: { status: 'SENT' } }),
      this.getOverduePayments()
    ]);

    return {
      summary: {
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers: totalSuppliers - activeSuppliers,
        pendingRFQs: recentRFQs,
        overduePayments: pendingPayments.length
      },
      topPerformers: topSuppliers,
      alerts: [
        ...(pendingPayments.length > 0 ? [{
          type: 'OVERDUE_PAYMENTS',
          message: `${pendingPayments.length} payments are overdue`,
          priority: 'HIGH'
        }] : [])
      ]
    };
  }

  async generateSupplierReport(supplierId: string, reportType: 'PERFORMANCE' | 'FINANCIAL' | 'COMPLIANCE') {
    const supplier = await this.getSupplier(supplierId);
    const performance = await this.calculateSupplierPerformance(supplierId);

    switch (reportType) {
      case 'PERFORMANCE':
        return {
          supplier,
          performance,
          recommendations: this.generatePerformanceRecommendations(performance)
        };
      
      case 'FINANCIAL':
        const creditInfo = await this.getCreditUtilization(supplierId);
        const overduePayments = await this.getOverduePayments(supplierId);
        return {
          supplier,
          creditInfo,
          overduePayments,
          paymentHistory: [] // Would implement payment history
        };
      
      case 'COMPLIANCE':
        const documents = await this.getSupplierDocuments(supplierId);
        return {
          supplier,
          documents,
          complianceStatus: this.assessComplianceStatus(documents)
        };
      
      default:
        throw new Error('Invalid report type');
    }
  }

  private generatePerformanceRecommendations(performance: SupplierPerformanceMetrics) {
    const recommendations = [];

    if (performance.deliveryMetrics.deliveryPerformance < 80) {
      recommendations.push({
        type: 'DELIVERY_IMPROVEMENT',
        message: 'Delivery performance is below 80%. Consider discussing delivery schedules with supplier.',
        priority: 'HIGH'
      });
    }

    if (performance.qualityMetrics.qualityPerformance < 90) {
      recommendations.push({
        type: 'QUALITY_IMPROVEMENT',
        message: 'Quality performance is below 90%. Consider quality improvement discussions.',
        priority: 'MEDIUM'
      });
    }

    if (performance.overallRating < 3) {
      recommendations.push({
        type: 'SUPPLIER_REVIEW',
        message: 'Overall rating is below 3. Consider supplier review or replacement.',
        priority: 'HIGH'
      });
    }

    return recommendations;
  }

  private assessComplianceStatus(documents: any[]) {
    const requiredDocs = ['CONTRACT', 'CERTIFICATE'];
    const availableDocs = documents.map(doc => doc.documentType);
    const missingDocs = requiredDocs.filter(type => !availableDocs.includes(type));
    
    const expiredDocs = documents.filter(doc => 
      doc.expiryDate && new Date(doc.expiryDate) < new Date()
    );

    return {
      status: missingDocs.length === 0 && expiredDocs.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
      missingDocuments: missingDocs,
      expiredDocuments: expiredDocs,
      complianceScore: Math.max(0, 100 - (missingDocs.length * 20) - (expiredDocs.length * 10))
    };
  }
}

export const supplierService = new SupplierService();