import { Router, Request, Response } from 'express';
import { CustomerPortalService } from '../services/customerPortal.service';
import { AppError } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /customer-portal/register:
 *   post:
 *     summary: Customer registration
 *     tags: [Customer Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - address
 *               - city
 *               - state
 *               - pincode
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
      gstNumber,
    } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !address || !city || !state || !pincode) {
      throw new AppError(
        'Missing required fields',
        400,
        'MISSING_REQUIRED_FIELDS'
      );
    }

    const customer = await CustomerPortalService.registerCustomer({
      name,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
      gstNumber,
    });

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: customer,
    });
  } catch (error) {
    logger.error('Customer registration failed', { error });
    throw error;
  }
});

/**
 * @swagger
 * /customer-portal/login:
 *   post:
 *     summary: Customer login
 *     tags: [Customer Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      throw new AppError(
        'Password is required',
        400,
        'MISSING_PASSWORD'
      );
    }

    const result = await CustomerPortalService.loginCustomer({
      email,
      phone,
      password,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    logger.error('Customer login failed', { error });
    throw error;
  }
});

/**
 * @swagger
 * /customer-portal/orders:
 *   get:
 *     summary: Get customer orders
 *     tags: [Customer Portal]
 *     parameters:
 *       - in: header
 *         name: x-customer-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const customerId = req.headers['x-customer-id'] as string;

    if (!customerId) {
      throw new AppError(
        'Customer ID is required',
        400,
        'MISSING_CUSTOMER_ID'
      );
    }

    const orders = await CustomerPortalService.getCustomerOrders(customerId);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    logger.error('Failed to get customer orders', { error });
    throw error;
  }
});

/**
 * @swagger
 * /customer-portal/orders/{orderId}:
 *   get:
 *     summary: Get order details
 *     tags: [Customer Portal]
 *     parameters:
 *       - in: header
 *         name: x-customer-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const customerId = req.headers['x-customer-id'] as string;
    const { orderId } = req.params;

    if (!customerId) {
      throw new AppError(
        'Customer ID is required',
        400,
        'MISSING_CUSTOMER_ID'
      );
    }

    const order = await CustomerPortalService.getOrderDetails(customerId, orderId);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Failed to get order details', { error });
    throw error;
  }
});

/**
 * @swagger
 * /customer-portal/service-requests:
 *   post:
 *     summary: Book service request
 *     tags: [Customer Portal]
 *     parameters:
 *       - in: header
 *         name: x-customer-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - description
 *               - preferredDate
 *               - address
 *             properties:
 *               type:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: MEDIUM
 *               description:
 *                 type: string
 *               preferredDate:
 *                 type: string
 *                 format: date-time
 *               address:
 *                 type: string
 *               salesOrderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Service request booked successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *   get:
 *     summary: Get customer service requests
 *     tags: [Customer Portal]
 *     parameters:
 *       - in: header
 *         name: x-customer-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service requests retrieved successfully
 */
router.post('/service-requests', async (req: Request, res: Response) => {
  try {
    const customerId = req.headers['x-customer-id'] as string;
    const {
      type,
      priority,
      description,
      preferredDate,
      address,
      salesOrderId,
    } = req.body;

    if (!customerId) {
      throw new AppError(
        'Customer ID is required',
        400,
        'MISSING_CUSTOMER_ID'
      );
    }

    if (!type || !description || !preferredDate || !address) {
      throw new AppError(
        'Missing required fields',
        400,
        'MISSING_REQUIRED_FIELDS'
      );
    }

    const serviceRequest = await CustomerPortalService.bookServiceRequest({
      customerId,
      type,
      priority: priority || 'MEDIUM',
      description,
      preferredDate: new Date(preferredDate),
      address,
      salesOrderId,
    });

    res.status(201).json({
      success: true,
      message: 'Service request booked successfully',
      data: serviceRequest,
    });
  } catch (error) {
    logger.error('Failed to book service request', { error });
    throw error;
  }
});

/**
 * @swagger
 * /customer-portal/service-requests:
 *   get:
 *     summary: Get customer service requests
 *     tags: [Customer Portal]
 *     parameters:
 *       - in: header
 *         name: x-customer-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service requests retrieved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/service-requests', async (req: Request, res: Response) => {
  try {
    const customerId = req.headers['x-customer-id'] as string;

    if (!customerId) {
      throw new AppError(
        'Customer ID is required',
        400,
        'MISSING_CUSTOMER_ID'
      );
    }

    const serviceRequests = await CustomerPortalService.getCustomerServiceRequests(customerId);

    res.json({
      success: true,
      data: serviceRequests,
    });
  } catch (error) {
    logger.error('Failed to get service requests', { error });
    throw error;
  }
});

/**
 * @swagger
 * /customer-portal/feedback:
 *   post:
 *     summary: Submit customer feedback
 *     tags: [Customer Portal]
 *     parameters:
 *       - in: header
 *         name: x-customer-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - feedback
 *               - category
 *             properties:
 *               serviceRequestId:
 *                 type: string
 *                 format: uuid
 *               salesOrderId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               feedback:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const customerId = req.headers['x-customer-id'] as string;
    const {
      serviceRequestId,
      salesOrderId,
      rating,
      feedback,
      category,
    } = req.body;

    if (!customerId) {
      throw new AppError(
        'Customer ID is required',
        400,
        'MISSING_CUSTOMER_ID'
      );
    }

    if (!rating || !feedback || !category) {
      throw new AppError(
        'Missing required fields',
        400,
        'MISSING_REQUIRED_FIELDS'
      );
    }

    if (rating < 1 || rating > 5) {
      throw new AppError(
        'Rating must be between 1 and 5',
        400,
        'INVALID_RATING'
      );
    }

    const feedbackRecord = await CustomerPortalService.submitFeedback({
      customerId,
      serviceRequestId,
      salesOrderId,
      rating,
      feedback,
      category,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedbackRecord,
    });
  } catch (error) {
    logger.error('Failed to submit feedback', { error });
    throw error;
  }
});

/**
 * @swagger
 * /customer-portal/documents:
 *   get:
 *     summary: Get customer documents
 *     tags: [Customer Portal]
 *     parameters:
 *       - in: header
 *         name: x-customer-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const customerId = req.headers['x-customer-id'] as string;

    if (!customerId) {
      throw new AppError(
        'Customer ID is required',
        400,
        'MISSING_CUSTOMER_ID'
      );
    }

    const documents = await CustomerPortalService.getCustomerDocuments(customerId);

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    logger.error('Failed to get customer documents', { error });
    throw error;
  }
});

/**
 * @swagger
 * /customer-portal/orders/{orderId}/notify:
 *   post:
 *     summary: Send order update notification
 *     tags: [Customer Portal]
 *     parameters:
 *       - in: header
 *         name: x-customer-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order update sent successfully
 */
router.post('/orders/:orderId/notify', async (req: Request, res: Response) => {
  try {
    const customerId = req.headers['x-customer-id'] as string;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!customerId) {
      throw new AppError(
        'Customer ID is required',
        400,
        'MISSING_CUSTOMER_ID'
      );
    }

    if (!status) {
      throw new AppError(
        'Status is required',
        400,
        'MISSING_STATUS'
      );
    }

    await CustomerPortalService.sendOrderUpdate(customerId, orderId, status);

    res.json({
      success: true,
      message: 'Order update sent successfully',
    });
  } catch (error) {
    logger.error('Failed to send order update', { error });
    throw error;
  }
});

export { router as customerPortalRoutes };