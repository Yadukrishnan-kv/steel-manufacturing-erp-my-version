import { Router, Request, Response } from 'express';
import { procurementService } from '../services/procurement.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createPRSchema = z.object({
  requestedBy: z.string().min(1),
  department: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  requiredDate: z.string().datetime(),
  remarks: z.string().optional(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
    estimatedCost: z.number().optional(),
    justification: z.string().optional()
  }))
});

const autoGeneratePRSchema = z.object({
  stockOutItems: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    requiredQuantity: z.number().positive(),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  })),
  requestedBy: z.string().min(1),
  department: z.string().optional()
});

const createRFQSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
    specifications: z.string().optional()
  })),
  supplierIds: z.array(z.string().uuid())
});

const rfqResponseSchema = z.object({
  rfqId: z.string().uuid(),
  supplierId: z.string().uuid(),
  totalAmount: z.number().positive(),
  deliveryDays: z.number().positive(),
  validUntil: z.string().datetime(),
  terms: z.string().optional(),
  items: z.array(z.object({
    rfqItemId: z.string().uuid(),
    unitPrice: z.number().positive(),
    totalPrice: z.number().positive(),
    remarks: z.string().optional()
  }))
});

const createPOSchema = z.object({
  supplierId: z.string().uuid(),
  prId: z.string().uuid().optional(),
  deliveryDate: z.string().datetime(),
  terms: z.string().optional(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    totalPrice: z.number().positive()
  }))
});

const createGRNSchema = z.object({
  poId: z.string().uuid(),
  items: z.array(z.object({
    poItemId: z.string().uuid(),
    receivedQty: z.number().min(0),
    acceptedQty: z.number().min(0),
    rejectedQty: z.number().min(0).optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    remarks: z.string().optional()
  })),
  qcRemarks: z.string().optional()
});

const supplierEvaluationSchema = z.object({
  supplierId: z.string().uuid(),
  deliveryRating: z.number().min(1).max(5),
  qualityRating: z.number().min(1).max(5),
  pricingRating: z.number().min(1).max(5),
  evaluationPeriod: z.string().regex(/^\d{4}-\d{2}$/),
  comments: z.string().optional()
});

const interBranchTransferSchema = z.object({
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    requestedQty: z.number().positive(),
    justification: z.string().optional()
  }))
});

// Purchase Requisition APIs
router.post('/requisitions', authenticate, validate({ body: createPRSchema }), async (req: Request, res: Response) => {
  try {
    const prData = {
      ...req.body,
      requiredDate: new Date(req.body.requiredDate)
    };

    const pr = await procurementService.createPurchaseRequisition(prData);

    res.status(201).json({
      success: true,
      data: pr,
      message: 'Purchase requisition created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PR_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

router.post('/requisitions/auto-generate', authenticate, validate({ body: autoGeneratePRSchema }), async (req: Request, res: Response) => {
  try {
    const { stockOutItems, requestedBy, department } = req.body;
    
    const pr = await procurementService.generateAutomaticPR(
      stockOutItems,
      requestedBy,
      department || 'PROCUREMENT'
    );

    res.status(201).json({
      success: true,
      data: pr,
      message: 'Automatic purchase requisition generated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'AUTO_PR_GENERATION_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/requisitions', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.department) filters.department = req.query.department as string;
    if (req.query.priority) filters.priority = req.query.priority as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

    const prs = await procurementService.getPurchaseRequisitions(filters);

    res.json({
      success: true,
      data: prs
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PR_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

router.put('/requisitions/:prId/approve', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { prId } = req.params;
    if (!prId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PR_ID',
          message: 'PR ID is required'
        }
      });
      return;
    }

    const pr = await procurementService.approvePurchaseRequisition(prId, req.user?.id || 'system');

    res.json({
      success: true,
      data: pr,
      message: 'Purchase requisition approved successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PR_APPROVAL_FAILED',
        message: error.message
      }
    });
  }
});

router.put('/requisitions/:prId/reject', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { prId } = req.params;
    if (!prId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PR_ID',
          message: 'PR ID is required'
        }
      });
      return;
    }

    const { remarks } = req.body;
    const pr = await procurementService.rejectPurchaseRequisition(prId, req.user?.id || 'system', remarks);

    res.json({
      success: true,
      data: pr,
      message: 'Purchase requisition rejected successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PR_REJECTION_FAILED',
        message: error.message
      }
    });
  }
});

// RFQ Management APIs
router.post('/rfq', authenticate, validate({ body: createRFQSchema }), async (req: Request, res: Response) => {
  try {
    const rfqData = {
      ...req.body,
      dueDate: new Date(req.body.dueDate)
    };

    const rfq = await procurementService.createRFQ(rfqData);

    res.status(201).json({
      success: true,
      data: rfq,
      message: 'RFQ created and sent to suppliers successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'RFQ_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

router.post('/rfq/responses', authenticate, validate({ body: rfqResponseSchema }), async (req: Request, res: Response) => {
  try {
    const responseData = {
      ...req.body,
      validUntil: new Date(req.body.validUntil)
    };

    const response = await procurementService.submitRFQResponse(responseData);

    res.status(201).json({
      success: true,
      data: response,
      message: 'RFQ response submitted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'RFQ_RESPONSE_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/rfq/:rfqId/comparison', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rfqId } = req.params;
    if (!rfqId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RFQ_ID',
          message: 'RFQ ID is required'
        }
      });
      return;
    }

    const comparison = await procurementService.compareRFQResponses(rfqId);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'RFQ_COMPARISON_FAILED',
        message: error.message
      }
    });
  }
});

router.put('/rfq/responses/:responseId/select', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { responseId } = req.params;
    if (!responseId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESPONSE_ID',
          message: 'Response ID is required'
        }
      });
      return;
    }

    const selectedResponse = await procurementService.selectRFQResponse(responseId, req.user?.id || 'system');

    res.json({
      success: true,
      data: selectedResponse,
      message: 'RFQ response selected successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'RFQ_SELECTION_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/rfq', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

    const rfqs = await procurementService.getRFQs(filters);

    res.json({
      success: true,
      data: rfqs
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'RFQ_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// Supplier Evaluation APIs
router.post('/suppliers/evaluate', authenticate, validate({ body: supplierEvaluationSchema }), async (req: Request, res: Response) => {
  try {
    const evaluation = await procurementService.evaluateSupplier(req.body);

    res.json({
      success: true,
      data: evaluation,
      message: 'Supplier evaluation completed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SUPPLIER_EVALUATION_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/suppliers/:supplierId/performance', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    if (!supplierId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SUPPLIER_ID',
          message: 'Supplier ID is required'
        }
      });
      return;
    }

    const periodMonths = req.query.months ? parseInt(req.query.months as string) : 12;
    const performance = await procurementService.getSupplierPerformance(supplierId, periodMonths);

    res.json({
      success: true,
      data: performance
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SUPPLIER_PERFORMANCE_FAILED',
        message: error.message
      }
    });
  }
});

// Purchase Order Management APIs
router.post('/orders', authenticate, validate({ body: createPOSchema }), async (req: Request, res: Response) => {
  try {
    const poData = {
      ...req.body,
      deliveryDate: new Date(req.body.deliveryDate)
    };

    const po = await procurementService.createPurchaseOrder(poData, req.user?.id || 'system');

    res.status(201).json({
      success: true,
      data: po,
      message: 'Purchase order created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PO_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

router.put('/orders/:poId/approve', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { poId } = req.params;
    if (!poId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PO_ID',
          message: 'PO ID is required'
        }
      });
      return;
    }

    const po = await procurementService.approvePurchaseOrder(poId, req.user?.id || 'system');

    res.json({
      success: true,
      data: po,
      message: 'Purchase order approved successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PO_APPROVAL_FAILED',
        message: error.message
      }
    });
  }
});

router.put('/orders/:poId/send', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { poId } = req.params;
    if (!poId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PO_ID',
          message: 'PO ID is required'
        }
      });
      return;
    }

    const po = await procurementService.sendPurchaseOrder(poId);

    res.json({
      success: true,
      data: po,
      message: 'Purchase order sent to supplier successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PO_SEND_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.supplierId) filters.supplierId = req.query.supplierId as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

    const pos = await procurementService.getPurchaseOrders(filters);

    res.json({
      success: true,
      data: pos
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PO_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/orders/:poId/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { poId } = req.params;
    if (!poId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PO_ID',
          message: 'PO ID is required'
        }
      });
      return;
    }

    const status = await procurementService.getPurchaseOrderStatus(poId);

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PO_STATUS_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/orders/overdue', authenticate, async (req: Request, res: Response) => {
  try {
    const overduePOs = await procurementService.getOverduePurchaseOrders();

    res.json({
      success: true,
      data: overduePOs
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'OVERDUE_PO_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// GRN Processing APIs
router.post('/grn', authenticate, validate({ body: createGRNSchema }), async (req: Request, res: Response) => {
  try {
    const grnData = {
      ...req.body,
      receivedBy: req.user?.id || 'system',
      items: req.body.items.map((item: any) => ({
        ...item,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined
      }))
    };

    const grn = await procurementService.createGRN(grnData);

    res.status(201).json({
      success: true,
      data: grn,
      message: 'GRN created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GRN_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

router.put('/grn/:grnId/qc-status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { grnId } = req.params;
    if (!grnId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GRN_ID',
          message: 'GRN ID is required'
        }
      });
      return;
    }

    const { qcStatus, qcRemarks } = req.body;

    if (!qcStatus || !['PASSED', 'FAILED'].includes(qcStatus)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QC_STATUS',
          message: 'QC status must be PASSED or FAILED'
        }
      });
      return;
    }

    const grn = await procurementService.updateGRNQCStatus(grnId, qcStatus, qcRemarks);

    res.json({
      success: true,
      data: grn,
      message: 'GRN QC status updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GRN_QC_UPDATE_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/grn', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.qcStatus) filters.qcStatus = req.query.qcStatus as string;
    if (req.query.supplierId) filters.supplierId = req.query.supplierId as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

    const grns = await procurementService.getGRNRecords(filters);

    res.json({
      success: true,
      data: grns
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GRN_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// Inter-branch Transfer APIs
router.post('/inter-branch-transfer', authenticate, validate({ body: interBranchTransferSchema }), async (req: Request, res: Response) => {
  try {
    const { fromBranchId, toBranchId, items } = req.body;
    
    const transfer = await procurementService.requestInterBranchTransfer(
      fromBranchId,
      toBranchId,
      items,
      req.user?.id || 'system'
    );

    res.status(201).json({
      success: true,
      data: transfer,
      message: 'Inter-branch transfer request created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INTER_BRANCH_TRANSFER_FAILED',
        message: error.message
      }
    });
  }
});

// Dashboard and Reporting APIs
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId as string;
    const dashboard = await procurementService.getProcurementDashboard(branchId);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DASHBOARD_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

export default router;