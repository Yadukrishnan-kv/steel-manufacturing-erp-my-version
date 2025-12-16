import { Router, Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createInventoryItemSchema = z.object({
  itemCode: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'CONSUMABLE']),
  unit: z.string().min(1),
  standardCost: z.number().optional(),
  reorderLevel: z.number().optional(),
  safetyStock: z.number().optional(),
  leadTimeDays: z.number().optional(),
  isBatchTracked: z.boolean().optional(),
  warehouseId: z.string().uuid(),
  binId: z.string().uuid().optional()
});

const stockTransactionSchema = z.object({
  transactionType: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']),
  inventoryItemId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  quantity: z.number().positive(),
  unitCost: z.number().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  remarks: z.string().optional()
});

const batchRecordSchema = z.object({
  batchNumber: z.string().min(1),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive(),
  manufactureDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  supplierLot: z.string().optional(),
  receivedDate: z.string().datetime()
});

const locationAssignmentSchema = z.object({
  inventoryItemId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  rackCode: z.string().min(1),
  binCode: z.string().min(1)
});

const stockTransferSchema = z.object({
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    requestedQty: z.number().positive()
  })),
  remarks: z.string().optional()
});

const orderAllocationSchema = z.object({
  orderId: z.string().uuid(),
  orderType: z.string().min(1),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive()
  }))
});

// Multi-warehouse inventory management APIs
router.post('/items', authenticate, validate({ body: createInventoryItemSchema }), async (req: Request, res: Response) => {
  try {
    const inventoryItem = await inventoryService.createInventoryItem({
      ...req.body,
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: inventoryItem,
      message: 'Inventory item created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVENTORY_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/items/warehouse/:warehouseId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.params;
    if (!warehouseId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WAREHOUSE_ID',
          message: 'Warehouse ID is required'
        }
      });
      return;
    }
    const items = await inventoryService.getInventoryItemsByWarehouse(warehouseId);

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVENTORY_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/stock/:itemCode', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemCode } = req.params;
    if (!itemCode) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ITEM_CODE',
          message: 'Item code is required'
        }
      });
      return;
    }
    const stock = await inventoryService.getMultiWarehouseStock(itemCode);

    res.json({
      success: true,
      data: stock
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'STOCK_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// Rack/bin location assignment and tracking APIs
router.post('/locations/assign', authenticate, validate({ body: locationAssignmentSchema }), async (req: Request, res: Response) => {
  try {
    const updatedItem = await inventoryService.assignLocation(req.body);

    res.json({
      success: true,
      data: updatedItem,
      message: 'Location assigned successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'LOCATION_ASSIGNMENT_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/locations/warehouse/:warehouseId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.params;
    if (!warehouseId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WAREHOUSE_ID',
          message: 'Warehouse ID is required'
        }
      });
      return;
    }
    const locations = await inventoryService.getLocationsByWarehouse(warehouseId);

    res.json({
      success: true,
      data: locations
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'LOCATIONS_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// Barcode/QR code generation and scanning APIs
router.get('/barcode/:barcode', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { barcode } = req.params;
    if (!barcode) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BARCODE',
          message: 'Barcode is required'
        }
      });
      return;
    }
    
    const item = await inventoryService.getItemByBarcode(barcode);

    if (!item) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Item not found for the given barcode'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BARCODE_SCAN_FAILED',
        message: error.message
      }
    });
  }
});

// Batch/lot tracking APIs
router.post('/batches', authenticate, validate({ body: batchRecordSchema }), async (req: Request, res: Response) => {
  try {
    const batchData = {
      ...req.body,
      manufactureDate: req.body.manufactureDate ? new Date(req.body.manufactureDate) : undefined,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      receivedDate: new Date(req.body.receivedDate)
    };

    const batch = await inventoryService.createBatchRecord(batchData);

    res.status(201).json({
      success: true,
      data: batch,
      message: 'Batch record created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BATCH_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/batches/item/:inventoryItemId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryItemId } = req.params;
    if (!inventoryItemId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INVENTORY_ITEM_ID',
          message: 'Inventory item ID is required'
        }
      });
      return;
    }
    const batches = await inventoryService.getBatchesByItem(inventoryItemId);

    res.json({
      success: true,
      data: batches
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BATCHES_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/batches/expiring', authenticate, async (req: Request, res: Response) => {
  try {
    const daysAhead = req.query.days ? parseInt(req.query.days as string) : 30;
    const expiringBatches = await inventoryService.getExpiringBatches(daysAhead);

    res.json({
      success: true,
      data: expiringBatches
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'EXPIRING_BATCHES_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// Stock transaction APIs
router.post('/transactions', authenticate, validate({ body: stockTransactionSchema }), async (req: Request, res: Response) => {
  try {
    const transaction = await inventoryService.recordStockTransaction({
      ...req.body,
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Stock transaction recorded successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'TRANSACTION_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/transactions', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.inventoryItemId) {
      filters.inventoryItemId = req.query.inventoryItemId as string;
    }
    if (req.query.warehouseId) {
      filters.warehouseId = req.query.warehouseId as string;
    }
    if (req.query.transactionType) {
      filters.transactionType = req.query.transactionType as string;
    }
    if (req.query.dateFrom) {
      filters.dateFrom = new Date(req.query.dateFrom as string);
    }
    if (req.query.dateTo) {
      filters.dateTo = new Date(req.query.dateTo as string);
    }

    const transactions = await inventoryService.getStockTransactions(filters);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'TRANSACTIONS_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// Safety stock and reorder point monitoring APIs
router.get('/alerts/low-stock', authenticate, async (req: Request, res: Response) => {
  try {
    const lowStockItems = await inventoryService.getItemsBelowSafetyStock();

    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'LOW_STOCK_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

router.post('/alerts/generate-reorder', authenticate, async (req: Request, res: Response) => {
  try {
    const alerts = await inventoryService.checkAndGenerateReorderAlerts();

    res.json({
      success: true,
      data: alerts,
      message: `Generated ${alerts.length} reorder alerts`
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'REORDER_ALERT_GENERATION_FAILED',
        message: error.message
      }
    });
  }
});

// Order-wise material allocation APIs
router.post('/allocate-order', authenticate, validate({ body: orderAllocationSchema }), async (req: Request, res: Response) => {
  try {
    const { orderId, orderType, items } = req.body;
    const allocations = await inventoryService.allocateOrderMaterials(orderId, orderType, items);

    res.json({
      success: true,
      data: allocations,
      message: 'Materials allocated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MATERIAL_ALLOCATION_FAILED',
        message: error.message
      }
    });
  }
});

// Inter-branch stock transfer APIs
router.post('/transfers', authenticate, validate({ body: stockTransferSchema }), async (req: Request, res: Response) => {
  try {
    const transfer = await inventoryService.createStockTransfer({
      ...req.body,
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: transfer,
      message: 'Stock transfer created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'TRANSFER_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

router.put('/transfers/:transferId/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transferId } = req.params;
    if (!transferId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSFER_ID',
          message: 'Transfer ID is required'
        }
      });
      return;
    }
    const { status, ...updateData } = req.body;

    const transfer = await inventoryService.updateTransferStatus(transferId, status, updateData);

    res.json({
      success: true,
      data: transfer,
      message: 'Transfer status updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'TRANSFER_UPDATE_FAILED',
        message: error.message
      }
    });
  }
});

// Inventory valuation APIs
router.get('/valuation', authenticate, async (req: Request, res: Response) => {
  try {
    const method = (req.query.method as 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE') || 'FIFO';
    const warehouseId = req.query.warehouseId as string;

    const valuation = await inventoryService.calculateInventoryValuation(method, warehouseId);

    res.json({
      success: true,
      data: valuation,
      meta: {
        method,
        warehouseId: warehouseId || 'ALL'
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALUATION_CALCULATION_FAILED',
        message: error.message
      }
    });
  }
});

// Enhanced order-wise material allocation and reservation APIs
const reservationSchema = z.object({
  orderId: z.string().uuid(),
  orderType: z.string().min(1),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
    rackCode: z.string().optional(),
    binCode: z.string().optional()
  }))
});

router.post('/reserve-materials', authenticate, validate({ body: reservationSchema }), async (req: Request, res: Response) => {
  try {
    const { orderId, orderType, items } = req.body;
    const reservations = await inventoryService.reserveOrderMaterials(orderId, orderType, items);

    res.json({
      success: true,
      data: reservations,
      message: 'Materials reserved successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MATERIAL_RESERVATION_FAILED',
        message: error.message
      }
    });
  }
});

router.post('/release-reservation', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId, orderType } = req.body;
    const releasedCount = await inventoryService.releaseOrderReservation(orderId, orderType);

    res.json({
      success: true,
      data: { releasedCount },
      message: 'Reservations released successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'RESERVATION_RELEASE_FAILED',
        message: error.message
      }
    });
  }
});

// Cycle counting and stock adjustment APIs
const cycleCountSchema = z.object({
  warehouseId: z.string().uuid(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    countedQuantity: z.number().min(0),
    remarks: z.string().optional()
  }))
});

router.post('/cycle-count', authenticate, validate({ body: cycleCountSchema }), async (req: Request, res: Response) => {
  try {
    const { warehouseId, items } = req.body;
    const result = await inventoryService.createCycleCount(warehouseId, items, req.user?.id || 'system');

    res.json({
      success: true,
      data: result,
      message: 'Cycle count completed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CYCLE_COUNT_FAILED',
        message: error.message
      }
    });
  }
});

const stockAdjustmentSchema = z.object({
  inventoryItemId: z.string().uuid(),
  newQuantity: z.number().min(0),
  reason: z.string().min(1)
});

router.post('/stock-adjustment', authenticate, validate({ body: stockAdjustmentSchema }), async (req: Request, res: Response) => {
  try {
    const { inventoryItemId, newQuantity, reason } = req.body;
    const adjustment = await inventoryService.performStockAdjustment(
      inventoryItemId, 
      newQuantity, 
      reason, 
      req.user?.id || 'system'
    );

    res.json({
      success: true,
      data: adjustment,
      message: 'Stock adjustment completed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'STOCK_ADJUSTMENT_FAILED',
        message: error.message
      }
    });
  }
});

// Goods receipt and put-away APIs
const goodsReceiptSchema = z.object({
  grnNumber: z.string().min(1),
  poId: z.string().uuid().optional(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    receivedQuantity: z.number().positive(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    rackCode: z.string().optional(),
    binCode: z.string().optional()
  }))
});

router.post('/goods-receipt', authenticate, validate({ body: goodsReceiptSchema }), async (req: Request, res: Response) => {
  try {
    const grnData = {
      ...req.body,
      receivedBy: req.user?.id || 'system',
      items: req.body.items.map((item: any) => ({
        ...item,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined
      }))
    };

    const receipts = await inventoryService.processGoodsReceipt(grnData);

    res.json({
      success: true,
      data: receipts,
      message: 'Goods receipt processed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GOODS_RECEIPT_FAILED',
        message: error.message
      }
    });
  }
});

const putAwaySchema = z.object({
  inventoryItemId: z.string().uuid(),
  fromLocation: z.object({
    rackCode: z.string().min(1),
    binCode: z.string().min(1)
  }),
  toLocation: z.object({
    rackCode: z.string().min(1),
    binCode: z.string().min(1)
  }),
  quantity: z.number().positive()
});

router.post('/put-away', authenticate, validate({ body: putAwaySchema }), async (req: Request, res: Response) => {
  try {
    const putAwayData = {
      ...req.body,
      putAwayBy: req.user?.id || 'system'
    };

    const putAway = await inventoryService.processPutAway(putAwayData);

    res.json({
      success: true,
      data: putAway,
      message: 'Put-away completed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PUT_AWAY_FAILED',
        message: error.message
      }
    });
  }
});

// Enhanced stock transfer APIs
router.post('/transfers/:transferId/ship', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transferId } = req.params;
    if (!transferId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSFER_ID',
          message: 'Transfer ID is required'
        }
      });
      return;
    }
    
    const { shippedItems } = req.body;
    const transfer = await inventoryService.processStockTransferShipment(
      transferId, 
      shippedItems, 
      req.user?.id || 'system'
    );

    res.json({
      success: true,
      data: transfer,
      message: 'Stock transfer shipped successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'TRANSFER_SHIPMENT_FAILED',
        message: error.message
      }
    });
  }
});

router.post('/transfers/:transferId/receive', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transferId } = req.params;
    if (!transferId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSFER_ID',
          message: 'Transfer ID is required'
        }
      });
      return;
    }
    
    const { receivedItems } = req.body;
    const transfer = await inventoryService.processStockTransferReceipt(
      transferId, 
      receivedItems, 
      req.user?.id || 'system'
    );

    res.json({
      success: true,
      data: transfer,
      message: 'Stock transfer received successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'TRANSFER_RECEIPT_FAILED',
        message: error.message
      }
    });
  }
});

// Stock inquiry and reporting APIs
router.get('/inquiry', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: {
      itemCode?: string;
      category?: string;
      warehouseId?: string;
      branchId?: string;
      lowStock?: boolean;
      expiringBatches?: boolean;
      daysAhead?: number;
    } = {};

    if (req.query.itemCode) filters.itemCode = req.query.itemCode as string;
    if (req.query.category) filters.category = req.query.category as string;
    if (req.query.warehouseId) filters.warehouseId = req.query.warehouseId as string;
    if (req.query.branchId) filters.branchId = req.query.branchId as string;
    if (req.query.lowStock) filters.lowStock = req.query.lowStock === 'true';
    if (req.query.expiringBatches) filters.expiringBatches = req.query.expiringBatches === 'true';
    if (req.query.daysAhead) filters.daysAhead = parseInt(req.query.daysAhead as string);

    const inquiry = await inventoryService.getStockInquiry(filters);

    res.json({
      success: true,
      data: inquiry
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'STOCK_INQUIRY_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/reports/movement', authenticate, async (req: Request, res: Response) => {
  try {
    const filters = {
      dateFrom: new Date(req.query.dateFrom as string),
      dateTo: new Date(req.query.dateTo as string),
      warehouseId: req.query.warehouseId as string,
      branchId: req.query.branchId as string,
      itemCode: req.query.itemCode as string,
      transactionType: req.query.transactionType as string
    };

    const report = await inventoryService.getStockMovementReport(filters);

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MOVEMENT_REPORT_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/reports/aging', authenticate, async (req: Request, res: Response) => {
  try {
    const warehouseId = req.query.warehouseId as string;
    const aging = await inventoryService.getInventoryAging(warehouseId);

    res.json({
      success: true,
      data: aging
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'AGING_REPORT_FAILED',
        message: error.message
      }
    });
  }
});

export default router;