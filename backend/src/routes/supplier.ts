import { Router, Request, Response } from 'express';
import { supplierService } from '../services/supplier.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createSupplierSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  gstNumber: z.string().optional(),
  branchId: z.string().uuid(),
  contactPerson: z.string().optional(),
  alternatePhone: z.string().optional(),
  website: z.string().url().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolderName: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().positive().optional(),
  creditDays: z.number().positive().optional(),
  businessType: z.string().optional(),
  yearEstablished: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  annualTurnover: z.number().positive().optional(),
  certifications: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional()
});

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  pincode: z.string().min(1).optional(),
  gstNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  alternatePhone: z.string().optional(),
  website: z.string().url().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolderName: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().positive().optional(),
  creditDays: z.number().positive().optional(),
  businessType: z.string().optional(),
  yearEstablished: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  annualTurnover: z.number().positive().optional(),
  certifications: z.string().optional(),
  isActive: z.boolean().optional()
});

const paymentTermsSchema = z.object({
  terms: z.string().min(1),
  creditLimit: z.number().positive().optional(),
  creditDays: z.number().positive().optional(),
  advancePercentage: z.number().min(0).max(100).optional()
});

const communicationSchema = z.object({
  type: z.enum(['EMAIL', 'PHONE', 'MEETING', 'PORTAL', 'DOCUMENT']),
  subject: z.string().min(1),
  content: z.string().min(1),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  status: z.enum(['SENT', 'DELIVERED', 'READ', 'REPLIED']),
  attachments: z.string().optional()
});

const documentUploadSchema = z.object({
  documentType: z.enum(['CONTRACT', 'CERTIFICATE', 'INVOICE', 'AGREEMENT', 'COMPLIANCE', 'OTHER']),
  documentName: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  expiryDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true)
});

const vendorPortalSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string())
});

// Supplier Master Data Management APIs
router.post('/', authenticate, validate({ body: createSupplierSchema }), async (req: Request, res: Response) => {
  try {
    const supplier = await supplierService.createSupplier(req.body, req.user?.id || 'system');

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SUPPLIER_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.branchId) filters.branchId = req.query.branchId as string;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    if (req.query.city) filters.city = req.query.city as string;
    if (req.query.state) filters.state = req.query.state as string;
    if (req.query.rating) filters.rating = parseFloat(req.query.rating as string);
    if (req.query.search) filters.search = req.query.search as string;

    const suppliers = await supplierService.getAllSuppliers(filters);

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SUPPLIER_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/:supplierId', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const supplier = await supplierService.getSupplier(supplierId);

    res.json({
      success: true,
      data: supplier
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: 'SUPPLIER_NOT_FOUND',
        message: error.message
      }
    });
  }
});

router.put('/:supplierId', authenticate, validate({ body: updateSupplierSchema }), async (req: Request, res: Response): Promise<void> => {
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

    const supplier = await supplierService.updateSupplier(supplierId, req.body, req.user?.id || 'system');

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SUPPLIER_UPDATE_FAILED',
        message: error.message
      }
    });
  }
});

router.put('/:supplierId/deactivate', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const { reason } = req.body;
    const supplier = await supplierService.deactivateSupplier(supplierId, req.user?.id || 'system', reason);

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier deactivated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SUPPLIER_DEACTIVATION_FAILED',
        message: error.message
      }
    });
  }
});

// Vendor Performance Tracking APIs
router.get('/:supplierId/performance', authenticate, async (req: Request, res: Response): Promise<void> => {
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
    const performance = await supplierService.calculateSupplierPerformance(supplierId, periodMonths);

    // Update supplier rating based on performance
    await supplierService.updateSupplierRating(supplierId, performance);

    res.json({
      success: true,
      data: performance
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PERFORMANCE_CALCULATION_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/top-performers', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const branchId = req.query.branchId as string;

    const topSuppliers = await supplierService.getTopPerformingSuppliers(limit, branchId);

    res.json({
      success: true,
      data: topSuppliers
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'TOP_PERFORMERS_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// Supplier Quote Comparison APIs
router.get('/rfq/:rfqId/quote-comparison', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const comparison = await supplierService.compareSupplierQuotes(rfqId);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'QUOTE_COMPARISON_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/:supplierId/quote-history', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const itemId = req.query.itemId as string;
    const months = req.query.months ? parseInt(req.query.months as string) : 12;

    const history = await supplierService.getSupplierQuoteHistory(supplierId, itemId, months);

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'QUOTE_HISTORY_FAILED',
        message: error.message
      }
    });
  }
});

// Payment Terms and Credit Management APIs
router.put('/:supplierId/payment-terms', authenticate, validate({ body: paymentTermsSchema }), async (req: Request, res: Response): Promise<void> => {
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

    const supplier = await supplierService.updatePaymentTerms(supplierId, req.body, req.user?.id || 'system');

    res.json({
      success: true,
      data: supplier,
      message: 'Payment terms updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PAYMENT_TERMS_UPDATE_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/:supplierId/credit-utilization', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const creditInfo = await supplierService.getCreditUtilization(supplierId);

    res.json({
      success: true,
      data: creditInfo
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREDIT_UTILIZATION_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/payments/overdue', authenticate, async (req: Request, res: Response) => {
  try {
    const supplierId = req.query.supplierId as string;
    const overduePayments = await supplierService.getOverduePayments(supplierId);

    res.json({
      success: true,
      data: overduePayments
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'OVERDUE_PAYMENTS_FAILED',
        message: error.message
      }
    });
  }
});

// Communication and Document Management APIs
router.post('/:supplierId/communications', authenticate, validate({ body: communicationSchema }), async (req: Request, res: Response): Promise<void> => {
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

    const communication = await supplierService.logCommunication({
      supplierId,
      ...req.body,
      communicatedBy: req.user?.id || 'system'
    });

    res.status(201).json({
      success: true,
      data: communication,
      message: 'Communication logged successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'COMMUNICATION_LOG_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/:supplierId/communications', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const communications = await supplierService.getCommunicationHistory(supplierId, limit);

    res.json({
      success: true,
      data: communications
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'COMMUNICATION_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

router.post('/:supplierId/documents', authenticate, validate({ body: documentUploadSchema }), async (req: Request, res: Response): Promise<void> => {
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

    const document = await supplierService.uploadDocument({
      supplierId,
      ...req.body,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      uploadedBy: req.user?.id || 'system'
    });

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DOCUMENT_UPLOAD_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/:supplierId/documents', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const documentType = req.query.documentType as string;
    const documents = await supplierService.getSupplierDocuments(supplierId, documentType);

    res.json({
      success: true,
      data: documents
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DOCUMENT_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// Vendor Portal Integration APIs
router.post('/:supplierId/portal-access', authenticate, validate({ body: vendorPortalSchema }), async (req: Request, res: Response): Promise<void> => {
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

    const portalAccess = await supplierService.createVendorPortalAccess({
      supplierId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: portalAccess,
      message: 'Vendor portal access created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PORTAL_ACCESS_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

router.put('/:supplierId/portal-access', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const portalAccess = await supplierService.updateVendorPortalAccess(supplierId, req.body);

    res.json({
      success: true,
      data: portalAccess,
      message: 'Vendor portal access updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PORTAL_ACCESS_UPDATE_FAILED',
        message: error.message
      }
    });
  }
});

router.get('/:supplierId/portal-activity', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const activity = await supplierService.getVendorPortalActivity(supplierId, days);

    res.json({
      success: true,
      data: activity
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PORTAL_ACTIVITY_FAILED',
        message: error.message
      }
    });
  }
});

// Reporting and Analytics APIs
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId as string;
    const dashboard = await supplierService.getSupplierDashboard(branchId);

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

router.get('/:supplierId/reports/:reportType', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId, reportType } = req.params;
    if (!supplierId || !reportType) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Supplier ID and report type are required'
        }
      });
      return;
    }

    if (!['PERFORMANCE', 'FINANCIAL', 'COMPLIANCE'].includes(reportType.toUpperCase())) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPORT_TYPE',
          message: 'Report type must be PERFORMANCE, FINANCIAL, or COMPLIANCE'
        }
      });
      return;
    }

    const report = await supplierService.generateSupplierReport(
      supplierId, 
      reportType.toUpperCase() as 'PERFORMANCE' | 'FINANCIAL' | 'COMPLIANCE'
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'REPORT_GENERATION_FAILED',
        message: error.message
      }
    });
  }
});

export default router;