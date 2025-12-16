import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { FinanceService } from '../src/services/finance.service';
import app from '../src/index';

const prisma = new PrismaClient();
const financeService = new FinanceService(prisma);

// Test data
const testBranchId = 'test-branch-id';
const testCustomerId = 'test-customer-id';
const testSupplierId = 'test-supplier-id';

describe('Finance Service', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test data and get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Accounts Receivable Management', () => {
    test('should get accounts receivable data', async () => {
      const receivables = await financeService.getAccountsReceivable();
      
      expect(Array.isArray(receivables)).toBe(true);
      
      if (receivables.length > 0) {
        const receivable = receivables[0]!;
        expect(receivable).toHaveProperty('customerId');
        expect(receivable).toHaveProperty('customerName');
        expect(receivable).toHaveProperty('totalOutstanding');
        expect(receivable).toHaveProperty('overdueAmount');
        expect(receivable).toHaveProperty('currentAmount');
        expect(receivable).toHaveProperty('invoices');
        expect(Array.isArray(receivable.invoices)).toBe(true);
      }
    });

    test('should get accounts receivable via API', async () => {
      const response = await request(app)
        .get('/api/v1/finance/accounts-receivable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary).toHaveProperty('totalCustomers');
      expect(response.body.summary).toHaveProperty('totalOutstanding');
      expect(response.body.summary).toHaveProperty('totalOverdue');
    });
  });

  describe('Accounts Payable Management', () => {
    test('should get accounts payable data', async () => {
      const payables = await financeService.getAccountsPayable();
      
      expect(Array.isArray(payables)).toBe(true);
      
      if (payables.length > 0) {
        const payable = payables[0]!;
        expect(payable).toHaveProperty('supplierId');
        expect(payable).toHaveProperty('supplierName');
        expect(payable).toHaveProperty('totalOutstanding');
        expect(payable).toHaveProperty('overdueAmount');
        expect(payable).toHaveProperty('currentAmount');
        expect(payable).toHaveProperty('purchaseOrders');
        expect(Array.isArray(payable.purchaseOrders)).toBe(true);
      }
    });

    test('should get accounts payable via API', async () => {
      const response = await request(app)
        .get('/api/v1/finance/accounts-payable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.summary).toBeDefined();
    });
  });

  describe('Tax Calculations', () => {
    test('should calculate GST for intra-state transaction', async () => {
      const taxRequest = {
        amount: 10000,
        taxType: 'GST' as const,
        gstRate: 18,
        isInterState: false,
      };

      const result = await financeService.calculateTax(taxRequest);

      expect(result.baseAmount).toBe(10000);
      expect(result.cgst).toBe(900); // 9% CGST
      expect(result.sgst).toBe(900); // 9% SGST
      expect(result.totalTax).toBe(1800);
      expect(result.netAmount).toBe(11800);
      expect(result.taxBreakdown).toHaveLength(2);
    });

    test('should calculate GST for inter-state transaction', async () => {
      const taxRequest = {
        amount: 10000,
        taxType: 'GST' as const,
        gstRate: 18,
        isInterState: true,
      };

      const result = await financeService.calculateTax(taxRequest);

      expect(result.baseAmount).toBe(10000);
      expect(result.igst).toBe(1800); // 18% IGST
      expect(result.totalTax).toBe(1800);
      expect(result.netAmount).toBe(11800);
      expect(result.taxBreakdown).toHaveLength(1);
    });

    test('should calculate TDS', async () => {
      const taxRequest = {
        amount: 10000,
        taxType: 'TDS' as const,
        tdsRate: 2,
      };

      const result = await financeService.calculateTax(taxRequest);

      expect(result.baseAmount).toBe(10000);
      expect(result.tds).toBe(200); // 2% TDS
      expect(result.totalTax).toBe(200);
      expect(result.netAmount).toBe(9800); // Amount after TDS deduction
    });

    test('should calculate tax via API', async () => {
      const response = await request(app)
        .post('/api/v1/finance/calculate-tax')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10000,
          taxType: 'GST',
          gstRate: 18,
          isInterState: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalTax).toBe(1800);
    });
  });
  describe('Profit & Loss Statement', () => {
    test('should generate P&L statement', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const plRequest = {
        startDate,
        endDate,
      };

      const result = await financeService.generateProfitLossStatement(plRequest);

      expect(result).toHaveProperty('period');
      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('costOfGoodsSold');
      expect(result).toHaveProperty('grossProfit');
      expect(result).toHaveProperty('operatingExpenses');
      expect(result).toHaveProperty('operatingProfit');
      expect(result).toHaveProperty('netProfit');
      expect(result).toHaveProperty('profitMargin');

      expect(typeof result.revenue.totalRevenue).toBe('number');
      expect(typeof result.costOfGoodsSold.totalCOGS).toBe('number');
      expect(typeof result.grossProfit).toBe('number');
      expect(typeof result.netProfit).toBe('number');
    });

    test('should generate P&L statement via API', async () => {
      const response = await request(app)
        .post('/api/v1/finance/profit-loss')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('revenue');
      expect(response.body.data).toHaveProperty('netProfit');
    });
  });

  describe('Cash Flow Forecast', () => {
    test('should generate cash flow forecast', async () => {
      const result = await financeService.generateCashFlowForecast();

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('openingBalance');
      expect(result).toHaveProperty('cashInflows');
      expect(result).toHaveProperty('cashOutflows');
      expect(result).toHaveProperty('netCashFlow');
      expect(result).toHaveProperty('closingBalance');
      expect(result).toHaveProperty('forecastAccuracy');

      expect(typeof result.openingBalance).toBe('number');
      expect(typeof result.netCashFlow).toBe('number');
      expect(typeof result.closingBalance).toBe('number');
      expect(result.forecastAccuracy).toBeGreaterThan(0);
      expect(result.forecastAccuracy).toBeLessThanOrEqual(100);
    });

    test('should generate cash flow forecast via API', async () => {
      const response = await request(app)
        .get('/api/v1/finance/cash-flow-forecast')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('cashInflows');
      expect(response.body.data).toHaveProperty('cashOutflows');
    });
  });

  describe('Manufacturing Cost Analysis', () => {
    test('should get manufacturing cost analysis', async () => {
      const result = await financeService.getManufacturingCostAnalysis();

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const analysis = result[0]!;
        expect(analysis).toHaveProperty('productionOrderId');
        expect(analysis).toHaveProperty('orderNumber');
        expect(analysis).toHaveProperty('standardCosts');
        expect(analysis).toHaveProperty('actualCosts');
        expect(analysis).toHaveProperty('variances');
        expect(analysis).toHaveProperty('variancePercentage');

        expect(typeof analysis.standardCosts.totalStandardCost).toBe('number');
        expect(typeof analysis.actualCosts.totalActualCost).toBe('number');
        expect(typeof analysis.variances.totalVariance).toBe('number');
        expect(typeof analysis.variancePercentage).toBe('number');
      }
    });

    test('should get manufacturing cost analysis via API', async () => {
      const response = await request(app)
        .get('/api/v1/finance/manufacturing-cost-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.summary).toBeDefined();
    });
  });

  describe('Financial Dashboard', () => {
    test('should generate financial dashboard', async () => {
      const result = await financeService.getFinancialDashboard();

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('quickRatios');
      expect(result).toHaveProperty('cashPosition');
      expect(result).toHaveProperty('agingSummary');

      expect(Array.isArray(result.kpis)).toBe(true);
      expect(result.quickRatios).toHaveProperty('currentRatio');
      expect(result.quickRatios).toHaveProperty('grossProfitMargin');
      expect(result.quickRatios).toHaveProperty('netProfitMargin');
      expect(result.cashPosition).toHaveProperty('cashOnHand');
      expect(result.agingSummary).toHaveProperty('receivables');
      expect(result.agingSummary).toHaveProperty('payables');
    });

    test('should generate financial dashboard via API', async () => {
      const response = await request(app)
        .get('/api/v1/finance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('kpis');
      expect(response.body.data).toHaveProperty('quickRatios');
    });
  });

  describe('Invoice Management', () => {
    test('should create invoice', async () => {
      // First create a customer for testing
      const customer = await prisma.customer.create({
        data: {
          code: 'TEST-CUST-001',
          name: 'Test Customer',
          phone: '9876543210',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          branchId: testBranchId,
        },
      });

      const invoiceRequest = {
        customerId: customer.id,
        referenceType: 'SALES_ORDER' as const,
        referenceId: 'test-sales-order-id',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: [
          {
            description: 'Test Product',
            quantity: 2,
            unitPrice: 1000,
            itemType: 'PRODUCT' as const,
          },
        ],
      };

      const invoiceId = await financeService.createInvoice(invoiceRequest);

      expect(typeof invoiceId).toBe('string');
      expect(invoiceId.length).toBeGreaterThan(0);

      // Verify invoice was created
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { lineItems: true },
      });

      expect(invoice).toBeDefined();
      expect(invoice?.customerId).toBe(customer.id);
      expect(invoice?.totalAmount).toBe(2360); // 2000 + 18% GST
      expect(invoice?.lineItems).toHaveLength(1);

      // Cleanup
      await prisma.invoice.delete({ where: { id: invoiceId } });
      await prisma.customer.delete({ where: { id: customer.id } });
    });

    test('should create invoice via API', async () => {
      // Create test customer first
      const customer = await prisma.customer.create({
        data: {
          code: 'TEST-CUST-002',
          name: 'Test Customer 2',
          phone: '9876543211',
          address: 'Test Address 2',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          branchId: testBranchId,
        },
      });

      const response = await request(app)
        .post('/api/v1/finance/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: customer.id,
          referenceType: 'SALES_ORDER',
          referenceId: 'test-sales-order-id-2',
          invoiceDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lineItems: [
            {
              description: 'Test Product API',
              quantity: 1,
              unitPrice: 5000,
              itemType: 'PRODUCT',
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invoiceId).toBeDefined();

      // Cleanup
      await prisma.invoice.delete({ where: { id: response.body.data.invoiceId } });
      await prisma.customer.delete({ where: { id: customer.id } });
    });
  });
  describe('Payment Processing', () => {
    test('should process payment', async () => {
      // Create test customer and invoice first
      const customer = await prisma.customer.create({
        data: {
          code: 'TEST-CUST-PAY',
          name: 'Test Customer Payment',
          phone: '9876543212',
          address: 'Test Address Payment',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          branchId: testBranchId,
        },
      });

      const invoiceId = await financeService.createInvoice({
        customerId: customer.id,
        referenceType: 'SALES_ORDER',
        referenceId: 'test-sales-order-payment',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: [
          {
            description: 'Test Product Payment',
            quantity: 1,
            unitPrice: 1000,
            itemType: 'PRODUCT',
          },
        ],
      });

      const paymentRequest = {
        invoiceId,
        amount: 500,
        paymentDate: new Date(),
        paymentMethod: 'BANK_TRANSFER' as const,
        referenceNumber: 'TXN123456',
      };

      const paymentId = await financeService.processPayment(paymentRequest);

      expect(typeof paymentId).toBe('string');
      expect(paymentId.length).toBeGreaterThan(0);

      // Verify payment was processed
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      expect(payment).toBeDefined();
      expect(payment?.invoiceId).toBe(invoiceId);
      expect(payment?.amount).toBe(500);
      expect(payment?.status).toBe('COMPLETED');

      // Verify invoice balance was updated
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      expect(updatedInvoice?.paidAmount).toBe(500);
      expect(updatedInvoice?.balanceAmount).toBe(updatedInvoice!.totalAmount - 500);

      // Cleanup
      await prisma.payment.delete({ where: { id: paymentId } });
      await prisma.invoice.delete({ where: { id: invoiceId } });
      await prisma.customer.delete({ where: { id: customer.id } });
    });

    test('should process payment via API', async () => {
      // Create test customer and invoice first
      const customer = await prisma.customer.create({
        data: {
          code: 'TEST-CUST-PAY-API',
          name: 'Test Customer Payment API',
          phone: '9876543213',
          address: 'Test Address Payment API',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          branchId: testBranchId,
        },
      });

      const invoiceId = await financeService.createInvoice({
        customerId: customer.id,
        referenceType: 'SALES_ORDER',
        referenceId: 'test-sales-order-payment-api',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: [
          {
            description: 'Test Product Payment API',
            quantity: 1,
            unitPrice: 2000,
            itemType: 'PRODUCT',
          },
        ],
      });

      const response = await request(app)
        .post('/api/v1/finance/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceId,
          amount: 1000,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'UPI',
          referenceNumber: 'UPI123456',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentId).toBeDefined();

      // Cleanup
      await prisma.payment.delete({ where: { id: response.body.data.paymentId } });
      await prisma.invoice.delete({ where: { id: invoiceId } });
      await prisma.customer.delete({ where: { id: customer.id } });
    });

    test('should reject payment exceeding invoice balance', async () => {
      // Create test customer and invoice first
      const customer = await prisma.customer.create({
        data: {
          code: 'TEST-CUST-EXCEED',
          name: 'Test Customer Exceed',
          phone: '9876543214',
          address: 'Test Address Exceed',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          branchId: testBranchId,
        },
      });

      const invoiceId = await financeService.createInvoice({
        customerId: customer.id,
        referenceType: 'SALES_ORDER',
        referenceId: 'test-sales-order-exceed',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: [
          {
            description: 'Test Product Exceed',
            quantity: 1,
            unitPrice: 1000,
            itemType: 'PRODUCT',
          },
        ],
      });

      const paymentRequest = {
        invoiceId,
        amount: 10000, // Exceeds invoice total
        paymentDate: new Date(),
        paymentMethod: 'CASH' as const,
      };

      await expect(financeService.processPayment(paymentRequest))
        .rejects
        .toThrow('Payment amount exceeds invoice balance');

      // Cleanup
      await prisma.invoice.delete({ where: { id: invoiceId } });
      await prisma.customer.delete({ where: { id: customer.id } });
    });
  });

  describe('Invoice Retrieval', () => {
    test('should get invoice details via API', async () => {
      // Create test customer and invoice first
      const customer = await prisma.customer.create({
        data: {
          code: 'TEST-CUST-GET',
          name: 'Test Customer Get',
          phone: '9876543215',
          address: 'Test Address Get',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          branchId: testBranchId,
        },
      });

      const invoiceId = await financeService.createInvoice({
        customerId: customer.id,
        referenceType: 'SALES_ORDER',
        referenceId: 'test-sales-order-get',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: [
          {
            description: 'Test Product Get',
            quantity: 1,
            unitPrice: 1500,
            itemType: 'PRODUCT',
          },
        ],
      });

      const response = await request(app)
        .get(`/api/v1/finance/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(invoiceId);
      expect(response.body.data.customer).toBeDefined();
      expect(response.body.data.lineItems).toBeDefined();
      expect(response.body.data.payments).toBeDefined();

      // Cleanup
      await prisma.invoice.delete({ where: { id: invoiceId } });
      await prisma.customer.delete({ where: { id: customer.id } });
    });

    test('should get invoices list via API', async () => {
      const response = await request(app)
        .get('/api/v1/finance/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });
  });

  describe('Credit Management', () => {
    test('should get credit management data', async () => {
      const creditData = await financeService.getCreditManagement();
      
      expect(Array.isArray(creditData)).toBe(true);
      
      if (creditData.length > 0) {
        const credit = creditData[0]!;
        expect(credit).toHaveProperty('customerId');
        expect(credit).toHaveProperty('customerName');
        expect(credit).toHaveProperty('creditLimit');
        expect(credit).toHaveProperty('creditUsed');
        expect(credit).toHaveProperty('availableCredit');
        expect(credit).toHaveProperty('overdueAmount');
        expect(credit).toHaveProperty('creditScore');
        expect(credit).toHaveProperty('paymentHistory');
        expect(credit).toHaveProperty('riskLevel');
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(credit.riskLevel);
        expect(Array.isArray(credit.paymentHistory)).toBe(true);
      }
    });

    test('should get credit management data via API', async () => {
      const response = await request(app)
        .get('/api/v1/finance/credit-management')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary).toHaveProperty('totalCustomers');
      expect(response.body.summary).toHaveProperty('totalCreditLimit');
      expect(response.body.summary).toHaveProperty('totalCreditUsed');
      expect(response.body.summary).toHaveProperty('totalOverdue');
      expect(response.body.summary).toHaveProperty('highRiskCustomers');
    });
  });

  describe('Bank Reconciliation', () => {
    test('should perform bank reconciliation', async () => {
      const reconciliationRequest = {
        bankAccountId: 'test-bank-account',
        statementDate: new Date(),
        statementBalance: 50000,
        transactions: [
          {
            transactionDate: new Date(),
            description: 'Customer Payment',
            amount: 1000,
            type: 'CREDIT' as const,
            referenceNumber: 'TXN123',
          },
          {
            transactionDate: new Date(),
            description: 'Supplier Payment',
            amount: 500,
            type: 'DEBIT' as const,
            referenceNumber: 'TXN124',
          },
        ],
      };

      const result = await financeService.performBankReconciliation(reconciliationRequest);

      expect(result).toHaveProperty('reconciledBalance');
      expect(result).toHaveProperty('unReconciledItems');
      expect(result).toHaveProperty('reconciliationStatus');
      expect(result).toHaveProperty('variance');
      expect(['MATCHED', 'UNMATCHED', 'PARTIAL']).toContain(result.reconciliationStatus);
      expect(Array.isArray(result.unReconciledItems)).toBe(true);
      expect(typeof result.reconciledBalance).toBe('number');
      expect(typeof result.variance).toBe('number');
    });

    test('should perform bank reconciliation via API', async () => {
      const response = await request(app)
        .post('/api/v1/finance/bank-reconciliation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bankAccountId: 'test-bank-account-api',
          statementDate: new Date().toISOString(),
          statementBalance: 75000,
          transactions: [
            {
              transactionDate: new Date().toISOString(),
              description: 'API Test Payment',
              amount: 2000,
              type: 'CREDIT',
              referenceNumber: 'API123',
            },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('reconciliationStatus');
      expect(response.body.data).toHaveProperty('unReconciledItems');
    });
  });

  describe('Collection Analysis', () => {
    test('should get collection analysis', async () => {
      const analysis = await financeService.getCollectionAnalysis();

      expect(analysis).toHaveProperty('totalOutstanding');
      expect(analysis).toHaveProperty('currentDue');
      expect(analysis).toHaveProperty('overdue30');
      expect(analysis).toHaveProperty('overdue60');
      expect(analysis).toHaveProperty('overdue90');
      expect(analysis).toHaveProperty('overdue90Plus');
      expect(analysis).toHaveProperty('collectionEfficiency');
      expect(analysis).toHaveProperty('averageCollectionDays');
      expect(analysis).toHaveProperty('badDebtProvision');
      expect(analysis).toHaveProperty('recommendedActions');

      expect(typeof analysis.totalOutstanding).toBe('number');
      expect(typeof analysis.collectionEfficiency).toBe('number');
      expect(typeof analysis.averageCollectionDays).toBe('number');
      expect(typeof analysis.badDebtProvision).toBe('number');
      expect(Array.isArray(analysis.recommendedActions)).toBe(true);

      if (analysis.recommendedActions.length > 0) {
        const action = analysis.recommendedActions[0]!;
        expect(action).toHaveProperty('customerId');
        expect(action).toHaveProperty('customerName');
        expect(action).toHaveProperty('action');
        expect(action).toHaveProperty('priority');
        expect(action).toHaveProperty('overdueAmount');
        expect(action).toHaveProperty('daysOverdue');
        expect(action).toHaveProperty('reason');
        expect(['REMINDER', 'FOLLOW_UP', 'LEGAL_NOTICE', 'CREDIT_HOLD']).toContain(action.action);
        expect(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).toContain(action.priority);
      }
    });

    test('should get collection analysis via API', async () => {
      const response = await request(app)
        .get('/api/v1/finance/collection-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('totalOutstanding');
      expect(response.body.data).toHaveProperty('collectionEfficiency');
      expect(response.body.data).toHaveProperty('recommendedActions');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid tax calculation request', async () => {
      await expect(financeService.calculateTax({
        amount: -1000, // Invalid negative amount
        taxType: 'GST',
      })).rejects.toThrow();
    });

    test('should handle payment for non-existent invoice', async () => {
      const paymentRequest = {
        invoiceId: 'non-existent-invoice-id',
        amount: 1000,
        paymentDate: new Date(),
        paymentMethod: 'CASH' as const,
      };

      await expect(financeService.processPayment(paymentRequest))
        .rejects
        .toThrow('Invoice not found');
    });

    test('should return 404 for non-existent invoice via API', async () => {
      const response = await request(app)
        .get('/api/v1/finance/invoices/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invoice not found');
    });

    test('should handle invalid bank reconciliation request', async () => {
      const invalidRequest = {
        bankAccountId: '',
        statementDate: new Date(),
        statementBalance: -1000, // Invalid negative balance
        transactions: [],
      };

      await expect(financeService.performBankReconciliation(invalidRequest))
        .rejects
        .toThrow();
    });
  });
});