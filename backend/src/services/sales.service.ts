// Sales Service - Core functionality for sales management
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface CreateLeadRequest {
  source: 'META' | 'GOOGLE' | 'REFERRAL' | 'DIRECT';
  sourceRef?: string;
  contactName: string;
  phone: string;
  email?: string;
  address?: string;
  requirements?: string;
  estimatedValue?: number;
  assignedTo?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface LeadWithMeasurements {
  id: string;
  leadNumber: string;
  customerId?: string;
  source: string;
  sourceRef?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  contactName: string;
  phone: string;
  email?: string;
  address?: string;
  requirements?: string;
  estimatedValue?: number;
  followUpDate?: Date;
  convertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  measurements: SiteMeasurementData[];
  estimates: EstimateData[];
}

export interface SiteMeasurementRequest {
  leadId: string;
  location: GeoLocation;
  photos: string[];
  measurements: MeasurementData;
  notes?: string;
  measuredBy?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface MeasurementData {
  width: number;
  height: number;
  depth?: number;
  area: number;
  unit: string;
  specifications?: Record<string, any>;
}

export interface SiteMeasurementData {
  id: string;
  leadId: string;
  location: string;
  photos: string;
  measurements: string;
  notes?: string;
  measuredBy?: string;
  measuredAt: Date;
}

export interface EstimationRequest {
  leadId: string;
  customerId?: string;
  items: EstimationItem[];
  discountPercentage?: number;
  validityDays?: number;
}

export interface EstimationItem {
  productId?: string;
  description: string;
  quantity: number;
  specifications: ProductSpecifications;
}

export interface ProductSpecifications {
  size: {
    width: number;
    height: number;
    depth?: number;
    unit: string;
  };
  coatingType: string;
  coatingColor?: string;
  hardware: HardwareSpecifications;
  glassType?: string;
  frameType?: string;
  customFeatures?: string[];
}

export interface HardwareSpecifications {
  lockType: string;
  hingeType: string;
  handleType: string;
  securityFeatures?: string[];
  accessories?: string[];
}

export interface EstimationResult {
  estimateId: string;
  estimateNumber: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  validUntil: Date;
  items: EstimatedItem[];
  breakdown: CostBreakdown;
}

export interface EstimatedItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications: ProductSpecifications;
  costBreakdown: ItemCostBreakdown;
}

export interface ItemCostBreakdown {
  materialCost: number;
  laborCost: number;
  hardwareCost: number;
  coatingCost: number;
  overheadCost: number;
  profitMargin: number;
}

export interface CostBreakdown {
  totalMaterialCost: number;
  totalLaborCost: number;
  totalHardwareCost: number;
  totalCoatingCost: number;
  totalOverheadCost: number;
  totalProfitMargin: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
}

export interface EstimateData {
  id: string;
  estimateNumber: string;
  leadId: string;
  customerId?: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  validUntil: Date;
  status: string;
  approvalStatus?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: EstimateItemData[];
}

export interface EstimateItemData {
  id: string;
  estimateId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

export interface SalesOrderRequest {
  customerId: string;
  estimateId?: string;
  deliveryDate: Date;
  items: SalesOrderItemRequest[];
  discountAmount?: number;
  taxAmount?: number;
  branchId: string;
}

export interface SalesOrderItemRequest {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  specifications?: ProductSpecifications;
}

export interface SalesOrderWithDetails {
  id: string;
  orderNumber: string;
  customerId: string;
  estimateId?: string;
  orderDate: Date;
  deliveryDate: Date;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  status: string;
  branchId: string;
  customer: CustomerData;
  items: SalesOrderItemData[];
  productionOrders: ProductionOrderData[];
}

export interface CustomerData {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
}

export interface SalesOrderItemData {
  id: string;
  salesOrderId: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

export interface ProductionOrderData {
  id: string;
  orderNumber: string;
  quantity: number;
  scheduledStartDate: Date;
  scheduledEndDate: Date;
  status: string;
}

export interface DiscountApprovalRequest {
  estimateId: string;
  discountPercentage: number;
  discountAmount: number;
  reason: string;
  requestedBy: string;
}

export interface DiscountApprovalResult {
  approvalId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverLevel: number;
  nextApprover: string;
  requiresEscalation: boolean;
}

export interface CustomerRequest {
  name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  branchId: string;
}

export interface SalesAnalytics {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalSalesValue: number;
  averageOrderValue: number;
  topProducts: ProductSalesData[];
  salesBySource: SourceSalesData[];
  monthlyTrends: MonthlySalesData[];
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalValue: number;
  orderCount: number;
}

export interface SourceSalesData {
  source: string;
  leadCount: number;
  convertedCount: number;
  conversionRate: number;
  totalValue: number;
}

export interface MonthlySalesData {
  month: string;
  leadCount: number;
  salesCount: number;
  salesValue: number;
  conversionRate: number;
}

export class SalesService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create lead with CRM capabilities and source tracking
   * Validates: Requirements 4.1 - External lead source attribution
   */
  async createLead(request: CreateLeadRequest): Promise<LeadWithMeasurements> {
    try {
      // Generate unique lead number
      const leadNumber = await this.generateLeadNumber();

      // Create lead record
      const lead = await this.prisma.lead.create({
        data: {
          leadNumber,
          source: request.source,
          sourceRef: request.sourceRef || null,
          contactName: request.contactName,
          phone: request.phone,
          email: request.email || null,
          address: request.address || null,
          requirements: request.requirements || null,
          estimatedValue: request.estimatedValue || null,
          assignedTo: request.assignedTo || null,
          priority: request.priority || 'MEDIUM',
          status: 'NEW',
        },
        include: {
          measurements: true,
          estimates: {
            include: {
              items: true,
            },
          },
        },
      });

      logger.info(`Lead ${leadNumber} created successfully`, {
        leadId: lead.id,
        source: request.source,
        sourceRef: request.sourceRef,
        contactName: request.contactName,
      });

      return lead as LeadWithMeasurements;
    } catch (error) {
      logger.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Capture geo-tagged site measurements with photo documentation
   * Validates: Requirements 4.2 - Geo-tagged measurement documentation
   */
  async captureSiteMeasurement(request: SiteMeasurementRequest): Promise<SiteMeasurementData> {
    try {
      // Validate lead exists
      const lead = await this.prisma.lead.findUnique({
        where: { id: request.leadId },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Create site measurement record
      const measurement = await this.prisma.siteMeasurement.create({
        data: {
          leadId: request.leadId,
          location: JSON.stringify(request.location),
          photos: JSON.stringify(request.photos),
          measurements: JSON.stringify(request.measurements),
          notes: request.notes || null,
          measuredBy: request.measuredBy || null,
        },
      });

      // Update lead status to indicate measurement completed
      await this.prisma.lead.update({
        where: { id: request.leadId },
        data: {
          status: 'QUALIFIED',
          updatedAt: new Date(),
        },
      });

      logger.info('Site measurement captured successfully', {
        measurementId: measurement.id,
        leadId: request.leadId,
        location: request.location,
        photoCount: request.photos.length,
      });

      return measurement as SiteMeasurementData;
    } catch (error) {
      logger.error('Error capturing site measurement:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive pricing estimation
   * Validates: Requirements 4.3 - Comprehensive pricing calculation
   */
  async generateEstimation(request: EstimationRequest): Promise<EstimationResult> {
    try {
      // Validate lead exists
      const lead = await this.prisma.lead.findUnique({
        where: { id: request.leadId },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Generate estimate number
      const estimateNumber = await this.generateEstimateNumber();

      // Calculate pricing for each item
      const estimatedItems: EstimatedItem[] = [];
      let totalAmount = 0;

      for (const item of request.items) {
        const itemEstimation = await this.calculateItemPricing(item);
        estimatedItems.push(itemEstimation);
        totalAmount += itemEstimation.totalPrice;
      }

      // Calculate discount and final amount
      const discountAmount = request.discountPercentage 
        ? (totalAmount * request.discountPercentage) / 100 
        : 0;
      const finalAmount = totalAmount - discountAmount;

      // Calculate validity date
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (request.validityDays || 30));

      // Create estimate record
      const estimate = await this.prisma.estimate.create({
        data: {
          estimateNumber,
          leadId: request.leadId,
          customerId: request.customerId || null,
          totalAmount,
          discountAmount,
          finalAmount,
          validUntil,
          status: 'DRAFT',
        },
      });

      // Create estimate items
      for (const item of estimatedItems) {
        await this.prisma.estimateItem.create({
          data: {
            estimateId: estimate.id,
            productId: request.items.find(i => i.description === item.description)?.productId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            specifications: JSON.stringify(item.specifications),
          },
        });
      }

      // Calculate cost breakdown
      const breakdown = this.calculateCostBreakdown(estimatedItems, discountAmount, 0);

      logger.info(`Estimation ${estimateNumber} generated successfully`, {
        estimateId: estimate.id,
        leadId: request.leadId,
        totalAmount,
        finalAmount,
        itemCount: estimatedItems.length,
      });

      return {
        estimateId: estimate.id,
        estimateNumber,
        totalAmount,
        discountAmount,
        finalAmount,
        validUntil,
        items: estimatedItems,
        breakdown,
      };
    } catch (error) {
      logger.error('Error generating estimation:', error);
      throw error;
    }
  }

  /**
   * Calculate item pricing based on specifications
   * Validates: Requirements 4.3 - Size, coating, hardware, labor calculations
   */
  private async calculateItemPricing(item: EstimationItem): Promise<EstimatedItem> {
    try {
      const specs = item.specifications;
      
      // Calculate area for pricing
      const area = specs.size.width * specs.size.height;
      
      // Base material cost calculation (per sq unit)
      const baseMaterialRate = await this.getBaseMaterialRate(specs.frameType || 'STANDARD');
      const materialCost = area * baseMaterialRate;

      // Coating cost calculation
      const coatingRate = await this.getCoatingRate(specs.coatingType);
      const coatingCost = area * coatingRate;

      // Hardware cost calculation
      const hardwareCost = await this.calculateHardwareCost(specs.hardware);

      // Labor cost calculation (based on complexity and area)
      const laborComplexity = this.calculateLaborComplexity(specs);
      const baseLaborRate = 150; // Base rate per sq unit
      const laborCost = area * baseLaborRate * laborComplexity;

      // Overhead cost (15% of material + labor)
      const overheadCost = (materialCost + laborCost) * 0.15;

      // Profit margin (20% of total cost)
      const totalCost = materialCost + coatingCost + hardwareCost + laborCost + overheadCost;
      const profitMargin = totalCost * 0.20;

      const unitPrice = (totalCost + profitMargin) / item.quantity;
      const totalPrice = unitPrice * item.quantity;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
        specifications: specs,
        costBreakdown: {
          materialCost: Math.round(materialCost * 100) / 100,
          laborCost: Math.round(laborCost * 100) / 100,
          hardwareCost: Math.round(hardwareCost * 100) / 100,
          coatingCost: Math.round(coatingCost * 100) / 100,
          overheadCost: Math.round(overheadCost * 100) / 100,
          profitMargin: Math.round(profitMargin * 100) / 100,
        },
      };
    } catch (error) {
      logger.error('Error calculating item pricing:', error);
      throw error;
    }
  }

  /**
   * Get base material rate based on frame type
   */
  private async getBaseMaterialRate(frameType: string): Promise<number> {
    const rates: Record<string, number> = {
      'STANDARD': 250,
      'PREMIUM': 350,
      'LUXURY': 500,
      'CUSTOM': 600,
    };
    return rates[frameType] || rates['STANDARD']!;
  }

  /**
   * Get coating rate based on coating type
   */
  private async getCoatingRate(coatingType: string): Promise<number> {
    const rates: Record<string, number> = {
      'POWDER_COATING': 80,
      'ANODIZING': 120,
      'WOOD_FINISH': 150,
      'SPECIAL_COATING': 200,
    };
    return rates[coatingType] || rates['POWDER_COATING']!;
  }

  /**
   * Calculate hardware cost based on specifications
   */
  private async calculateHardwareCost(hardware: HardwareSpecifications): Promise<number> {
    let cost = 0;

    // Lock cost
    const lockCosts: Record<string, number> = {
      'STANDARD': 500,
      'MULTI_POINT': 1200,
      'SMART_LOCK': 2500,
      'SECURITY_LOCK': 1800,
    };
    cost += lockCosts[hardware.lockType] || lockCosts['STANDARD']!;

    // Hinge cost
    const hingeCosts: Record<string, number> = {
      'STANDARD': 200,
      'HEAVY_DUTY': 400,
      'CONCEALED': 600,
      'ADJUSTABLE': 500,
    };
    cost += hingeCosts[hardware.hingeType] || hingeCosts['STANDARD']!;

    // Handle cost
    const handleCosts: Record<string, number> = {
      'STANDARD': 300,
      'DESIGNER': 800,
      'PREMIUM': 1200,
      'CUSTOM': 1500,
    };
    cost += handleCosts[hardware.handleType] || handleCosts['STANDARD']!;

    // Security features
    if (hardware.securityFeatures) {
      cost += hardware.securityFeatures.length * 500;
    }

    // Accessories
    if (hardware.accessories) {
      cost += hardware.accessories.length * 200;
    }

    return cost;
  }

  /**
   * Calculate labor complexity multiplier
   */
  private calculateLaborComplexity(specs: ProductSpecifications): number {
    let complexity = 1.0;

    // Size complexity
    const area = specs.size.width * specs.size.height;
    if (area > 10) complexity += 0.2; // Large size
    if (area > 20) complexity += 0.3; // Extra large

    // Coating complexity
    if (specs.coatingType === 'WOOD_FINISH' || specs.coatingType === 'SPECIAL_COATING') {
      complexity += 0.3;
    }

    // Hardware complexity
    if (specs.hardware.lockType === 'SMART_LOCK' || specs.hardware.lockType === 'MULTI_POINT') {
      complexity += 0.2;
    }

    // Custom features
    if (specs.customFeatures && specs.customFeatures.length > 0) {
      complexity += specs.customFeatures.length * 0.1;
    }

    return Math.min(complexity, 2.0); // Cap at 2x complexity
  }

  /**
   * Calculate comprehensive cost breakdown
   */
  private calculateCostBreakdown(items: EstimatedItem[], discountAmount: number, taxAmount: number): CostBreakdown {
    const totalMaterialCost = items.reduce((sum, item) => sum + item.costBreakdown.materialCost, 0);
    const totalLaborCost = items.reduce((sum, item) => sum + item.costBreakdown.laborCost, 0);
    const totalHardwareCost = items.reduce((sum, item) => sum + item.costBreakdown.hardwareCost, 0);
    const totalCoatingCost = items.reduce((sum, item) => sum + item.costBreakdown.coatingCost, 0);
    const totalOverheadCost = items.reduce((sum, item) => sum + item.costBreakdown.overheadCost, 0);
    const totalProfitMargin = items.reduce((sum, item) => sum + item.costBreakdown.profitMargin, 0);

    const subtotal = totalMaterialCost + totalLaborCost + totalHardwareCost + 
                    totalCoatingCost + totalOverheadCost + totalProfitMargin;
    const finalAmount = subtotal - discountAmount + taxAmount;

    return {
      totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
      totalLaborCost: Math.round(totalLaborCost * 100) / 100,
      totalHardwareCost: Math.round(totalHardwareCost * 100) / 100,
      totalCoatingCost: Math.round(totalCoatingCost * 100) / 100,
      totalOverheadCost: Math.round(totalOverheadCost * 100) / 100,
      totalProfitMargin: Math.round(totalProfitMargin * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
    };
  }

  /**
   * Process discount approval workflow with hierarchy routing
   * Validates: Requirements 4.4 - Discount approval workflow routing
   */
  async processDiscountApproval(request: DiscountApprovalRequest): Promise<DiscountApprovalResult> {
    try {
      // Validate estimate exists
      const estimate = await this.prisma.estimate.findUnique({
        where: { id: request.estimateId },
      });

      if (!estimate) {
        throw new Error('Estimate not found');
      }

      // Determine approval level based on discount percentage
      const approverLevel = this.getRequiredApprovalLevel(request.discountPercentage);
      const nextApprover = await this.getNextApprover(approverLevel, request.requestedBy);

      // Create approval record (assuming we have an approval table)
      const approvalId = `DA-${Date.now()}`;

      // Update estimate with approval status
      await this.prisma.estimate.update({
        where: { id: request.estimateId },
        data: {
          approvalStatus: 'PENDING',
          discountAmount: request.discountAmount,
          finalAmount: estimate.totalAmount - request.discountAmount,
        },
      });

      logger.info('Discount approval request created', {
        approvalId,
        estimateId: request.estimateId,
        discountPercentage: request.discountPercentage,
        approverLevel,
        nextApprover,
      });

      return {
        approvalId,
        status: 'PENDING',
        approverLevel,
        nextApprover: nextApprover || '',
        requiresEscalation: approverLevel > 1,
      };
    } catch (error) {
      logger.error('Error processing discount approval:', error);
      throw error;
    }
  }

  /**
   * Get required approval level based on discount percentage
   */
  private getRequiredApprovalLevel(discountPercentage: number): number {
    if (discountPercentage <= 5) return 1; // Team Leader
    if (discountPercentage <= 10) return 2; // Sales Manager
    if (discountPercentage <= 15) return 3; // Branch Manager
    return 4; // General Manager
  }

  /**
   * Get next approver based on level and requester
   */
  private async getNextApprover(level: number, requestedBy: string): Promise<string | undefined> {
    // This would typically query the organizational hierarchy
    // For now, return a placeholder based on level
    const approvers: Record<number, string> = {
      1: 'TEAM_LEADER',
      2: 'SALES_MANAGER',
      3: 'BRANCH_MANAGER',
      4: 'GENERAL_MANAGER',
    };
    return approvers[level];
  }

  /**
   * Create sales order with material validation and production order conversion
   * Validates: Requirements 4.5 - Sales order conversion validation
   */
  async createSalesOrder(request: SalesOrderRequest): Promise<SalesOrderWithDetails> {
    try {
      // Validate customer exists
      const customer = await this.prisma.customer.findUnique({
        where: { id: request.customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Validate material availability for all items
      await this.validateMaterialAvailability(request.items);

      // Generate sales order number
      const orderNumber = await this.generateSalesOrderNumber();

      // Calculate totals
      const totalAmount = request.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const discountAmount = request.discountAmount || 0;
      const taxAmount = request.taxAmount || (totalAmount - discountAmount) * 0.18; // 18% GST
      const finalAmount = totalAmount - discountAmount + taxAmount;

      // Create sales order
      const salesOrder = await this.prisma.salesOrder.create({
        data: {
          orderNumber,
          customerId: request.customerId,
          estimateId: request.estimateId || null,
          deliveryDate: request.deliveryDate,
          totalAmount,
          discountAmount,
          taxAmount,
          finalAmount,
          status: 'CONFIRMED',
          branchId: request.branchId,
        },
        include: {
          customer: true,
          items: true,
          productionOrders: true,
        },
      });

      // Create sales order items
      for (const item of request.items) {
        await this.prisma.salesOrderItem.create({
          data: {
            salesOrderId: salesOrder.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            specifications: item.specifications ? JSON.stringify(item.specifications) : null,
          },
        });
      }

      // Automatically convert to production orders
      await this.convertToProductionOrders(salesOrder.id, request.items);

      // Update lead status if estimate is linked
      if (request.estimateId) {
        const estimate = await this.prisma.estimate.findUnique({
          where: { id: request.estimateId },
          include: { lead: true },
        });

        if (estimate?.lead) {
          await this.prisma.lead.update({
            where: { id: estimate.leadId },
            data: {
              status: 'CONVERTED',
              convertedAt: new Date(),
            },
          });
        }
      }

      logger.info(`Sales order ${orderNumber} created successfully`, {
        salesOrderId: salesOrder.id,
        customerId: request.customerId,
        totalAmount: finalAmount,
        itemCount: request.items.length,
      });

      // Fetch complete sales order with details
      return await this.getSalesOrderWithDetails(salesOrder.id);
    } catch (error) {
      logger.error('Error creating sales order:', error);
      throw error;
    }
  }

  /**
   * Validate material availability for sales order items
   */
  private async validateMaterialAvailability(items: SalesOrderItemRequest[]): Promise<void> {
    const insufficientMaterials: string[] = [];

    for (const item of items) {
      // Get product BOM to check material requirements
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          boms: {
            where: { status: 'APPROVED' },
            include: {
              items: {
                include: {
                  inventoryItem: {
                    select: {
                      itemCode: true,
                      name: true,
                      availableStock: true,
                    },
                  },
                },
              },
            },
            orderBy: { effectiveDate: 'desc' },
            take: 1,
          },
        },
      });

      if (!product || !product.boms[0]) {
        insufficientMaterials.push(`No approved BOM found for product: ${item.description}`);
        continue;
      }

      const bom = product.boms[0];
      for (const bomItem of bom.items) {
        const requiredQuantity = bomItem.quantity * item.quantity * (1 + bomItem.scrapPercentage / 100);
        
        if (bomItem.inventoryItem.availableStock < requiredQuantity) {
          insufficientMaterials.push(
            `${bomItem.inventoryItem.itemCode}: Required ${requiredQuantity}, Available ${bomItem.inventoryItem.availableStock}`
          );
        }
      }
    }

    if (insufficientMaterials.length > 0) {
      throw new Error(`Insufficient materials: ${insufficientMaterials.join(', ')}`);
    }
  }

  /**
   * Convert sales order to production orders automatically
   */
  private async convertToProductionOrders(salesOrderId: string, items: SalesOrderItemRequest[]): Promise<void> {
    try {
      for (const item of items) {
        // Get approved BOM for the product
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            boms: {
              where: { status: 'APPROVED' },
              orderBy: { effectiveDate: 'desc' },
              take: 1,
            },
          },
        });

        if (!product || !product.boms[0]) {
          logger.warn(`No approved BOM found for product ${item.productId}, skipping production order creation`);
          continue;
        }

        const bom = product.boms[0];

        // Generate production order number
        const orderNumber = await this.generateProductionOrderNumber();

        // Calculate delivery date with buffer
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 14); // 14 days default

        // Create production order
        await this.prisma.productionOrder.create({
          data: {
            orderNumber,
            salesOrderId,
            bomId: bom.id,
            quantity: item.quantity,
            scheduledStartDate: new Date(),
            scheduledEndDate: deliveryDate,
            status: 'PLANNED',
            priority: 5,
            bufferDays: 2,
            branchId: (await this.prisma.salesOrder.findUnique({
              where: { id: salesOrderId },
              select: { branchId: true },
            }))?.branchId || '',
          },
        });

        logger.info(`Production order ${orderNumber} created for sales order item`, {
          salesOrderId,
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    } catch (error) {
      logger.error('Error converting to production orders:', error);
      throw error;
    }
  }

  /**
   * Create customer master data
   */
  async createCustomer(request: CustomerRequest): Promise<CustomerData> {
    try {
      // Generate customer code
      const customerCode = await this.generateCustomerCode();

      const customer = await this.prisma.customer.create({
        data: {
          code: customerCode,
          name: request.name,
          email: request.email || null,
          phone: request.phone,
          address: request.address,
          city: request.city,
          state: request.state,
          pincode: request.pincode,
          gstNumber: request.gstNumber || null,
          branchId: request.branchId,
        },
      });

      logger.info(`Customer ${customerCode} created successfully`, {
        customerId: customer.id,
        name: request.name,
        phone: request.phone,
      });

      return customer as CustomerData;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Get sales order with complete details
   */
  async getSalesOrderWithDetails(salesOrderId: string): Promise<SalesOrderWithDetails> {
    const salesOrder = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: {
        customer: true,
        items: true,
        productionOrders: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            scheduledStartDate: true,
            scheduledEndDate: true,
            status: true,
          },
        },
      },
    });

    if (!salesOrder) {
      throw new Error('Sales order not found');
    }

    return salesOrder as SalesOrderWithDetails;
  }

  /**
   * Get lead with measurements and estimates
   */
  async getLeadWithDetails(leadId: string): Promise<LeadWithMeasurements> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        measurements: true,
        estimates: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    return lead as LeadWithMeasurements;
  }

  /**
   * Generate sales analytics and reporting
   */
  async getSalesAnalytics(
    branchId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SalesAnalytics> {
    try {
      const whereClause: any = {};
      
      // Note: Lead model doesn't have branchId, so we filter by customer's branchId if needed
      if (branchId) {
        whereClause.customer = {
          branchId: branchId,
        };
      }
      
      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      // Get total leads
      const totalLeads = await this.prisma.lead.count({
        where: whereClause,
      });

      // Get converted leads
      const convertedLeads = await this.prisma.lead.count({
        where: {
          ...whereClause,
          status: 'CONVERTED',
        },
      });

      // Get sales orders (use separate where clause for sales orders)
      const salesOrderWhereClause: any = {};
      if (branchId) {
        salesOrderWhereClause.branchId = branchId;
      }
      if (startDate && endDate) {
        salesOrderWhereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      const salesOrders = await this.prisma.salesOrder.findMany({
        where: salesOrderWhereClause,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      const totalSalesValue = salesOrders.reduce((sum, order) => sum + order.finalAmount, 0);
      const averageOrderValue = salesOrders.length > 0 ? totalSalesValue / salesOrders.length : 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Calculate top products
      const productSales = new Map<string, ProductSalesData>();
      salesOrders.forEach(order => {
        order.items.forEach(item => {
          const key = item.productId;
          if (!productSales.has(key)) {
            productSales.set(key, {
              productId: item.productId,
              productName: item.description,
              totalQuantity: 0,
              totalValue: 0,
              orderCount: 0,
            });
          }
          const data = productSales.get(key)!;
          data.totalQuantity += item.quantity;
          data.totalValue += item.totalPrice;
          data.orderCount += 1;
        });
      });

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      // Calculate sales by source
      const leadsBySource = await this.prisma.lead.groupBy({
        by: ['source'],
        where: whereClause,
        _count: {
          id: true,
        },
      });

      const convertedBySource = await this.prisma.lead.groupBy({
        by: ['source'],
        where: {
          ...whereClause,
          status: 'CONVERTED',
        },
        _count: {
          id: true,
        },
      });

      const salesBySource: SourceSalesData[] = leadsBySource.map(source => {
        const converted = convertedBySource.find(c => c.source === source.source)?._count.id || 0;
        const sourceOrders = salesOrders.filter(order => {
          // This would need to be linked through estimate -> lead -> source
          // For now, we'll distribute evenly
          return true;
        });
        const sourceValue = sourceOrders.reduce((sum, order) => sum + order.finalAmount, 0) / leadsBySource.length;

        return {
          source: source.source,
          leadCount: source._count.id,
          convertedCount: converted,
          conversionRate: source._count.id > 0 ? (converted / source._count.id) * 100 : 0,
          totalValue: sourceValue,
        };
      });

      // Calculate monthly trends (simplified)
      const monthlyTrends: MonthlySalesData[] = [];
      // This would typically involve more complex date grouping
      // For now, return current month data
      const currentMonth = new Date().toISOString().substring(0, 7);
      monthlyTrends.push({
        month: currentMonth,
        leadCount: totalLeads,
        salesCount: salesOrders.length,
        salesValue: totalSalesValue,
        conversionRate,
      });

      return {
        totalLeads,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalSalesValue: Math.round(totalSalesValue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        topProducts,
        salesBySource,
        monthlyTrends,
      };
    } catch (error) {
      logger.error('Error getting sales analytics:', error);
      throw error;
    }
  }

  /**
   * Generate unique lead number
   */
  private async generateLeadNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const prefix = `LD${year}${month}`;
    
    const lastLead = await this.prisma.lead.findFirst({
      where: {
        leadNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        leadNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastLead) {
      const lastSequence = parseInt(lastLead.leadNumber.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Generate unique estimate number
   */
  private async generateEstimateNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const prefix = `EST${year}${month}`;
    
    const lastEstimate = await this.prisma.estimate.findFirst({
      where: {
        estimateNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        estimateNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastEstimate) {
      const lastSequence = parseInt(lastEstimate.estimateNumber.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Generate unique sales order number
   */
  private async generateSalesOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const prefix = `SO${year}${month}`;
    
    const lastOrder = await this.prisma.salesOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Generate unique customer code
   */
  private async generateCustomerCode(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    
    const prefix = `CUST${year}`;
    
    const lastCustomer = await this.prisma.customer.findFirst({
      where: {
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: 'desc',
      },
    });

    let sequence = 1;
    if (lastCustomer) {
      const lastSequence = parseInt(lastCustomer.code.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(5, '0')}`;
  }

  /**
   * Generate unique production order number
   */
  private async generateProductionOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const prefix = `PO${year}${month}`;
    
    const lastOrder = await this.prisma.productionOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}