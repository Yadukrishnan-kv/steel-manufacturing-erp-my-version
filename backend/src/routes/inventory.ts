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

/**
 * @swagger
 * /inventory/items:
 *   post:
 *     summary: Create inventory item
 *     description: Create a new inventory item with warehouse assignment
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemCode, name, category, unit, warehouseId]
 *             properties:
 *               itemCode:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [RAW_MATERIAL, SEMI_FINISHED, FINISHED_GOOD, CONSUMABLE]
 *               unit:
 *                 type: string
 *               standardCost:
 *                 type: number
 *               reorderLevel:
 *                 type: number
 *               safetyStock:
 *                 type: number
 *               leadTimeDays:
 *                 type: number
 *               isBatchTracked:
 *                 type: boolean
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               binId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/items/warehouse/{warehouseId}:
 *   get:
 *     summary: Get items by warehouse
 *     description: Get all inventory items in a specific warehouse
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: List of inventory items
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/stock/{itemCode}:
 *   get:
 *     summary: Get multi-warehouse stock
 *     description: Get stock levels across all warehouses for an item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Item code
 *     responses:
 *       200:
 *         description: Stock levels across warehouses
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/locations/assign:
 *   post:
 *     summary: Assign location
 *     description: Assign rack/bin location to an inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inventoryItemId, warehouseId, rackCode, binCode]
 *             properties:
 *               inventoryItemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               rackCode:
 *                 type: string
 *               binCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location assigned successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/locations/warehouse/{warehouseId}:
 *   get:
 *     summary: Get locations by warehouse
 *     description: Get all rack/bin locations in a warehouse
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: List of locations
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/barcode/{barcode}:
 *   get:
 *     summary: Scan barcode
 *     description: Get item details by scanning barcode/QR code
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *         description: Barcode or QR code value
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/batches:
 *   post:
 *     summary: Create batch record
 *     description: Create a new batch/lot record for inventory tracking
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [batchNumber, inventoryItemId, quantity, receivedDate]
 *             properties:
 *               batchNumber:
 *                 type: string
 *               inventoryItemId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *               manufactureDate:
 *                 type: string
 *                 format: date-time
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               supplierLot:
 *                 type: string
 *               receivedDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Batch record created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/batches/item/{inventoryItemId}:
 *   get:
 *     summary: Get batches by item
 *     description: Get all batches for a specific inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryItemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: List of batches
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/batches/expiring:
 *   get:
 *     summary: Get expiring batches
 *     description: Get batches expiring within specified days
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Days ahead to check for expiry
 *     responses:
 *       200:
 *         description: List of expiring batches
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/transactions:
 *   post:
 *     summary: Record stock transaction
 *     description: Record a stock transaction (IN, OUT, TRANSFER, ADJUSTMENT)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionType, inventoryItemId, warehouseId, quantity]
 *             properties:
 *               transactionType:
 *                 type: string
 *                 enum: [IN, OUT, TRANSFER, ADJUSTMENT]
 *               inventoryItemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               batchId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *               unitCost:
 *                 type: number
 *               referenceType:
 *                 type: string
 *               referenceId:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StockTransaction'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/transactions:
 *   get:
 *     summary: Get stock transactions
 *     description: Get stock transactions with filtering
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: inventoryItemId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by inventory item
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [IN, OUT, TRANSFER, ADJUSTMENT]
 *         description: Filter by transaction type
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/alerts/low-stock:
 *   get:
 *     summary: Get low stock alerts
 *     description: Get items below safety stock level
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock items
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/alerts/generate-reorder:
 *   post:
 *     summary: Generate reorder alerts
 *     description: Check inventory levels and generate reorder alerts
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reorder alerts generated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/allocate-order:
 *   post:
 *     summary: Allocate order materials
 *     description: Allocate materials for a specific order
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, orderType, items]
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               orderType:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Materials allocated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/transfers:
 *   post:
 *     summary: Create stock transfer
 *     description: Create inter-branch stock transfer request
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromBranchId, toBranchId, items]
 *             properties:
 *               fromBranchId:
 *                 type: string
 *                 format: uuid
 *               toBranchId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     requestedQty:
 *                       type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock transfer created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/transfers/{transferId}/status:
 *   put:
 *     summary: Update transfer status
 *     description: Update the status of a stock transfer
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, SHIPPED, RECEIVED, CANCELLED]
 *     responses:
 *       200:
 *         description: Transfer status updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/valuation:
 *   get:
 *     summary: Get inventory valuation
 *     description: Calculate inventory valuation using FIFO, LIFO, or weighted average
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [FIFO, LIFO, WEIGHTED_AVERAGE]
 *           default: FIFO
 *         description: Valuation method
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse
 *     responses:
 *       200:
 *         description: Inventory valuation data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/reserve-materials:
 *   post:
 *     summary: Reserve materials
 *     description: Reserve materials for order with location details
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, orderType, items]
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               orderType:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     rackCode:
 *                       type: string
 *                     binCode:
 *                       type: string
 *     responses:
 *       200:
 *         description: Materials reserved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/release-reservation:
 *   post:
 *     summary: Release material reservations
 *     description: Release all material reservations for an order
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, orderType]
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               orderType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservations released successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/cycle-count:
 *   post:
 *     summary: Perform cycle count
 *     description: Perform cycle counting for inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, items]
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     countedQuantity:
 *                       type: number
 *                     remarks:
 *                       type: string
 *     responses:
 *       200:
 *         description: Cycle count completed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/stock-adjustment:
 *   post:
 *     summary: Perform stock adjustment
 *     description: Adjust stock quantity for an inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inventoryItemId, newQuantity, reason]
 *             properties:
 *               inventoryItemId:
 *                 type: string
 *                 format: uuid
 *               newQuantity:
 *                 type: number
 *                 minimum: 0
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock adjustment completed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/goods-receipt:
 *   post:
 *     summary: Process goods receipt
 *     description: Process goods receipt with location assignment
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grnNumber, items]
 *             properties:
 *               grnNumber:
 *                 type: string
 *               poId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     receivedQuantity:
 *                       type: number
 *                     batchNumber:
 *                       type: string
 *                     expiryDate:
 *                       type: string
 *                       format: date-time
 *                     rackCode:
 *                       type: string
 *                     binCode:
 *                       type: string
 *     responses:
 *       200:
 *         description: Goods receipt processed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/put-away:
 *   post:
 *     summary: Process put-away
 *     description: Move inventory items from one location to another
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inventoryItemId, fromLocation, toLocation, quantity]
 *             properties:
 *               inventoryItemId:
 *                 type: string
 *                 format: uuid
 *               fromLocation:
 *                 type: object
 *                 properties:
 *                   rackCode:
 *                     type: string
 *                   binCode:
 *                     type: string
 *               toLocation:
 *                 type: object
 *                 properties:
 *                   rackCode:
 *                     type: string
 *                   binCode:
 *                     type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Put-away completed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/transfers/{transferId}/ship:
 *   post:
 *     summary: Ship stock transfer
 *     description: Process shipment of stock transfer
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippedItems]
 *             properties:
 *               shippedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     shippedQuantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Stock transfer shipped successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/transfers/{transferId}/receive:
 *   post:
 *     summary: Receive stock transfer
 *     description: Process receipt of stock transfer
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receivedItems]
 *             properties:
 *               receivedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     receivedQuantity:
 *                       type: number
 *                     condition:
 *                       type: string
 *     responses:
 *       200:
 *         description: Stock transfer received successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/inquiry:
 *   get:
 *     summary: Stock inquiry
 *     description: Get comprehensive stock inquiry with filtering
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemCode
 *         schema:
 *           type: string
 *         description: Filter by item code
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter low stock items
 *       - in: query
 *         name: expiringBatches
 *         schema:
 *           type: boolean
 *         description: Filter expiring batches
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *         description: Days ahead for expiry check
 *     responses:
 *       200:
 *         description: Stock inquiry data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/reports/movement:
 *   get:
 *     summary: Get stock movement report
 *     description: Get detailed stock movement report with filtering
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: dateTo
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *       - in: query
 *         name: itemCode
 *         schema:
 *           type: string
 *         description: Filter by item code
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [IN, OUT, TRANSFER, ADJUSTMENT]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Stock movement report data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /inventory/reports/aging:
 *   get:
 *     summary: Get inventory aging report
 *     description: Get inventory aging analysis report
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse
 *     responses:
 *       200:
 *         description: Inventory aging report data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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