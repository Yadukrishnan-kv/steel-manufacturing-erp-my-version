import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export interface PurchaseRequisitionCreateData {
  requestedBy: string;
  department: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requiredDate: Date;
  remarks?: string;
  items: {
    inventoryItemId: string;
    quantity: number;
    estimatedCost?: number;
    justification?: string;
  }[];
}

export interface RFQCreateData {
  title: string;
  description?: string;
  dueDate: Date;
  items: {
    inventoryItemId: string;
    quantity: number;
    specifications?: string;
  }[];
  supplierIds: string[];
}

export interface RFQResponseData {
  rfqId: string;
  supplierId: string;
  totalAmount: number;
  deliveryDays: number;
  validUntil: Date;
  terms?: string;
  items: {
    rfqItemId: string;
    unitPrice: number;
    totalPrice: number;
    remarks?: string;
  }[];
}

export interface PurchaseOrderCreateData {
  supplierId: string;
  prId?: string;
  deliveryDate: Date;
  terms?: string;
  items: {
    inventoryItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface GRNCreateData {
  poId: string;
  receivedBy: string;
  items: {
    poItemId: string;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty?: number;
    batchNumber?: string;
    expiryDate?: Date;
    remarks?: string;
  }[];
  qcRemarks?: string;
}

export interface SupplierEvaluationData {
  supplierId: string;
  deliveryRating: number; // 1-5 scale
  qualityRating: number; // 1-5 scale
  pricingRating: number; // 1-5 scale
  evaluationPeriod: string; // YYYY-MM format
  comments?: string;
}

export class ProcurementService {
  // Automatic purchase requisition generation from stock-outs
  async generateAutomaticPR(stockOutItems: { inventoryItemId: string; requiredQuantity: number; urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }[], requestedBy: string, department: string = 'PROCUREMENT') {
    const prNumber = this.generatePRNumber();
    
    const pr = await prisma.purchaseRequisition.create({
      data: {
        id: randomUUID(),
        prNumber,
        requestedBy,
        department,
        priority: this.determinePRPriority(stockOutItems),
        status: 'PENDING',
        requiredDate: this.calculateRequiredDate(stockOutItems),
        remarks: 'Auto-generated from stock-out conditions',
        items: {
          create: stockOutItems.map(item => ({
            id: randomUUID(),
            inventoryItemId: item.inventoryItemId,
            quantity: item.requiredQuantity,
            justification: `Stock-out detected. Urgency: ${item.urgency}`
          }))
        }
      },
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    return pr;
  }

  async createPurchaseRequisition(data: PurchaseRequisitionCreateData) {
    const prNumber = this.generatePRNumber();

    const pr = await prisma.purchaseRequisition.create({
      data: {
        id: randomUUID(),
        prNumber,
        requestedBy: data.requestedBy,
        department: data.department,
        priority: data.priority || 'MEDIUM',
        status: 'PENDING',
        requiredDate: data.requiredDate,
        remarks: data.remarks || null,
        items: {
          create: data.items.map(item => ({
            id: randomUUID(),
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            estimatedCost: item.estimatedCost || null,
            justification: item.justification || null
          }))
        }
      },
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    return pr;
  }

  private generatePRNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PR${year}${month}${day}${random}`;
  }

  private determinePRPriority(stockOutItems: { urgency: string }[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const urgencies = stockOutItems.map(item => item.urgency);
    if (urgencies.includes('URGENT')) return 'URGENT';
    if (urgencies.includes('HIGH')) return 'HIGH';
    if (urgencies.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  private calculateRequiredDate(stockOutItems: { urgency: string }[]): Date {
    const priority = this.determinePRPriority(stockOutItems);
    const date = new Date();
    
    switch (priority) {
      case 'URGENT':
        date.setDate(date.getDate() + 1); // Next day
        break;
      case 'HIGH':
        date.setDate(date.getDate() + 3); // 3 days
        break;
      case 'MEDIUM':
        date.setDate(date.getDate() + 7); // 1 week
        break;
      default:
        date.setDate(date.getDate() + 14); // 2 weeks
    }
    
    return date;
  }

  async approvePurchaseRequisition(prId: string, approvedBy: string) {
    const pr = await prisma.purchaseRequisition.update({
      where: { id: prId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date()
      },
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    return pr;
  }

  async rejectPurchaseRequisition(prId: string, rejectedBy: string, remarks?: string) {
    const pr = await prisma.purchaseRequisition.update({
      where: { id: prId },
      data: {
        status: 'REJECTED',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        remarks: remarks || 'Rejected'
      },
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    return pr;
  }

  // RFQ (Request for Quotation) management system with vendor comparison
  async createRFQ(data: RFQCreateData) {
    const rfqNumber = this.generateRFQNumber();

    const rfq = await prisma.rFQ.create({
      data: {
        id: randomUUID(),
        rfqNumber,
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate,
        status: 'SENT',
        items: {
          create: data.items.map(item => ({
            id: randomUUID(),
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            specifications: item.specifications || null
          }))
        }
      },
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    // Send RFQ to suppliers (in a real system, this would trigger email/portal notifications)
    await this.notifySuppliers(rfq.id, data.supplierIds);

    return rfq;
  }

  private generateRFQNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RFQ${year}${month}${day}${random}`;
  }

  private async notifySuppliers(rfqId: string, supplierIds: string[]) {
    // In a real implementation, this would send notifications via email/portal
    // For now, we'll just log the notification
    console.log(`RFQ ${rfqId} sent to suppliers: ${supplierIds.join(', ')}`);
  }

  async submitRFQResponse(data: RFQResponseData) {
    const response = await prisma.rFQResponse.create({
      data: {
        id: randomUUID(),
        rfqId: data.rfqId,
        supplierId: data.supplierId,
        totalAmount: data.totalAmount,
        deliveryDays: data.deliveryDays,
        validUntil: data.validUntil,
        terms: data.terms || null,
        status: 'SUBMITTED',
        items: {
          create: data.items.map(item => ({
            id: randomUUID(),
            rfqItemId: item.rfqItemId,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            remarks: item.remarks || null
          }))
        }
      },
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

    return response;
  }

  async compareRFQResponses(rfqId: string) {
    const responses = await prisma.rFQResponse.findMany({
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

    // Calculate comparison metrics
    const comparison = responses.map(response => {
      const supplier = response.supplier;
      
      return {
        responseId: response.id,
        supplier: {
          id: supplier.id,
          name: supplier.name,
          rating: supplier.rating || 0
        },
        pricing: {
          totalAmount: response.totalAmount,
          averageUnitPrice: response.items.reduce((sum, item) => sum + item.unitPrice, 0) / response.items.length
        },
        delivery: {
          deliveryDays: response.deliveryDays,
          validUntil: response.validUntil
        },
        qualityRating: supplier.rating || 0,
        overallScore: this.calculateOverallScore(response.totalAmount, response.deliveryDays, supplier.rating || 0),
        terms: response.terms,
        items: response.items
      };
    });

    // Sort by overall score (higher is better)
    comparison.sort((a, b) => b.overallScore - a.overallScore);

    return {
      rfqId,
      totalResponses: responses.length,
      comparison,
      recommendation: comparison[0] // Best scoring response
    };
  }

  private calculateOverallScore(totalAmount: number, deliveryDays: number, supplierRating: number): number {
    // Scoring algorithm: 40% price, 30% delivery, 30% supplier rating
    const maxAmount = 1000000; // Normalize price (adjust based on business)
    const maxDeliveryDays = 30; // Normalize delivery time
    
    const priceScore = Math.max(0, (maxAmount - totalAmount) / maxAmount) * 40;
    const deliveryScore = Math.max(0, (maxDeliveryDays - deliveryDays) / maxDeliveryDays) * 30;
    const ratingScore = (supplierRating / 5) * 30;
    
    return priceScore + deliveryScore + ratingScore;
  }

  async selectRFQResponse(responseId: string, selectedBy: string) {
    // Mark selected response
    await prisma.rFQResponse.update({
      where: { id: responseId },
      data: { status: 'SELECTED' }
    });

    // Mark other responses as rejected
    const selectedResponse = await prisma.rFQResponse.findUnique({
      where: { id: responseId }
    });

    if (selectedResponse) {
      await prisma.rFQResponse.updateMany({
        where: {
          rfqId: selectedResponse.rfqId,
          id: { not: responseId }
        },
        data: { status: 'REJECTED' }
      });

      // Update RFQ status
      await prisma.rFQ.update({
        where: { id: selectedResponse.rfqId },
        data: { status: 'EVALUATED' }
      });
    }

    return await prisma.rFQResponse.findUnique({
      where: { id: responseId },
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
  }

  // Supplier evaluation and rating system
  async evaluateSupplier(data: SupplierEvaluationData) {
    // Calculate overall rating (average of delivery, quality, and pricing)
    const overallRating = (data.deliveryRating + data.qualityRating + data.pricingRating) / 3;

    // Update supplier rating
    await prisma.supplier.update({
      where: { id: data.supplierId },
      data: { rating: overallRating }
    });

    // Create evaluation record (you might want to add a SupplierEvaluation model)
    // For now, we'll return the evaluation data
    return {
      supplierId: data.supplierId,
      evaluationPeriod: data.evaluationPeriod,
      ratings: {
        delivery: data.deliveryRating,
        quality: data.qualityRating,
        pricing: data.pricingRating,
        overall: overallRating
      },
      comments: data.comments
    };
  }

  async getSupplierPerformance(supplierId: string, periodMonths: number = 12) {
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - periodMonths);

    // Get purchase orders for the supplier in the period
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        orderDate: { gte: fromDate }
      },
      include: {
        grnRecords: true
      }
    });

    // Calculate performance metrics
    const totalOrders = purchaseOrders.length;
    const onTimeDeliveries = purchaseOrders.filter(po => {
      const grn = po.grnRecords[0];
      return grn && grn.receivedDate <= po.deliveryDate;
    }).length;

    const qualityAcceptance = purchaseOrders.reduce((acc, po) => {
      const grn = po.grnRecords[0];
      if (grn && grn.qcStatus === 'PASSED') acc++;
      return acc;
    }, 0);

    const deliveryPerformance = totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0;
    const qualityPerformance = totalOrders > 0 ? (qualityAcceptance / totalOrders) * 100 : 0;

    return {
      supplierId,
      period: { months: periodMonths, fromDate },
      metrics: {
        totalOrders,
        onTimeDeliveries,
        deliveryPerformance: Math.round(deliveryPerformance * 100) / 100,
        qualityAcceptance,
        qualityPerformance: Math.round(qualityPerformance * 100) / 100
      }
    };
  }

  // Purchase order management with multi-level approval workflows
  async createPurchaseOrder(data: PurchaseOrderCreateData, createdBy: string) {
    const poNumber = this.generatePONumber();
    const taxAmount = this.calculateTax(data.items);
    const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const finalAmount = totalAmount + taxAmount;

    const po = await prisma.purchaseOrder.create({
      data: {
        id: randomUUID(),
        poNumber,
        supplierId: data.supplierId,
        prId: data.prId || null,
        deliveryDate: data.deliveryDate,
        totalAmount,
        taxAmount,
        finalAmount,
        status: this.requiresApproval(finalAmount) ? 'PENDING' : 'APPROVED',
        terms: data.terms || null,
        createdBy,
        items: {
          create: data.items.map(item => ({
            id: randomUUID(),
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            pendingQty: item.quantity
          }))
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    // If PR is linked, mark it as converted
    if (data.prId) {
      await prisma.purchaseRequisition.update({
        where: { id: data.prId },
        data: { status: 'CONVERTED' }
      });
    }

    return po;
  }

  private generatePONumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PO${year}${month}${day}${random}`;
  }

  private calculateTax(items: { totalPrice: number }[]): number {
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    // Assuming 18% GST (adjust based on business requirements)
    return totalAmount * 0.18;
  }

  private requiresApproval(amount: number): boolean {
    // Define approval thresholds (adjust based on business requirements)
    return amount > 50000; // Amounts above 50,000 require approval
  }

  async approvePurchaseOrder(poId: string, approvedBy: string) {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date()
      },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    return po;
  }

  async sendPurchaseOrder(poId: string) {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'SENT' },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    // In a real system, this would send the PO to the supplier via email/portal
    console.log(`Purchase Order ${po.poNumber} sent to supplier ${po.supplier.name}`);

    return po;
  }

  // GRN (Goods Receipt Note) processing with QC integration
  async createGRN(data: GRNCreateData) {
    const grnNumber = this.generateGRNNumber();

    const grn = await prisma.gRNRecord.create({
      data: {
        id: randomUUID(),
        grnNumber,
        poId: data.poId,
        receivedBy: data.receivedBy,
        qcStatus: 'PENDING',
        qcRemarks: data.qcRemarks || null,
        status: 'RECEIVED',
        items: {
          create: data.items.map(item => ({
            id: randomUUID(),
            poItemId: item.poItemId,
            receivedQty: item.receivedQty,
            acceptedQty: item.acceptedQty,
            rejectedQty: item.rejectedQty || 0,
            batchNumber: item.batchNumber || null,
            expiryDate: item.expiryDate || null,
            remarks: item.remarks || null
          }))
        }
      },
      include: {
        po: {
          include: {
            supplier: true,
            items: {
              include: {
                inventoryItem: true
              }
            }
          }
        },
        items: {
          include: {
            poItem: {
              include: {
                inventoryItem: true
              }
            }
          }
        }
      }
    });

    // Update PO item received quantities
    for (const item of data.items) {
      const poItem = await prisma.purchaseOrderItem.findUnique({
        where: { id: item.poItemId }
      });

      if (poItem) {
        await prisma.purchaseOrderItem.update({
          where: { id: item.poItemId },
          data: {
            receivedQty: poItem.receivedQty + item.receivedQty,
            pendingQty: poItem.pendingQty - item.receivedQty
          }
        });
      }
    }

    return grn;
  }

  private generateGRNNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GRN${year}${month}${day}${random}`;
  }

  async updateGRNQCStatus(grnId: string, qcStatus: 'PASSED' | 'FAILED', qcRemarks?: string) {
    const grn = await prisma.gRNRecord.update({
      where: { id: grnId },
      data: {
        qcStatus,
        qcRemarks: qcRemarks || null,
        status: qcStatus === 'PASSED' ? 'ACCEPTED' : 'REJECTED'
      },
      include: {
        po: {
          include: {
            supplier: true
          }
        },
        items: {
          include: {
            poItem: {
              include: {
                inventoryItem: true
              }
            }
          }
        }
      }
    });

    // If QC passed, update inventory stock levels
    if (qcStatus === 'PASSED') {
      await this.updateInventoryFromGRN(grn);
    }

    return grn;
  }

  private async updateInventoryFromGRN(grn: any) {
    // This would integrate with the inventory service to update stock levels
    // For now, we'll create stock transactions
    for (const item of grn.items) {
      if (item.acceptedQty > 0) {
        // Create stock transaction for accepted quantity
        await prisma.stockTransaction.create({
          data: {
            id: randomUUID(),
            transactionType: 'IN',
            inventoryItemId: item.poItem.inventoryItemId,
            warehouseId: item.poItem.inventoryItem.warehouseId,
            quantity: item.acceptedQty,
            unitCost: item.poItem.unitPrice,
            totalValue: item.acceptedQty * item.poItem.unitPrice,
            referenceType: 'GRN',
            referenceId: grn.id,
            remarks: `Goods received via GRN ${grn.grnNumber}`,
            createdBy: grn.receivedBy
          }
        });

        // Update inventory item stock levels
        const inventoryItem = await prisma.inventoryItem.findUnique({
          where: { id: item.poItem.inventoryItemId }
        });

        if (inventoryItem) {
          await prisma.inventoryItem.update({
            where: { id: item.poItem.inventoryItemId },
            data: {
              currentStock: inventoryItem.currentStock + item.acceptedQty,
              availableStock: inventoryItem.availableStock + item.acceptedQty
            }
          });
        }
      }
    }
  }

  // Purchase order tracking and delivery monitoring
  async getPurchaseOrderStatus(poId: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
            grnItems: {
              include: {
                grn: true
              }
            }
          }
        },
        grnRecords: {
          include: {
            items: true
          }
        }
      }
    });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    // Calculate delivery status
    const totalItems = po.items.length;
    const totalQuantity = po.items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedQuantity = po.items.reduce((sum, item) => sum + item.receivedQty, 0);
    const pendingQuantity = po.items.reduce((sum, item) => sum + item.pendingQty, 0);

    const deliveryStatus = {
      totalQuantity,
      receivedQuantity,
      pendingQuantity,
      deliveryPercentage: totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0,
      isOverdue: new Date() > po.deliveryDate && pendingQuantity > 0,
      daysOverdue: new Date() > po.deliveryDate ? Math.ceil((new Date().getTime() - po.deliveryDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
    };

    return {
      ...po,
      deliveryStatus
    };
  }

  async getOverduePurchaseOrders() {
    const today = new Date();
    
    const overduePOs = await prisma.purchaseOrder.findMany({
      where: {
        deliveryDate: { lt: today },
        status: { in: ['APPROVED', 'SENT'] },
        items: {
          some: {
            pendingQty: { gt: 0 }
          }
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    return overduePOs.map(po => ({
      ...po,
      daysOverdue: Math.ceil((today.getTime() - po.deliveryDate.getTime()) / (1000 * 60 * 60 * 24)),
      pendingValue: po.items.reduce((sum, item) => sum + (item.pendingQty * item.unitPrice), 0)
    }));
  }

  // Inter-branch stock transfers (procurement perspective)
  async requestInterBranchTransfer(fromBranchId: string, toBranchId: string, items: { inventoryItemId: string; requestedQty: number; justification?: string }[], requestedBy: string) {
    const transferNumber = this.generateTransferNumber();

    const transfer = await prisma.stockTransfer.create({
      data: {
        id: randomUUID(),
        transferNumber,
        fromBranchId,
        toBranchId,
        status: 'PENDING',
        requestedDate: new Date(),
        remarks: 'Requested via procurement module',
        createdBy: requestedBy,
        items: {
          create: items.map(item => ({
            id: randomUUID(),
            inventoryItemId: item.inventoryItemId,
            requestedQty: item.requestedQty,
            remarks: item.justification || null
          }))
        }
      },
      include: {
        fromBranch: true,
        toBranch: true,
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    return transfer;
  }

  private generateTransferNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ST${year}${month}${day}${random}`;
  }

  // Reporting and analytics
  async getProcurementDashboard(branchId?: string) {
    const whereClause: any = {};
    if (branchId) {
      // Add branch filtering logic if needed
    }

    const [
      pendingPRs,
      activePOs,
      overduePOs,
      pendingGRNs,
      monthlySpend
    ] = await Promise.all([
      prisma.purchaseRequisition.count({
        where: { status: 'PENDING' }
      }),
      prisma.purchaseOrder.count({
        where: { status: { in: ['APPROVED', 'SENT'] } }
      }),
      this.getOverduePurchaseOrders(),
      prisma.gRNRecord.count({
        where: { qcStatus: 'PENDING' }
      }),
      this.getMonthlyProcurementSpend()
    ]);

    return {
      summary: {
        pendingPRs,
        activePOs,
        overduePOs: overduePOs.length,
        pendingGRNs,
        monthlySpend: monthlySpend.totalAmount
      },
      overduePOs: overduePOs.slice(0, 10), // Top 10 overdue POs
      alerts: await this.getProcurementAlerts()
    };
  }

  private async getMonthlyProcurementSpend() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.purchaseOrder.aggregate({
      where: {
        orderDate: { gte: startOfMonth },
        status: { not: 'CANCELLED' }
      },
      _sum: {
        finalAmount: true
      }
    });

    return {
      totalAmount: result._sum.finalAmount || 0,
      period: startOfMonth
    };
  }

  private async getProcurementAlerts() {
    const alerts = [];

    // Check for overdue POs
    const overduePOs = await this.getOverduePurchaseOrders();
    if (overduePOs.length > 0) {
      alerts.push({
        type: 'OVERDUE_PO',
        message: `${overduePOs.length} purchase orders are overdue`,
        priority: 'HIGH',
        count: overduePOs.length
      });
    }

    // Check for pending approvals
    const pendingApprovals = await prisma.purchaseOrder.count({
      where: { status: 'PENDING' }
    });
    if (pendingApprovals > 0) {
      alerts.push({
        type: 'PENDING_APPROVAL',
        message: `${pendingApprovals} purchase orders pending approval`,
        priority: 'MEDIUM',
        count: pendingApprovals
      });
    }

    return alerts;
  }

  // Get all purchase requisitions with filters
  async getPurchaseRequisitions(filters?: {
    status?: string;
    department?: string;
    priority?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const whereClause: any = {};

    if (filters?.status) whereClause.status = filters.status;
    if (filters?.department) whereClause.department = filters.department;
    if (filters?.priority) whereClause.priority = filters.priority;
    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) whereClause.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) whereClause.createdAt.lte = filters.dateTo;
    }

    return await prisma.purchaseRequisition.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get all purchase orders with filters
  async getPurchaseOrders(filters?: {
    status?: string;
    supplierId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const whereClause: any = {};

    if (filters?.status) whereClause.status = filters.status;
    if (filters?.supplierId) whereClause.supplierId = filters.supplierId;
    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.orderDate = {};
      if (filters.dateFrom) whereClause.orderDate.gte = filters.dateFrom;
      if (filters.dateTo) whereClause.orderDate.lte = filters.dateTo;
    }

    return await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true
          }
        },
        grnRecords: true
      },
      orderBy: { orderDate: 'desc' }
    });
  }

  // Get all RFQs with filters
  async getRFQs(filters?: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const whereClause: any = {};

    if (filters?.status) whereClause.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.issueDate = {};
      if (filters.dateFrom) whereClause.issueDate.gte = filters.dateFrom;
      if (filters.dateTo) whereClause.issueDate.lte = filters.dateTo;
    }

    return await prisma.rFQ.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        },
        responses: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: { issueDate: 'desc' }
    });
  }

  // Get all GRN records with filters
  async getGRNRecords(filters?: {
    status?: string;
    qcStatus?: string;
    supplierId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const whereClause: any = {};

    if (filters?.status) whereClause.status = filters.status;
    if (filters?.qcStatus) whereClause.qcStatus = filters.qcStatus;
    if (filters?.supplierId) {
      whereClause.po = {
        supplierId: filters.supplierId
      };
    }
    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.receivedDate = {};
      if (filters.dateFrom) whereClause.receivedDate.gte = filters.dateFrom;
      if (filters.dateTo) whereClause.receivedDate.lte = filters.dateTo;
    }

    return await prisma.gRNRecord.findMany({
      where: whereClause,
      include: {
        po: {
          include: {
            supplier: true
          }
        },
        items: {
          include: {
            poItem: {
              include: {
                inventoryItem: true
              }
            }
          }
        }
      },
      orderBy: { receivedDate: 'desc' }
    });
  }
}

export const procurementService = new ProcurementService();