// BOM Management Service - Multi-level BOM with revision control and engineering changes
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface CreateBOMRequest {
  productId: string;
  revision: string;
  effectiveDate: Date;
  engineeringChangeNumber?: string;
  items: BOMItemRequest[];
}

export interface BOMItemRequest {
  inventoryItemId: string;
  quantity: number;
  unit: string;
  scrapPercentage?: number;
  operation?: string;
  level?: number;
  parentItemId?: string;
  sequence?: number;
}

export interface UpdateBOMRequest {
  bomId: string;
  engineeringChangeNumber: string;
  newRevision: string;
  effectiveDate: Date;
  items: BOMItemRequest[];
  changeReason: string;
}

export interface BOMWithItems {
  id: string;
  productId: string;
  revision: string;
  effectiveDate: Date;
  status: string;
  engineeringChangeNumber?: string;
  approvedBy?: string;
  approvedAt?: Date;
  items: BOMItemWithDetails[];
  product: {
    code: string;
    name: string;
  };
}

export interface BOMItemWithDetails {
  id: string;
  inventoryItemId: string;
  quantity: number;
  unit: string;
  scrapPercentage: number;
  operation?: string;
  level: number;
  parentItemId?: string;
  sequence?: number;
  inventoryItem: {
    itemCode: string;
    name: string;
    category: string;
    standardCost?: number;
    currentStock: number;
  };
  childItems?: BOMItemWithDetails[];
}

export interface EngineeringChange {
  id: string;
  changeNumber: string;
  bomId: string;
  oldRevision: string;
  newRevision: string;
  changeReason: string;
  effectiveDate: Date;
  status: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  affectedProductionOrders: string[];
}

export class BOMService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create new BOM with multi-level structure
   * Validates: Requirements 1.5 - Multi-level BOM management
   */
  async createBOM(request: CreateBOMRequest, createdBy: string): Promise<BOMWithItems> {
    try {
      // Validate product exists
      const product = await this.prisma.product.findUnique({
        where: { id: request.productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Check if revision already exists
      const existingBOM = await this.prisma.bOM.findUnique({
        where: {
          productId_revision: {
            productId: request.productId,
            revision: request.revision,
          },
        },
      });

      if (existingBOM) {
        throw new Error(`BOM revision ${request.revision} already exists for this product`);
      }

      // Validate BOM items and calculate levels
      const validatedItems = await this.validateAndStructureBOMItems(request.items);

      // Create BOM
      const bom = await this.prisma.bOM.create({
        data: {
          productId: request.productId,
          revision: request.revision,
          effectiveDate: request.effectiveDate,
          status: 'DRAFT',
          engineeringChangeNumber: request.engineeringChangeNumber || null,
          createdBy,
        },
      });

      // Create BOM items
      await this.createBOMItems(bom.id, validatedItems);

      logger.info(`BOM created successfully`, {
        bomId: bom.id,
        productId: request.productId,
        revision: request.revision,
      });

      return this.getBOMWithItems(bom.id);
    } catch (error) {
      logger.error('Error creating BOM:', error);
      throw error;
    }
  }

  /**
   * Update BOM with engineering change management
   * Validates: Requirements 1.5 - Engineering change management
   */
  async updateBOMWithEngineeringChange(
    request: UpdateBOMRequest,
    requestedBy: string
  ): Promise<{ bom: BOMWithItems; engineeringChange: EngineeringChange }> {
    try {
      // Get existing BOM
      const existingBOM = await this.prisma.bOM.findUnique({
        where: { id: request.bomId },
        include: {
          items: true,
          productionOrders: {
            where: {
              status: {
                in: ['PLANNED', 'IN_PROGRESS'],
              },
            },
          },
        },
      });

      if (!existingBOM) {
        throw new Error('BOM not found');
      }

      // Create new BOM revision
      const newBOM = await this.prisma.bOM.create({
        data: {
          productId: existingBOM.productId,
          revision: request.newRevision,
          effectiveDate: request.effectiveDate,
          status: 'DRAFT',
          engineeringChangeNumber: request.engineeringChangeNumber,
          createdBy: requestedBy,
        },
      });

      // Validate and create new BOM items
      const validatedItems = await this.validateAndStructureBOMItems(request.items);
      await this.createBOMItems(newBOM.id, validatedItems);

      // Create engineering change record
      const engineeringChange = await this.createEngineeringChangeRecord({
        changeNumber: request.engineeringChangeNumber,
        bomId: request.bomId,
        newBomId: newBOM.id,
        oldRevision: existingBOM.revision,
        newRevision: request.newRevision,
        changeReason: request.changeReason,
        effectiveDate: request.effectiveDate,
        requestedBy,
        affectedProductionOrders: existingBOM.productionOrders.map(po => po.id),
      });

      // Mark old BOM as obsolete if new one is approved
      if (request.effectiveDate <= new Date()) {
        await this.prisma.bOM.update({
          where: { id: request.bomId },
          data: { status: 'OBSOLETE' },
        });
      }

      logger.info(`BOM updated with engineering change`, {
        oldBomId: request.bomId,
        newBomId: newBOM.id,
        engineeringChangeNumber: request.engineeringChangeNumber,
      });

      return {
        bom: await this.getBOMWithItems(newBOM.id),
        engineeringChange,
      };
    } catch (error) {
      logger.error('Error updating BOM with engineering change:', error);
      throw error;
    }
  }

  /**
   * Approve BOM and make it active
   */
  async approveBOM(bomId: string, approvedBy: string): Promise<BOMWithItems> {
    try {
      const bom = await this.prisma.bOM.update({
        where: { id: bomId },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvedAt: new Date(),
        },
      });

      logger.info(`BOM approved`, {
        bomId,
        approvedBy,
      });

      return this.getBOMWithItems(bomId);
    } catch (error) {
      logger.error('Error approving BOM:', error);
      throw error;
    }
  }

  /**
   * Get BOM with hierarchical structure
   */
  async getBOMWithItems(bomId: string): Promise<BOMWithItems> {
    const bom = await this.prisma.bOM.findUnique({
      where: { id: bomId },
      include: {
        product: {
          select: {
            code: true,
            name: true,
          },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                itemCode: true,
                name: true,
                category: true,
                standardCost: true,
                currentStock: true,
              },
            },
          },
          orderBy: [
            { level: 'asc' },
            { sequence: 'asc' },
          ],
        },
      },
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    // Structure items hierarchically
    const structuredItems = this.structureItemsHierarchically(bom.items);

    return {
      ...bom,
      items: structuredItems,
    } as BOMWithItems;
  }

  /**
   * Get all BOM revisions for a product
   */
  async getBOMRevisions(productId: string): Promise<BOMWithItems[]> {
    const boms = await this.prisma.bOM.findMany({
      where: { productId },
      include: {
        product: {
          select: {
            code: true,
            name: true,
          },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                itemCode: true,
                name: true,
                category: true,
                standardCost: true,
                currentStock: true,
              },
            },
          },
        },
      },
      orderBy: {
        revision: 'desc',
      },
    });

    return boms.map(bom => ({
      ...bom,
      items: this.structureItemsHierarchically(bom.items),
    })) as BOMWithItems[];
  }

  /**
   * Calculate BOM cost rollup
   */
  async calculateBOMCost(bomId: string, quantity: number = 1): Promise<{
    totalMaterialCost: number;
    totalScrapCost: number;
    totalCost: number;
    itemCosts: Array<{
      itemCode: string;
      quantity: number;
      unitCost: number;
      scrapCost: number;
      totalCost: number;
    }>;
  }> {
    const bom = await this.getBOMWithItems(bomId);
    
    let totalMaterialCost = 0;
    let totalScrapCost = 0;
    const itemCosts: any[] = [];

    for (const item of bom.items) {
      const unitCost = item.inventoryItem.standardCost || 0;
      const itemQuantity = item.quantity * quantity;
      const scrapQuantity = itemQuantity * (item.scrapPercentage / 100);
      const materialCost = itemQuantity * unitCost;
      const scrapCost = scrapQuantity * unitCost;
      const itemTotalCost = materialCost + scrapCost;

      totalMaterialCost += materialCost;
      totalScrapCost += scrapCost;

      itemCosts.push({
        itemCode: item.inventoryItem.itemCode,
        quantity: itemQuantity,
        unitCost,
        scrapCost,
        totalCost: itemTotalCost,
      });
    }

    return {
      totalMaterialCost,
      totalScrapCost,
      totalCost: totalMaterialCost + totalScrapCost,
      itemCosts,
    };
  }

  /**
   * Validate and structure BOM items with proper levels
   */
  private async validateAndStructureBOMItems(items: BOMItemRequest[]): Promise<BOMItemRequest[]> {
    // Validate all inventory items exist
    const inventoryItemIds = items.map(item => item.inventoryItemId);
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        id: {
          in: inventoryItemIds,
        },
      },
    });

    if (inventoryItems.length !== inventoryItemIds.length) {
      throw new Error('Some inventory items not found');
    }

    // Calculate levels for hierarchical structure
    const itemsWithLevels = items.map((item, index) => ({
      ...item,
      level: item.level || (item.parentItemId ? 2 : 1),
      sequence: item.sequence || index + 1,
      scrapPercentage: item.scrapPercentage || 0,
    }));

    return itemsWithLevels;
  }

  /**
   * Create BOM items in database
   */
  private async createBOMItems(bomId: string, items: BOMItemRequest[]): Promise<void> {
    for (const item of items) {
      await this.prisma.bOMItem.create({
        data: {
          bomId,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unit: item.unit,
          scrapPercentage: item.scrapPercentage || 0,
          operation: item.operation || null,
          level: item.level || 1,
          parentItemId: item.parentItemId || null,
          sequence: item.sequence || null,
        },
      });
    }
  }

  /**
   * Create engineering change record
   */
  private async createEngineeringChangeRecord(data: {
    changeNumber: string;
    bomId: string;
    newBomId: string;
    oldRevision: string;
    newRevision: string;
    changeReason: string;
    effectiveDate: Date;
    requestedBy: string;
    affectedProductionOrders: string[];
  }): Promise<EngineeringChange> {
    // This would typically be stored in a separate engineering_changes table
    // For now, we'll return a structured object
    return {
      id: `EC-${Date.now()}`,
      changeNumber: data.changeNumber,
      bomId: data.bomId,
      oldRevision: data.oldRevision,
      newRevision: data.newRevision,
      changeReason: data.changeReason,
      effectiveDate: data.effectiveDate,
      status: 'PENDING_APPROVAL',
      requestedBy: data.requestedBy,
      affectedProductionOrders: data.affectedProductionOrders,
    };
  }

  /**
   * Structure BOM items hierarchically
   */
  private structureItemsHierarchically(items: any[]): BOMItemWithDetails[] {
    const itemMap = new Map<string, BOMItemWithDetails>();
    const rootItems: BOMItemWithDetails[] = [];

    // First pass: create all items
    items.forEach(item => {
      const structuredItem: BOMItemWithDetails = {
        ...item,
        childItems: [],
      };
      itemMap.set(item.id, structuredItem);
    });

    // Second pass: build hierarchy
    items.forEach(item => {
      const structuredItem = itemMap.get(item.id)!;
      
      if (item.parentItemId) {
        const parent = itemMap.get(item.parentItemId);
        if (parent) {
          parent.childItems!.push(structuredItem);
        }
      } else {
        rootItems.push(structuredItem);
      }
    });

    return rootItems;
  }

  /**
   * Get engineering changes for BOM
   */
  async getEngineeringChanges(bomId: string): Promise<EngineeringChange[]> {
    // This would typically query an engineering_changes table
    // For now, return empty array as the table doesn't exist in schema
    return [];
  }

  /**
   * Propagate BOM changes to affected production orders
   * Validates: Requirements 1.5 - BOM change propagation
   */
  async propagateBOMChanges(
    oldBomId: string,
    newBomId: string,
    effectiveDate: Date
  ): Promise<string[]> {
    try {
      // Find all production orders using the old BOM that are not yet completed
      const affectedOrders = await this.prisma.productionOrder.findMany({
        where: {
          bomId: oldBomId,
          status: {
            in: ['PLANNED', 'IN_PROGRESS'],
          },
          scheduledStartDate: {
            gte: effectiveDate,
          },
        },
      });

      const updatedOrderIds: string[] = [];

      // Update production orders to use new BOM
      for (const order of affectedOrders) {
        await this.prisma.productionOrder.update({
          where: { id: order.id },
          data: {
            bomId: newBomId,
          },
        });

        updatedOrderIds.push(order.id);
      }

      logger.info(`BOM changes propagated to production orders`, {
        oldBomId,
        newBomId,
        affectedOrders: updatedOrderIds.length,
      });

      return updatedOrderIds;
    } catch (error) {
      logger.error('Error propagating BOM changes:', error);
      throw error;
    }
  }
}