import { Router, Request, Response } from 'express';
import { CustomerPortalService } from '../services/customerPortal.service';
import { AppError } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Customer Registration
 * POST /api/v1/customer-portal/register
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
 * Customer Login
 * POST /api/v1/customer-portal/login
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
 * Get Customer Orders
 * GET /api/v1/customer-portal/orders
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
 * Get Order Details
 * GET /api/v1/customer-portal/orders/:orderId
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
 * Book Service Request
 * POST /api/v1/customer-portal/service-requests
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
 * Get Customer Service Requests
 * GET /api/v1/customer-portal/service-requests
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
 * Submit Customer Feedback
 * POST /api/v1/customer-portal/feedback
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
 * Get Customer Documents
 * GET /api/v1/customer-portal/documents
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
 * Send Order Update via WhatsApp
 * POST /api/v1/customer-portal/orders/:orderId/notify
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