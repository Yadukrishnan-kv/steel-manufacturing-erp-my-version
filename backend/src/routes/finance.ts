import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  FinanceService,
  ProfitLossRequest,
  TaxCalculationRequest,
  InvoiceRequest,
  PaymentRequest,
  BankReconciliationRequest,
} from '../services/finance.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const financeService = new FinanceService(prisma);

// Validation schemas
const profitLossSchema = z.object({
  branchId: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  includeConsolidated: z.boolean().optional(),
});

const taxCalculationSchema = z.object({
  amount: z.number().positive(),
  taxType: z.enum(['GST', 'TDS', 'PROFESSIONAL_TAX', 'CESS']).optional(),
  gstRate: z.number().min(0).max(100).optional(),
  tdsRate: z.number().min(0).max(100).optional(),
  isInterState: z.boolean().optional(),
  customerGstNumber: z.string().optional(),
  supplierGstNumber: z.string().optional(),
});

const invoiceSchema = z.object({
  customerId: z.string().uuid(),
  referenceType: z.enum(['SALES_ORDER', 'SERVICE_REQUEST']),
  referenceId: z.string().uuid(),
  invoiceDate: z.string().transform(str => new Date(str)),
  dueDate: z.string().transform(str => new Date(str)),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    itemType: z.enum(['PARTS', 'LABOR', 'ADDITIONAL', 'PRODUCT']),
    itemId: z.string().optional(),
  })),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  paymentDate: z.string().transform(str => new Date(str)),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

const bankReconciliationSchema = z.object({
  bankAccountId: z.string(),
  statementDate: z.string().transform(str => new Date(str)),
  statementBalance: z.number(),
  transactions: z.array(z.object({
    transactionDate: z.string().transform(str => new Date(str)),
    description: z.string(),
    amount: z.number(),
    type: z.enum(['DEBIT', 'CREDIT']),
    referenceNumber: z.string().optional(),
  })),
});

/**
 * @swagger
 * /finance/accounts-receivable:
 *   get:
 *     summary: Get accounts receivable
 *     description: Get accounts receivable management data
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *     responses:
 *       200:
 *         description: Accounts receivable data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/accounts-receivable', authenticate, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    
    const receivables = await financeService.getAccountsReceivable(branchId as string);
    
    res.json({
      success: true,
      data: receivables,
      summary: {
        totalCustomers: receivables.length,
        totalOutstanding: receivables.reduce((sum, r) => sum + r.totalOutstanding, 0),
        totalOverdue: receivables.reduce((sum, r) => sum + r.overdueAmount, 0),
      },
    });
  } catch (error) {
    logger.error('Error getting accounts receivable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get accounts receivable data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /finance/accounts-payable:
 *   get:
 *     summary: Get accounts payable
 *     description: Get accounts payable management data
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *     responses:
 *       200:
 *         description: Accounts payable data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/accounts-payable', authenticate, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    
    const payables = await financeService.getAccountsPayable(branchId as string);
    
    res.json({
      success: true,
      data: payables,
      summary: {
        totalSuppliers: payables.length,
        totalOutstanding: payables.reduce((sum, p) => sum + p.totalOutstanding, 0),
        totalOverdue: payables.reduce((sum, p) => sum + p.overdueAmount, 0),
      },
    });
  } catch (error) {
    logger.error('Error getting accounts payable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get accounts payable data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
/**
 * @swagger
 * /finance/calculate-tax:
 *   post:
 *     summary: Calculate tax
 *     description: Calculate GST, TDS, and statutory tax calculations
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *               taxType:
 *                 type: string
 *                 enum: [GST, TDS, PROFESSIONAL_TAX, CESS]
 *               gstRate:
 *                 type: number
 *               tdsRate:
 *                 type: number
 *               isInterState:
 *                 type: boolean
 *               customerGstNumber:
 *                 type: string
 *               supplierGstNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tax calculation result
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/calculate-tax', 
  authenticate, 
  validate({ body: taxCalculationSchema }),
  async (req: Request, res: Response) => {
    try {
      const taxRequest: TaxCalculationRequest = req.body;
      
      const taxResult = await financeService.calculateTax(taxRequest);
      
      res.json({
        success: true,
        data: taxResult,
      });
    } catch (error) {
      logger.error('Error calculating tax:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate tax',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /finance/profit-loss:
 *   post:
 *     summary: Generate P&L statement
 *     description: Generate branch-wise and consolidated P&L reporting
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, endDate]
 *             properties:
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               includeConsolidated:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: P&L statement generated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/profit-loss',
  authenticate,
  validate({ body: profitLossSchema }),
  async (req: Request, res: Response) => {
    try {
      const plRequest: ProfitLossRequest = req.body;
      
      const plStatement = await financeService.generateProfitLossStatement(plRequest);
      
      res.json({
        success: true,
        data: plStatement,
      });
    } catch (error) {
      logger.error('Error generating P&L statement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate P&L statement',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /finance/cash-flow-forecast:
 *   get:
 *     summary: Get cash flow forecast
 *     description: Generate cash flow forecasting and financial analytics
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: Cash flow forecast data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/cash-flow-forecast', authenticate, async (req: Request, res: Response) => {
  try {
    const { branchId, startDate, endDate } = req.query;
    
    const forecast = await financeService.generateCashFlowForecast(
      branchId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    logger.error('Error generating cash flow forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cash flow forecast',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /finance/manufacturing-cost-analysis:
 *   get:
 *     summary: Get manufacturing cost analysis
 *     description: Manufacturing cost tracking (standard vs actual) with variance analysis
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productionOrderId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by production order
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: Manufacturing cost analysis data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/manufacturing-cost-analysis', authenticate, async (req: Request, res: Response) => {
  try {
    const { productionOrderId, branchId, startDate, endDate } = req.query;
    
    const analysis = await financeService.getManufacturingCostAnalysis(
      productionOrderId as string,
      branchId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json({
      success: true,
      data: analysis,
      summary: {
        totalOrders: analysis.length,
        totalVariance: analysis.reduce((sum, a) => sum + a.variances.totalVariance, 0),
        averageVariancePercentage: analysis.length > 0 
          ? analysis.reduce((sum, a) => sum + a.variancePercentage, 0) / analysis.length 
          : 0,
      },
    });
  } catch (error) {
    logger.error('Error getting manufacturing cost analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get manufacturing cost analysis',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /finance/dashboard:
 *   get:
 *     summary: Get financial dashboard
 *     description: Get financial dashboard and KPI tracking
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: Financial dashboard data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const { branchId, startDate, endDate } = req.query;
    
    const dashboard = await financeService.getFinancialDashboard(
      branchId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    logger.error('Error generating financial dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial dashboard',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
/**
 * @swagger
 * /finance/invoices:
 *   post:
 *     summary: Create invoice
 *     description: Create automated invoice generation
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, referenceType, referenceId, invoiceDate, dueDate, lineItems]
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               referenceType:
 *                 type: string
 *                 enum: [SALES_ORDER, SERVICE_REQUEST]
 *               referenceId:
 *                 type: string
 *                 format: uuid
 *               invoiceDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *               discountAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/invoices',
  authenticate,
  validate({ body: invoiceSchema }),
  async (req: Request, res: Response) => {
    try {
      const invoiceRequest: InvoiceRequest = req.body;
      
      const invoiceId = await financeService.createInvoice(invoiceRequest);
      
      res.status(201).json({
        success: true,
        data: {
          invoiceId,
        },
        message: 'Invoice created successfully',
      });
    } catch (error) {
      logger.error('Error creating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create invoice',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /finance/payments:
 *   post:
 *     summary: Process payment
 *     description: Process payment and reconciliation
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceId, amount, paymentDate, paymentMethod]
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CHEQUE, BANK_TRANSFER, UPI, CARD]
 *               referenceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment processed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/payments',
  authenticate,
  validate({ body: paymentSchema }),
  async (req: Request, res: Response) => {
    try {
      const paymentRequest: PaymentRequest = req.body;
      
      const paymentId = await financeService.processPayment(paymentRequest);
      
      res.status(201).json({
        success: true,
        data: {
          paymentId,
        },
        message: 'Payment processed successfully',
      });
    } catch (error) {
      logger.error('Error processing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /finance/invoices/{id}:
 *   get:
 *     summary: Get invoice details
 *     description: Get detailed invoice information by ID
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/invoices/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: id as string },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            gstNumber: true,
          },
        },
        lineItems: true,
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    logger.error('Error getting invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get invoice',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /finance/invoices:
 *   get:
 *     summary: Get invoices list
 *     description: Get paginated list of invoices with filtering options
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by invoice status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Invoices list retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/invoices', authenticate, async (req: Request, res: Response) => {
  try {
    const { 
      customerId, 
      status, 
      startDate, 
      endDate, 
      branchId,
      page = '1', 
      limit = '10' 
    } = req.query;

    const whereClause: any = {};

    if (customerId) {
      whereClause.customerId = customerId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.invoiceDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (branchId) {
      whereClause.customer = {
        branchId: branchId,
      };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.invoice.count({
        where: whereClause,
      }),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /finance/credit-management:
 *   get:
 *     summary: Get credit management data
 *     description: Get credit management and customer payment tracking information
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: Credit management data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/credit-management', authenticate, async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query;
    
    const creditData = await financeService.getCreditManagement(customerId as string);
    
    res.json({
      success: true,
      data: creditData,
      summary: {
        totalCustomers: creditData.length,
        totalCreditLimit: creditData.reduce((sum, c) => sum + c.creditLimit, 0),
        totalCreditUsed: creditData.reduce((sum, c) => sum + c.creditUsed, 0),
        totalOverdue: creditData.reduce((sum, c) => sum + c.overdueAmount, 0),
        highRiskCustomers: creditData.filter(c => c.riskLevel === 'HIGH').length,
      },
    });
  } catch (error) {
    logger.error('Error getting credit management data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit management data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /finance/bank-reconciliation:
 *   post:
 *     summary: Perform bank reconciliation
 *     description: Perform banking integration for payment reconciliation
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bankAccountId, statementDate, statementBalance, transactions]
 *             properties:
 *               bankAccountId:
 *                 type: string
 *               statementDate:
 *                 type: string
 *                 format: date
 *               statementBalance:
 *                 type: number
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     transactionDate:
 *                       type: string
 *                       format: date
 *                     description:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                       enum: [DEBIT, CREDIT]
 *                     referenceNumber:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bank reconciliation completed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/bank-reconciliation',
  authenticate,
  validate({ body: bankReconciliationSchema }),
  async (req: Request, res: Response) => {
    try {
      const reconciliationResult = await financeService.performBankReconciliation(req.body);
      
      res.json({
        success: true,
        data: reconciliationResult,
      });
    } catch (error) {
      logger.error('Error performing bank reconciliation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bank reconciliation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /finance/collection-analysis:
 *   get:
 *     summary: Get collection analysis
 *     description: Get aging analysis and collection management data
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch ID
 *     responses:
 *       200:
 *         description: Collection analysis data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/collection-analysis', authenticate, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    
    const collectionAnalysis = await financeService.getCollectionAnalysis(branchId as string);
    
    res.json({
      success: true,
      data: collectionAnalysis,
    });
  } catch (error) {
    logger.error('Error getting collection analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get collection analysis',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as financeRoutes };