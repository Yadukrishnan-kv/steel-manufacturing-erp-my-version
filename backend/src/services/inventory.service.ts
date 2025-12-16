import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export interface InventoryItemCreateData {
  itemCode: string;
  name: string;
  description?: string | undefined;
  category: 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED_GOOD' | 'CONSUMABLE';
  unit: string;
  standardCost?: number | undefined;
  reorderLevel?: number;
  safetyStock?: number;
  leadTimeDays?: number;
  isBatchTracked?: boolean;
  warehouseId: string;
  binId?: string;
  createdBy?: string;
}

export interface StockTransactionData {
  transactionType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RESERVATION' | 'RELEASE' | 'STOCK_TRANSFER_IN' | 'STOCK_TRANSFER_OUT';
  inventoryItemId: string;
  warehouseId: string;
  batchId?: string | undefined;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
  createdBy?: string;
}

export interface BatchRecordData {
  batchNumber: string;
  inventoryItemId: string;
  quantity: number;
  manufactureDate?: Date | undefined;
  expiryDate?: Date | undefined;
  supplierLot?: string;
  receivedDate: Date;
}

export interface StockTransferData {
  fromBranchId: string;
  toBranchId: string;
  items: {
    inventoryItemId: string;
    requestedQty: number;
  }[];
  remarks?: string;
  createdBy?: string;
}

export interface LocationAssignmentData {
  inventoryItemId: string;
  warehouseId: string;
  rackCode: string;
  binCode: string;
}

export class InventoryService {
  // Multi-warehouse inventory management
  async createInventoryItem(data: InventoryItemCreateData) {
    const barcode = this.generateBarcode(data.itemCode);
    
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        id: randomUUID(),
        itemCode: data.itemCode,
        name: data.name,
        description: data.description || null,
        category: data.category,
        unit: data.unit,
        standardCost: data.standardCost || 0,
        reorderLevel: data.reorderLevel || 0,
        safetyStock: data.safetyStock || 0,
        leadTimeDays: data.leadTimeDays || 0,
        isBatchTracked: data.isBatchTracked || false,
        warehouseId: data.warehouseId,
        binId: data.binId || null,
        barcode: barcode,
        createdBy: data.createdBy || null,
      },
      include: {
        warehouse: {
          include: {
            branch: true
          }
        },
        bin: {
          include: {
            rack: true
          }
        }
      }
    });

    return inventoryItem;
  }

  async getInventoryItemsByWarehouse(warehouseId: string) {
    return await prisma.inventoryItem.findMany({
      where: {
        warehouseId,
        isDeleted: false,
        isActive: true
      },
      include: {
        warehouse: {
          include: {
            branch: true
          }
        },
        bin: {
          include: {
            rack: true
          }
        },
        batchRecords: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    });
  }

  async getMultiWarehouseStock(itemCode: string) {
    return await prisma.inventoryItem.findMany({
      where: {
        itemCode,
        isDeleted: false,
        isActive: true
      },
      include: {
        warehouse: {
          include: {
            branch: true
          }
        },
        bin: {
          include: {
            rack: true
          }
        },
        batchRecords: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    });
  }

  // Rack/bin location assignment and tracking
  async assignLocation(data: LocationAssignmentData) {
    // First, find or create the rack
    let rack = await prisma.rack.findFirst({
      where: {
        code: data.rackCode,
        warehouseId: data.warehouseId
      }
    });

    if (!rack) {
      rack = await prisma.rack.create({
        data: {
          id: randomUUID(),
          code: data.rackCode,
          warehouseId: data.warehouseId,
          description: `Rack ${data.rackCode}`
        }
      });
    }

    // Find or create the bin
    let bin = await prisma.bin.findFirst({
      where: {
        code: data.binCode,
        rackId: rack.id
      }
    });

    if (!bin) {
      bin = await prisma.bin.create({
        data: {
          id: randomUUID(),
          code: data.binCode,
          rackId: rack.id
        }
      });
    }

    // Update inventory item with location
    const updatedItem = await prisma.inventoryItem.update({
      where: {
        id: data.inventoryItemId
      },
      data: {
        binId: bin.id
      },
      include: {
        warehouse: true,
        bin: {
          include: {
            rack: true
          }
        }
      }
    });

    return updatedItem;
  }

  async getLocationsByWarehouse(warehouseId: string) {
    return await prisma.rack.findMany({
      where: {
        warehouseId,
        isDeleted: false,
        isActive: true
      },
      include: {
        bins: {
          where: {
            isDeleted: false,
            isActive: true
          },
          include: {
            inventoryItems: {
              where: {
                isDeleted: false,
                isActive: true
              }
            }
          }
        }
      }
    });
  }

  // Barcode/QR code generation and scanning
  generateBarcode(itemCode: string): string {
    // Generate a unique barcode based on item code, timestamp, and random number
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    const hash = this.simpleHash(itemCode + timestamp + random);
    return `${itemCode}-${hash}`.toUpperCase();
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  async getItemByBarcode(barcode: string) {
    return await prisma.inventoryItem.findUnique({
      where: {
        barcode
      },
      include: {
        warehouse: {
          include: {
            branch: true
          }
        },
        bin: {
          include: {
            rack: true
          }
        },
        batchRecords: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    });
  }

  // Batch/lot tracking for materials with expiry management
  async createBatchRecord(data: BatchRecordData) {
    const batchRecord = await prisma.batchRecord.create({
      data: {
        id: randomUUID(),
        batchNumber: data.batchNumber,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        manufactureDate: data.manufactureDate || null,
        expiryDate: data.expiryDate || null,
        supplierLot: data.supplierLot || null,
        receivedDate: data.receivedDate,
        status: 'ACTIVE'
      },
      include: {
        inventoryItem: true
      }
    });

    return batchRecord;
  }

  async getBatchesByItem(inventoryItemId: string) {
    return await prisma.batchRecord.findMany({
      where: {
        inventoryItemId,
        status: 'ACTIVE'
      },
      include: {
        inventoryItem: true
      },
      orderBy: {
        expiryDate: 'asc' // FIFO by expiry date
      }
    });
  }

  async getExpiringBatches(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await prisma.batchRecord.findMany({
      where: {
        status: 'ACTIVE',
        expiryDate: {
          lte: futureDate,
          gte: new Date()
        }
      },
      include: {
        inventoryItem: {
          include: {
            warehouse: {
              include: {
                branch: true
              }
            }
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });
  }

  // Stock transactions and movements
  async recordStockTransaction(data: StockTransactionData) {
    const totalValue = data.unitCost ? data.quantity * data.unitCost : null;

    const transaction = await prisma.stockTransaction.create({
      data: {
        id: randomUUID(),
        transactionType: data.transactionType,
        inventoryItemId: data.inventoryItemId,
        warehouseId: data.warehouseId,
        batchId: data.batchId || null,
        quantity: data.quantity,
        unitCost: data.unitCost || null,
        totalValue: totalValue || null,
        referenceType: data.referenceType || null,
        referenceId: data.referenceId || null,
        remarks: data.remarks || null,
        createdBy: data.createdBy || null
      },
      include: {
        inventoryItem: true,
        warehouse: {
          include: {
            branch: true
          }
        },
        batch: true
      }
    });

    // Update inventory item stock levels
    await this.updateStockLevels(data.inventoryItemId, data.transactionType, data.quantity);

    return transaction;
  }

  private async updateStockLevels(inventoryItemId: string, transactionType: string, quantity: number) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId }
    });

    if (!item) {
      throw new Error('Inventory item not found');
    }

    let newCurrentStock = item.currentStock;
    let newAvailableStock = item.availableStock;

    switch (transactionType) {
      case 'IN':
        newCurrentStock += quantity;
        newAvailableStock += quantity;
        break;
      case 'OUT':
        newCurrentStock -= quantity;
        newAvailableStock -= quantity;
        break;
      case 'ADJUSTMENT':
        newCurrentStock = quantity; // Adjustment sets absolute quantity
        newAvailableStock = quantity - item.reservedStock;
        break;
    }

    await prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        currentStock: newCurrentStock,
        availableStock: newAvailableStock
      }
    });
  }

  // Safety stock and reorder point monitoring
  async getItemsBelowSafetyStock() {
    return await prisma.inventoryItem.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        OR: [
          {
            currentStock: {
              lte: prisma.inventoryItem.fields.safetyStock
            }
          },
          {
            currentStock: {
              lte: prisma.inventoryItem.fields.reorderLevel
            }
          }
        ]
      },
      include: {
        warehouse: {
          include: {
            branch: true
          }
        }
      }
    });
  }

  async checkAndGenerateReorderAlerts() {
    const lowStockItems = await this.getItemsBelowSafetyStock();
    const alerts = [];

    for (const item of lowStockItems) {
      if (item.currentStock <= item.safetyStock) {
        alerts.push({
          type: 'SAFETY_STOCK_BREACH',
          module: 'INVENTORY',
          referenceId: item.id,
          message: `Item ${item.name} (${item.itemCode}) is below safety stock level. Current: ${item.currentStock}, Safety: ${item.safetyStock}`,
          priority: 'HIGH'
        });
      } else if (item.currentStock <= item.reorderLevel) {
        alerts.push({
          type: 'REORDER_LEVEL_BREACH',
          module: 'INVENTORY',
          referenceId: item.id,
          message: `Item ${item.name} (${item.itemCode}) has reached reorder level. Current: ${item.currentStock}, Reorder: ${item.reorderLevel}`,
          priority: 'MEDIUM'
        });
      }
    }

    // Create alerts in database
    for (const alertData of alerts) {
      await prisma.alert.create({
        data: {
          id: randomUUID(),
          ...alertData
        }
      });
    }

    return alerts;
  }

  // Order-wise material allocation and reservation
  async allocateOrderMaterials(orderId: string, orderType: string, items: { inventoryItemId: string; quantity: number }[]) {
    const allocations = [];

    for (const item of items) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: item.inventoryItemId }
      });

      if (!inventoryItem) {
        throw new Error(`Inventory item ${item.inventoryItemId} not found`);
      }

      if (inventoryItem.availableStock < item.quantity) {
        throw new Error(`Insufficient stock for item ${inventoryItem.name}. Available: ${inventoryItem.availableStock}, Required: ${item.quantity}`);
      }

      // Reserve the stock
      await prisma.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          reservedStock: inventoryItem.reservedStock + item.quantity,
          availableStock: inventoryItem.availableStock - item.quantity
        }
      });

      // Record the allocation transaction
      const allocation = await this.recordStockTransaction({
        transactionType: 'OUT',
        inventoryItemId: item.inventoryItemId,
        warehouseId: inventoryItem.warehouseId,
        quantity: item.quantity,
        referenceType: orderType,
        referenceId: orderId,
        remarks: `Material allocated for ${orderType} ${orderId}`
      });

      allocations.push(allocation);
    }

    return allocations;
  }

  // Inter-branch stock transfers
  async createStockTransfer(data: StockTransferData) {
    const transferNumber = this.generateTransferNumber();

    const transfer = await prisma.stockTransfer.create({
      data: {
        id: randomUUID(),
        transferNumber,
        fromBranchId: data.fromBranchId,
        toBranchId: data.toBranchId,
        requestedDate: new Date(),
        remarks: data.remarks || null,
        createdBy: data.createdBy || null,
        items: {
          create: data.items.map(item => ({
            id: randomUUID(),
            inventoryItemId: item.inventoryItemId,
            requestedQty: item.requestedQty
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

  async updateTransferStatus(transferId: string, status: string, updateData?: any) {
    const updateFields: any = { status };

    if (status === 'IN_TRANSIT' && updateData?.shippedDate) {
      updateFields.shippedDate = updateData.shippedDate;
    }

    if (status === 'RECEIVED' && updateData?.receivedDate) {
      updateFields.receivedDate = updateData.receivedDate;
    }

    return await prisma.stockTransfer.update({
      where: { id: transferId },
      data: updateFields,
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
  }

  // Inventory valuation methods (FIFO, LIFO, Weighted Average)
  async calculateInventoryValuation(method: 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE', warehouseId?: string) {
    const whereClause: any = {
      isDeleted: false,
      isActive: true
    };

    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        stockTransactions: {
          where: {
            transactionType: 'IN'
          },
          orderBy: {
            transactionDate: method === 'FIFO' ? 'asc' : 'desc'
          }
        }
      }
    });

    const valuations = [];

    for (const item of inventoryItems) {
      let valuation = 0;
      let remainingStock = item.currentStock;

      if (method === 'WEIGHTED_AVERAGE') {
        const totalValue = item.stockTransactions.reduce((sum, txn) => sum + (txn.totalValue || 0), 0);
        const totalQuantity = item.stockTransactions.reduce((sum, txn) => sum + txn.quantity, 0);
        const avgCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        valuation = remainingStock * avgCost;
      } else {
        // FIFO or LIFO
        for (const transaction of item.stockTransactions) {
          if (remainingStock <= 0) break;

          const qtyToValue = Math.min(remainingStock, transaction.quantity);
          const unitCost = transaction.unitCost || 0;
          valuation += qtyToValue * unitCost;
          remainingStock -= qtyToValue;
        }
      }

      valuations.push({
        inventoryItemId: item.id,
        itemCode: item.itemCode,
        name: item.name,
        currentStock: item.currentStock,
        valuation: valuation,
        method: method
      });
    }

    return valuations;
  }

  // Get stock transactions with audit trail
  async getStockTransactions(filters?: {
    inventoryItemId?: string;
    warehouseId?: string;
    transactionType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const whereClause: any = {};

    if (filters?.inventoryItemId) {
      whereClause.inventoryItemId = filters.inventoryItemId;
    }

    if (filters?.warehouseId) {
      whereClause.warehouseId = filters.warehouseId;
    }

    if (filters?.transactionType) {
      whereClause.transactionType = filters.transactionType;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.transactionDate = {};
      if (filters.dateFrom) {
        whereClause.transactionDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.transactionDate.lte = filters.dateTo;
      }
    }

    return await prisma.stockTransaction.findMany({
      where: whereClause,
      include: {
        inventoryItem: true,
        warehouse: {
          include: {
            branch: true
          }
        },
        batch: true
      },
      orderBy: {
        transactionDate: 'desc'
      }
    });
  }

  // Enhanced order-wise material allocation and reservation system
  async reserveOrderMaterials(orderId: string, orderType: string, items: { inventoryItemId: string; quantity: number; rackCode?: string; binCode?: string }[]) {
    const reservations = [];

    for (const item of items) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: item.inventoryItemId },
        include: {
          warehouse: true,
          bin: {
            include: {
              rack: true
            }
          }
        }
      });

      if (!inventoryItem) {
        throw new Error(`Inventory item ${item.inventoryItemId} not found`);
      }

      if (inventoryItem.availableStock < item.quantity) {
        throw new Error(`Insufficient stock for item ${inventoryItem.name}. Available: ${inventoryItem.availableStock}, Required: ${item.quantity}`);
      }

      // Reserve the stock
      await prisma.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          reservedStock: inventoryItem.reservedStock + item.quantity,
          availableStock: inventoryItem.availableStock - item.quantity
        }
      });

      // Create reservation record
      const reservation = await prisma.stockTransaction.create({
        data: {
          id: randomUUID(),
          transactionType: 'RESERVATION',
          inventoryItemId: item.inventoryItemId,
          warehouseId: inventoryItem.warehouseId,
          quantity: item.quantity,
          referenceType: orderType,
          referenceId: orderId,
          remarks: `Material reserved for ${orderType} ${orderId}. Location: ${item.rackCode || inventoryItem.bin?.rack?.code || 'N/A'}-${item.binCode || inventoryItem.bin?.code || 'N/A'}`
        },
        include: {
          inventoryItem: true,
          warehouse: {
            include: {
              branch: true
            }
          }
        }
      });

      reservations.push(reservation);
    }

    return reservations;
  }

  async releaseOrderReservation(orderId: string, orderType: string) {
    // Find all reservation transactions for this order
    const reservations = await prisma.stockTransaction.findMany({
      where: {
        transactionType: 'RESERVATION',
        referenceType: orderType,
        referenceId: orderId
      },
      include: {
        inventoryItem: true
      }
    });

    for (const reservation of reservations) {
      // Release the reserved stock
      await prisma.inventoryItem.update({
        where: { id: reservation.inventoryItemId },
        data: {
          reservedStock: reservation.inventoryItem.reservedStock - reservation.quantity,
          availableStock: reservation.inventoryItem.availableStock + reservation.quantity
        }
      });

      // Create release transaction
      await prisma.stockTransaction.create({
        data: {
          id: randomUUID(),
          transactionType: 'RELEASE',
          inventoryItemId: reservation.inventoryItemId,
          warehouseId: reservation.warehouseId,
          quantity: reservation.quantity,
          referenceType: orderType,
          referenceId: orderId,
          remarks: `Reservation released for ${orderType} ${orderId}`
        }
      });
    }

    return reservations.length;
  }

  // Cycle counting and stock adjustment procedures
  async createCycleCount(warehouseId: string, items: { inventoryItemId: string; countedQuantity: number; remarks?: string }[], countedBy: string) {
    const cycleCountId = randomUUID();
    const adjustments = [];

    for (const item of items) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: item.inventoryItemId }
      });

      if (!inventoryItem) {
        throw new Error(`Inventory item ${item.inventoryItemId} not found`);
      }

      const variance = item.countedQuantity - inventoryItem.currentStock;

      if (variance !== 0) {
        // Create stock adjustment transaction
        const adjustment = await this.recordStockTransaction({
          transactionType: 'ADJUSTMENT',
          inventoryItemId: item.inventoryItemId,
          warehouseId: warehouseId,
          quantity: item.countedQuantity, // Adjustment sets absolute quantity
          referenceType: 'CYCLE_COUNT',
          referenceId: cycleCountId,
          remarks: `Cycle count adjustment. Variance: ${variance}. ${item.remarks || ''}`
        });

        adjustments.push({
          ...adjustment,
          variance,
          systemQuantity: inventoryItem.currentStock,
          countedQuantity: item.countedQuantity
        });
      }
    }

    return {
      cycleCountId,
      adjustments,
      totalVariances: adjustments.length
    };
  }

  async performStockAdjustment(inventoryItemId: string, newQuantity: number, reason: string, adjustedBy: string) {
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId }
    });

    if (!inventoryItem) {
      throw new Error(`Inventory item ${inventoryItemId} not found`);
    }

    const variance = newQuantity - inventoryItem.currentStock;

    // Record adjustment transaction
    const adjustment = await this.recordStockTransaction({
      transactionType: 'ADJUSTMENT',
      inventoryItemId: inventoryItemId,
      warehouseId: inventoryItem.warehouseId,
      quantity: newQuantity,
      referenceType: 'MANUAL_ADJUSTMENT',
      referenceId: randomUUID(),
      remarks: `Manual adjustment: ${reason}. Variance: ${variance}`,
      createdBy: adjustedBy
    });

    return {
      ...adjustment,
      variance,
      previousQuantity: inventoryItem.currentStock,
      newQuantity
    };
  }

  // Goods receipt and put-away functionality
  async processGoodsReceipt(grnData: {
    grnNumber: string;
    poId?: string;
    items: {
      inventoryItemId: string;
      receivedQuantity: number;
      batchNumber?: string;
      expiryDate?: Date;
      rackCode?: string;
      binCode?: string;
    }[];
    receivedBy: string;
  }) {
    const receipts = [];

    for (const item of grnData.items) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: item.inventoryItemId }
      });

      if (!inventoryItem) {
        throw new Error(`Inventory item ${item.inventoryItemId} not found`);
      }

      // Create batch record if batch tracking is enabled
      let batchId: string | undefined;
      if (inventoryItem.isBatchTracked && item.batchNumber) {
        const batch = await this.createBatchRecord({
          batchNumber: item.batchNumber,
          inventoryItemId: item.inventoryItemId,
          quantity: item.receivedQuantity,
          expiryDate: item.expiryDate,
          receivedDate: new Date()
        });
        batchId = batch.id;
      }

      // Assign location if provided
      if (item.rackCode && item.binCode) {
        await this.assignLocation({
          inventoryItemId: item.inventoryItemId,
          warehouseId: inventoryItem.warehouseId,
          rackCode: item.rackCode,
          binCode: item.binCode
        });
      }

      // Record goods receipt transaction
      const receipt = await this.recordStockTransaction({
        transactionType: 'IN',
        inventoryItemId: item.inventoryItemId,
        warehouseId: inventoryItem.warehouseId,
        batchId: batchId,
        quantity: item.receivedQuantity,
        referenceType: 'GRN',
        referenceId: grnData.grnNumber,
        remarks: `Goods received via GRN ${grnData.grnNumber}. Location: ${item.rackCode || 'N/A'}-${item.binCode || 'N/A'}`,
        createdBy: grnData.receivedBy
      });

      receipts.push(receipt);
    }

    return receipts;
  }

  async processPutAway(putAwayData: {
    inventoryItemId: string;
    fromLocation: { rackCode: string; binCode: string };
    toLocation: { rackCode: string; binCode: string };
    quantity: number;
    putAwayBy: string;
  }) {
    // Assign new location
    await this.assignLocation({
      inventoryItemId: putAwayData.inventoryItemId,
      warehouseId: (await prisma.inventoryItem.findUnique({ where: { id: putAwayData.inventoryItemId } }))!.warehouseId,
      rackCode: putAwayData.toLocation.rackCode,
      binCode: putAwayData.toLocation.binCode
    });

    // Record put-away transaction
    const putAway = await this.recordStockTransaction({
      transactionType: 'TRANSFER',
      inventoryItemId: putAwayData.inventoryItemId,
      warehouseId: (await prisma.inventoryItem.findUnique({ where: { id: putAwayData.inventoryItemId } }))!.warehouseId,
      quantity: putAwayData.quantity,
      referenceType: 'PUT_AWAY',
      referenceId: randomUUID(),
      remarks: `Put-away from ${putAwayData.fromLocation.rackCode}-${putAwayData.fromLocation.binCode} to ${putAwayData.toLocation.rackCode}-${putAwayData.toLocation.binCode}`,
      createdBy: putAwayData.putAwayBy
    });

    return putAway;
  }

  // Enhanced stock transfer workflows
  async processStockTransferShipment(transferId: string, shippedItems: { inventoryItemId: string; shippedQty: number }[], shippedBy: string) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    if (!transfer) {
      throw new Error('Stock transfer not found');
    }

    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer is not in pending status');
    }

    // Update transfer items with shipped quantities
    for (const shippedItem of shippedItems) {
      const transferItem = transfer.items.find(item => item.inventoryItemId === shippedItem.inventoryItemId);
      if (!transferItem) {
        throw new Error(`Transfer item ${shippedItem.inventoryItemId} not found in transfer`);
      }

      await prisma.stockTransferItem.update({
        where: { id: transferItem.id },
        data: { shippedQty: shippedItem.shippedQty }
      });

      // Record outbound transaction at source
      await this.recordStockTransaction({
        transactionType: 'OUT',
        inventoryItemId: shippedItem.inventoryItemId,
        warehouseId: transferItem.inventoryItem.warehouseId,
        quantity: shippedItem.shippedQty,
        referenceType: 'STOCK_TRANSFER_OUT',
        referenceId: transferId,
        remarks: `Stock shipped for transfer ${transfer.transferNumber}`,
        createdBy: shippedBy
      });
    }

    // Update transfer status
    await prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: 'IN_TRANSIT',
        shippedDate: new Date()
      }
    });

    return await prisma.stockTransfer.findUnique({
      where: { id: transferId },
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
  }

  async processStockTransferReceipt(transferId: string, receivedItems: { inventoryItemId: string; receivedQty: number; rackCode?: string; binCode?: string }[], receivedBy: string) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        },
        toBranch: {
          include: {
            warehouses: true
          }
        }
      }
    });

    if (!transfer) {
      throw new Error('Stock transfer not found');
    }

    if (transfer.status !== 'IN_TRANSIT') {
      throw new Error('Transfer is not in transit');
    }

    // Find destination warehouse (first warehouse in destination branch)
    const destinationWarehouse = transfer.toBranch.warehouses[0];
    if (!destinationWarehouse) {
      throw new Error('No warehouse found in destination branch');
    }

    // Update transfer items with received quantities
    for (const receivedItem of receivedItems) {
      const transferItem = transfer.items.find(item => item.inventoryItemId === receivedItem.inventoryItemId);
      if (!transferItem) {
        throw new Error(`Transfer item ${receivedItem.inventoryItemId} not found in transfer`);
      }

      await prisma.stockTransferItem.update({
        where: { id: transferItem.id },
        data: { receivedQty: receivedItem.receivedQty }
      });

      // Create or update inventory item in destination warehouse
      let destinationItem = await prisma.inventoryItem.findFirst({
        where: {
          itemCode: transferItem.inventoryItem.itemCode,
          warehouseId: destinationWarehouse.id
        }
      });

      if (!destinationItem) {
        // Create new inventory item in destination warehouse
        destinationItem = await this.createInventoryItem({
          itemCode: transferItem.inventoryItem.itemCode,
          name: transferItem.inventoryItem.name,
          description: transferItem.inventoryItem.description || undefined,
          category: transferItem.inventoryItem.category as any,
          unit: transferItem.inventoryItem.unit,
          standardCost: transferItem.inventoryItem.standardCost || undefined,
          reorderLevel: transferItem.inventoryItem.reorderLevel,
          safetyStock: transferItem.inventoryItem.safetyStock,
          leadTimeDays: transferItem.inventoryItem.leadTimeDays,
          isBatchTracked: transferItem.inventoryItem.isBatchTracked,
          warehouseId: destinationWarehouse.id
        });
      }

      // Assign location if provided
      if (receivedItem.rackCode && receivedItem.binCode) {
        await this.assignLocation({
          inventoryItemId: destinationItem.id,
          warehouseId: destinationWarehouse.id,
          rackCode: receivedItem.rackCode,
          binCode: receivedItem.binCode
        });
      }

      // Record inbound transaction at destination
      await this.recordStockTransaction({
        transactionType: 'IN',
        inventoryItemId: destinationItem.id,
        warehouseId: destinationWarehouse.id,
        quantity: receivedItem.receivedQty,
        referenceType: 'STOCK_TRANSFER_IN',
        referenceId: transferId,
        remarks: `Stock received from transfer ${transfer.transferNumber}`,
        createdBy: receivedBy
      });
    }

    // Update transfer status
    await prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: 'RECEIVED',
        receivedDate: new Date()
      }
    });

    return await prisma.stockTransfer.findUnique({
      where: { id: transferId },
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
  }

  // Stock inquiry and reporting APIs
  async getStockInquiry(filters: {
    itemCode?: string;
    category?: string;
    warehouseId?: string;
    branchId?: string;
    lowStock?: boolean;
    expiringBatches?: boolean;
    daysAhead?: number;
  }) {
    const whereClause: any = {
      isDeleted: false,
      isActive: true
    };

    if (filters.itemCode) {
      whereClause.itemCode = {
        contains: filters.itemCode,
        mode: 'insensitive'
      };
    }

    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.warehouseId) {
      whereClause.warehouseId = filters.warehouseId;
    }

    if (filters.branchId) {
      whereClause.warehouse = {
        branchId: filters.branchId
      };
    }

    if (filters.lowStock) {
      whereClause.OR = [
        {
          currentStock: {
            lte: prisma.inventoryItem.fields.safetyStock
          }
        },
        {
          currentStock: {
            lte: prisma.inventoryItem.fields.reorderLevel
          }
        }
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        warehouse: {
          include: {
            branch: true
          }
        },
        bin: {
          include: {
            rack: true
          }
        },
        batchRecords: {
          where: {
            status: 'ACTIVE'
          }
        }
      },
      orderBy: [
        { warehouse: { branch: { name: 'asc' } } },
        { warehouse: { name: 'asc' } },
        { itemCode: 'asc' }
      ]
    });

    // Add expiring batches information if requested
    if (filters.expiringBatches) {
      const daysAhead = filters.daysAhead || 30;
      const expiringBatches = await this.getExpiringBatches(daysAhead);
      
      return {
        items,
        expiringBatches,
        summary: {
          totalItems: items.length,
          lowStockItems: items.filter(item => item.currentStock <= item.safetyStock || item.currentStock <= item.reorderLevel).length,
          expiringBatches: expiringBatches.length
        }
      };
    }

    return {
      items,
      summary: {
        totalItems: items.length,
        lowStockItems: items.filter(item => item.currentStock <= item.safetyStock || item.currentStock <= item.reorderLevel).length
      }
    };
  }

  async getStockMovementReport(filters: {
    dateFrom: Date;
    dateTo: Date;
    warehouseId?: string;
    branchId?: string;
    itemCode?: string;
    transactionType?: string;
  }) {
    const whereClause: any = {
      transactionDate: {
        gte: filters.dateFrom,
        lte: filters.dateTo
      }
    };

    if (filters.warehouseId) {
      whereClause.warehouseId = filters.warehouseId;
    }

    if (filters.branchId) {
      whereClause.warehouse = {
        branchId: filters.branchId
      };
    }

    if (filters.itemCode) {
      whereClause.inventoryItem = {
        itemCode: {
          contains: filters.itemCode,
          mode: 'insensitive'
        }
      };
    }

    if (filters.transactionType) {
      whereClause.transactionType = filters.transactionType;
    }

    const transactions = await prisma.stockTransaction.findMany({
      where: whereClause,
      include: {
        inventoryItem: true,
        warehouse: {
          include: {
            branch: true
          }
        },
        batch: true
      },
      orderBy: {
        transactionDate: 'desc'
      }
    });

    // Calculate summary statistics
    const summary = {
      totalTransactions: transactions.length,
      inboundTransactions: transactions.filter(t => ['IN', 'STOCK_TRANSFER_IN'].includes(t.transactionType)).length,
      outboundTransactions: transactions.filter(t => ['OUT', 'STOCK_TRANSFER_OUT'].includes(t.transactionType)).length,
      adjustmentTransactions: transactions.filter(t => t.transactionType === 'ADJUSTMENT').length,
      totalInboundQuantity: transactions
        .filter(t => ['IN', 'STOCK_TRANSFER_IN'].includes(t.transactionType))
        .reduce((sum, t) => sum + t.quantity, 0),
      totalOutboundQuantity: transactions
        .filter(t => ['OUT', 'STOCK_TRANSFER_OUT'].includes(t.transactionType))
        .reduce((sum, t) => sum + t.quantity, 0),
      totalValue: transactions
        .filter(t => t.totalValue !== null)
        .reduce((sum, t) => sum + (t.totalValue || 0), 0)
    };

    return {
      transactions,
      summary,
      period: {
        from: filters.dateFrom,
        to: filters.dateTo
      }
    };
  }

  async getInventoryAging(warehouseId?: string) {
    const whereClause: any = {
      isDeleted: false,
      isActive: true,
      currentStock: {
        gt: 0
      }
    };

    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        warehouse: {
          include: {
            branch: true
          }
        },
        stockTransactions: {
          where: {
            transactionType: 'IN'
          },
          orderBy: {
            transactionDate: 'asc'
          },
          take: 1
        }
      }
    });

    const agingReport = items.map(item => {
      const firstTransaction = item.stockTransactions[0];
      const ageInDays = firstTransaction 
        ? Math.floor((new Date().getTime() - firstTransaction.transactionDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let agingCategory = 'Current';
      if (ageInDays > 365) {
        agingCategory = 'Over 1 Year';
      } else if (ageInDays > 180) {
        agingCategory = '6-12 Months';
      } else if (ageInDays > 90) {
        agingCategory = '3-6 Months';
      } else if (ageInDays > 30) {
        agingCategory = '1-3 Months';
      }

      return {
        inventoryItemId: item.id,
        itemCode: item.itemCode,
        name: item.name,
        currentStock: item.currentStock,
        standardCost: item.standardCost,
        totalValue: item.currentStock * (item.standardCost || 0),
        ageInDays,
        agingCategory,
        warehouse: item.warehouse.name,
        branch: item.warehouse.branch.name,
        firstReceiptDate: firstTransaction?.transactionDate
      };
    });

    // Group by aging categories
    const agingSummary = agingReport.reduce((acc, item) => {
      if (!acc[item.agingCategory]) {
        acc[item.agingCategory] = {
          count: 0,
          totalValue: 0
        };
      }
      acc[item.agingCategory]!.count++;
      acc[item.agingCategory]!.totalValue += item.totalValue;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    return {
      items: agingReport,
      summary: agingSummary,
      totalItems: agingReport.length,
      totalValue: agingReport.reduce((sum, item) => sum + item.totalValue, 0)
    };
  }
}

export const inventoryService = new InventoryService();