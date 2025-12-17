// External Integration Routes - API endpoints for external integrations
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExternalIntegrationService } from '../services/externalIntegration.service';
import { CommunicationService } from '../services/communication.service';
import { LeadScoringService } from '../services/leadScoring.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { MetaService } from '../services/meta.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const externalIntegrationService = new ExternalIntegrationService(prisma);
const communicationService = new CommunicationService(prisma);
const leadScoringService = new LeadScoringService(prisma);
const whatsappService = new WhatsAppService();
const metaService = new MetaService();

// Validation schemas
const syncLeadsSchema = z.object({
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).optional(),
  autoScore: z.boolean().optional(),
  autoFollowUp: z.boolean().optional(),
});

const sendNotificationSchema = z.object({
  customerId: z.string().uuid(),
  type: z.enum(['ORDER_CONFIRMATION', 'PRODUCTION_UPDATE', 'DELIVERY_NOTIFICATION', 'SERVICE_REMINDER']),
  data: z.record(z.any()),
});

const communicationSchema = z.object({
  leadId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  type: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PHONE', 'MEETING']),
  recipient: z.string(),
  subject: z.string().optional(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
});

/**
 * @swagger
 * /external-integration/sync/meta:
 *   post:
 *     summary: Sync leads from Meta (Facebook/Instagram)
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               since:
 *                 type: string
 *                 format: date-time
 *               until:
 *                 type: string
 *                 format: date-time
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *               autoScore:
 *                 type: boolean
 *               autoFollowUp:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Meta leads sync completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/sync/meta', 
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const options: any = {};
      if (req.body.since) options.since = new Date(req.body.since);
      if (req.body.until) options.until = new Date(req.body.until);
      if (req.body.limit) options.limit = req.body.limit;
      if (req.body.autoScore !== undefined) options.autoScore = req.body.autoScore;
      if (req.body.autoFollowUp !== undefined) options.autoFollowUp = req.body.autoFollowUp;

      const result = await externalIntegrationService.syncMetaLeads(options);

      return res.json({
        success: true,
        message: 'Meta leads sync completed',
        data: result,
      });
    } catch (error) {
      logger.error('Error in Meta leads sync endpoint:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to sync Meta leads',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/sync/google:
 *   post:
 *     summary: Sync leads from Google Ads
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *               since:
 *                 type: string
 *                 format: date-time
 *               until:
 *                 type: string
 *                 format: date-time
 *               limit:
 *                 type: integer
 *               autoScore:
 *                 type: boolean
 *               autoFollowUp:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Google Ads leads sync completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/sync/google',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { customerId, ...options } = req.body;
      
      const syncOptions: any = {};
      if (options.since) syncOptions.since = new Date(options.since);
      if (options.until) syncOptions.until = new Date(options.until);
      if (options.limit) syncOptions.limit = options.limit;
      if (options.autoScore !== undefined) syncOptions.autoScore = options.autoScore;
      if (options.autoFollowUp !== undefined) syncOptions.autoFollowUp = options.autoFollowUp;

      const result = await externalIntegrationService.syncGoogleLeads(customerId, syncOptions);

      return res.json({
        success: true,
        message: 'Google Ads leads sync completed',
        data: result,
      });
    } catch (error) {
      logger.error('Error in Google Ads leads sync endpoint:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to sync Google Ads leads',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/notifications/send:
 *   post:
 *     summary: Send customer notification
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - type
 *               - data
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [ORDER_CONFIRMATION, PRODUCTION_UPDATE, DELIVERY_NOTIFICATION, SERVICE_REMINDER]
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notifications sent successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/notifications/send',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { customerId, type, data } = req.body;

      await externalIntegrationService.sendCustomerNotifications(customerId, type, data);

      return res.json({
        success: true,
        message: 'Notifications sent successfully',
      });
    } catch (error) {
      logger.error('Error sending customer notifications:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/communications/send:
 *   post:
 *     summary: Send communication
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipient
 *               - content
 *             properties:
 *               leadId:
 *                 type: string
 *                 format: uuid
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [EMAIL, SMS, WHATSAPP, PHONE, MEETING]
 *               recipient:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Communication sent successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/communications/send',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const result = await communicationService.sendCommunication(req.body);

      return res.json({
        success: true,
        message: 'Communication sent successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error sending communication:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send communication',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/communications/history:
 *   get:
 *     summary: Get communication history
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Communication history retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/communications/history',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { leadId, customerId, limit } = req.query;

      const history = await communicationService.getCommunicationHistory(
        leadId as string,
        customerId as string,
        limit ? parseInt(limit as string) : undefined
      );

      return res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Error fetching communication history:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch communication history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/leads/{leadId}/score:
 *   post:
 *     summary: Calculate lead score
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lead score calculated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get lead score
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lead score retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/leads/:leadId/score',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { leadId } = req.params;

      if (!leadId) {
        return res.status(400).json({
          success: false,
          error: 'Lead ID is required',
        });
      }

      const score = await leadScoringService.calculateLeadScore(leadId);

      return res.json({
        success: true,
        message: 'Lead score calculated successfully',
        data: score,
      });
    } catch (error) {
      logger.error('Error calculating lead score:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate lead score',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/leads/{leadId}/score:
 *   get:
 *     summary: Get lead score
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lead score retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leads/:leadId/score',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { leadId } = req.params;

      if (!leadId) {
        return res.status(400).json({
          success: false,
          error: 'Lead ID is required',
        });
      }

      const score = await leadScoringService.getLeadScore(leadId);

      if (!score) {
        return res.status(404).json({
          success: false,
          error: 'Lead score not found',
        });
      }

      return res.json({
        success: true,
        data: score,
      });
    } catch (error) {
      logger.error('Error fetching lead score:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch lead score',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/leads/qualified/{status}:
 *   get:
 *     summary: Get leads by qualification status
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [UNQUALIFIED, QUALIFIED, HOT, COLD]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Qualified leads retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leads/qualified/:status',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const { limit } = req.query;

      if (!status || !['UNQUALIFIED', 'QUALIFIED', 'HOT', 'COLD'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid qualification status',
        });
      }

      const leads = await leadScoringService.getLeadsByQualification(
        status as any,
        limit ? parseInt(limit as string) : undefined
      );

      return res.json({
        success: true,
        data: leads,
      });
    } catch (error) {
      logger.error('Error fetching qualified leads:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch qualified leads',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/stats:
 *   get:
 *     summary: Get integration statistics
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: until
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Integration stats retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { since, until } = req.query;

      const stats = await externalIntegrationService.getIntegrationStats(
        since ? new Date(since as string) : undefined,
        until ? new Date(until as string) : undefined
      );

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching integration stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch integration stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/test-connections:
 *   get:
 *     summary: Test external API connections
 *     tags: [External Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection tests completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/test-connections',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const results = await externalIntegrationService.testConnections();

      return res.json({
        success: true,
        message: 'Connection tests completed',
        data: results,
      });
    } catch (error) {
      logger.error('Error testing connections:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to test connections',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /external-integration/webhooks/whatsapp:
 *   post:
 *     summary: WhatsApp webhook endpoint
 *     tags: [External Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid webhook signature
 *   get:
 *     summary: WhatsApp webhook verification
 *     tags: [External Integration]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verified
 *       403:
 *         description: Invalid verification token
 */
router.post('/webhooks/whatsapp', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!whatsappService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    await externalIntegrationService.processWhatsAppWebhook(req.body);

    return res.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('Error processing WhatsApp webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /external-integration/webhooks/whatsapp:
 *   get:
 *     summary: WhatsApp webhook verification
 *     tags: [External Integration]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verified
 *       403:
 *         description: Invalid verification token
 */
router.get('/webhooks/whatsapp', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).json({
        success: false,
        error: 'Invalid verification token',
      });
    }
  } catch (error) {
    logger.error('Error verifying WhatsApp webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify webhook',
    });
  }
});

/**
 * @swagger
 * /external-integration/webhooks/meta:
 *   post:
 *     summary: Meta webhook endpoint
 *     tags: [External Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid webhook signature
 *   get:
 *     summary: Meta webhook verification
 *     tags: [External Integration]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verified
 *       403:
 *         description: Invalid verification token
 */
router.post('/webhooks/meta', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!metaService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    await externalIntegrationService.processMetaWebhook(req.body);

    return res.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('Error processing Meta webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /external-integration/webhooks/meta:
 *   get:
 *     summary: Meta webhook verification
 *     tags: [External Integration]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verified
 *       403:
 *         description: Invalid verification token
 */
router.get('/webhooks/meta', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).json({
        success: false,
        error: 'Invalid verification token',
      });
    }
  } catch (error) {
    logger.error('Error verifying Meta webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify webhook',
    });
  }
});

export default router;