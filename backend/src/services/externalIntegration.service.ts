// External Integration Service - Coordinates all external API integrations
import { PrismaClient } from '@prisma/client';
import { MetaService, ProcessedMetaLead } from './meta.service';
import { GoogleService, ProcessedGoogleLead } from './google.service';
import { WhatsAppService } from './whatsapp.service';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { CommunicationService } from './communication.service';
import { LeadScoringService } from './leadScoring.service';
import { SalesService, CreateLeadRequest } from './sales.service';
import { logger } from '../utils/logger';

export interface ExternalLeadImportResult {
  totalProcessed: number;
  successfulImports: number;
  duplicates: number;
  errors: number;
  importedLeads: Array<{
    externalId: string;
    leadId: string;
    leadNumber: string;
    source: string;
  }>;
  errorDetails: Array<{
    externalId: string;
    error: string;
  }>;
}

export interface LeadSyncOptions {
  since?: Date;
  until?: Date;
  limit?: number;
  autoScore?: boolean;
  autoFollowUp?: boolean;
}

export class ExternalIntegrationService {
  private metaService: MetaService;
  private googleService: GoogleService;
  private whatsappService: WhatsAppService;
  private emailService: EmailService;
  private smsService: SMSService;
  private communicationService: CommunicationService;
  private leadScoringService: LeadScoringService;
  private salesService: SalesService;

  constructor(private prisma: PrismaClient) {
    this.metaService = new MetaService();
    this.googleService = new GoogleService();
    this.whatsappService = new WhatsAppService();
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.communicationService = new CommunicationService(prisma);
    this.leadScoringService = new LeadScoringService(prisma);
    this.salesService = new SalesService(prisma);
  }

  /**
   * Sync leads from Meta (Facebook/Instagram)
   * Validates: Requirements 4.1 - External lead source attribution
   */
  async syncMetaLeads(options: LeadSyncOptions = {}): Promise<ExternalLeadImportResult> {
    try {
      logger.info('Starting Meta leads sync', options);

      const metaLeads = await this.metaService.fetchLeads(
        undefined, // formId - can be made configurable
        options.since,
        options.until,
        options.limit || 100
      );

      const result = await this.processExternalLeads(metaLeads, options);

      logger.info('Meta leads sync completed', {
        totalProcessed: result.totalProcessed,
        successfulImports: result.successfulImports,
        duplicates: result.duplicates,
        errors: result.errors,
      });

      return result;
    } catch (error) {
      logger.error('Error syncing Meta leads:', error);
      throw error;
    }
  }

  /**
   * Sync leads from Google Ads
   * Validates: Requirements 4.1 - External lead source attribution
   */
  async syncGoogleLeads(
    customerId: string,
    options: LeadSyncOptions = {}
  ): Promise<ExternalLeadImportResult> {
    try {
      logger.info('Starting Google Ads leads sync', { customerId, ...options });

      const googleLeads = await this.googleService.fetchLeads(
        customerId,
        options.since,
        options.until,
        options.limit || 100
      );

      const result = await this.processExternalLeads(googleLeads, options);

      logger.info('Google Ads leads sync completed', {
        totalProcessed: result.totalProcessed,
        successfulImports: result.successfulImports,
        duplicates: result.duplicates,
        errors: result.errors,
      });

      return result;
    } catch (error) {
      logger.error('Error syncing Google Ads leads:', error);
      throw error;
    }
  }

  /**
   * Process external leads (Meta or Google)
   */
  private async processExternalLeads(
    externalLeads: (ProcessedMetaLead | ProcessedGoogleLead)[],
    options: LeadSyncOptions
  ): Promise<ExternalLeadImportResult> {
    const result: ExternalLeadImportResult = {
      totalProcessed: externalLeads.length,
      successfulImports: 0,
      duplicates: 0,
      errors: 0,
      importedLeads: [],
      errorDetails: [],
    };

    for (const externalLead of externalLeads) {
      try {
        // Check if lead already exists
        const existingSource = await this.prisma.externalLeadSource.findFirst({
          where: {
            platform: externalLead.platform,
            AND: [
              { OR: [
                { campaignId: externalLead.campaignId },
                { adId: externalLead.adId || undefined },
              ]},
              { OR: [
                { lead: { phone: externalLead.phone } },
                { lead: { email: externalLead.email } },
              ]},
            ],
          },
          include: {
            lead: true,
          },
        });

        if (existingSource) {
          result.duplicates++;
          logger.debug('Duplicate lead found', {
            externalId: externalLead.externalId,
            existingLeadId: existingSource.lead.id,
          });
          continue;
        }

        // Create lead request
        const leadRequest: CreateLeadRequest = {
          source: externalLead.source,
          sourceRef: externalLead.campaignId || externalLead.adId || externalLead.externalId,
          contactName: externalLead.contactName || 'Unknown',
          phone: externalLead.phone || '',
          email: externalLead.email,
          address: externalLead.address,
          requirements: externalLead.requirements,
          estimatedValue: externalLead.estimatedValue,
          priority: this.determinePriority(externalLead),
        };

        // Create lead
        const lead = await this.salesService.createLead(leadRequest);

        // Create external lead source record
        await this.prisma.externalLeadSource.create({
          data: {
            leadId: lead.id,
            platform: externalLead.platform,
            campaignId: externalLead.campaignId,
            adSetId: externalLead.adSetId,
            adId: externalLead.adId,
            sourceUrl: externalLead.rawData?.source_url,
            utmSource: externalLead.rawData?.utm_source,
            utmMedium: externalLead.rawData?.utm_medium,
            utmCampaign: externalLead.rawData?.utm_campaign,
            utmContent: externalLead.rawData?.utm_content,
            utmTerm: externalLead.rawData?.utm_term,
            cost: externalLead.rawData?.cost,
            impressions: externalLead.rawData?.impressions,
            clicks: externalLead.rawData?.clicks,
            conversions: externalLead.rawData?.conversions,
            capturedAt: externalLead.capturedAt,
            metadata: JSON.stringify(externalLead.rawData),
          },
        });

        result.successfulImports++;
        result.importedLeads.push({
          externalId: externalLead.externalId,
          leadId: lead.id,
          leadNumber: lead.leadNumber,
          source: externalLead.source,
        });

        // Auto-score lead if enabled
        if (options.autoScore) {
          try {
            await this.leadScoringService.calculateLeadScore(lead.id);
          } catch (error) {
            logger.warn('Error auto-scoring lead:', error);
          }
        }

        // Auto follow-up if enabled
        if (options.autoFollowUp && (externalLead.email || externalLead.phone)) {
          try {
            await this.communicationService.sendLeadFollowUp(
              lead.id,
              'Sales Team' // This could be made configurable
            );
          } catch (error) {
            logger.warn('Error sending auto follow-up:', error);
          }
        }

        logger.debug('External lead imported successfully', {
          externalId: externalLead.externalId,
          leadId: lead.id,
          leadNumber: lead.leadNumber,
        });

      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          externalId: externalLead.externalId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        logger.error('Error processing external lead:', {
          externalId: externalLead.externalId,
          error: error,
        });
      }
    }

    return result;
  }

  /**
   * Determine lead priority based on external lead data
   */
  private determinePriority(lead: ProcessedMetaLead | ProcessedGoogleLead): 'LOW' | 'MEDIUM' | 'HIGH' {
    let score = 0;

    // High estimated value
    if (lead.estimatedValue && lead.estimatedValue > 200000) {
      score += 2;
    } else if (lead.estimatedValue && lead.estimatedValue > 50000) {
      score += 1;
    }

    // Complete contact information
    if (lead.email && lead.phone) {
      score += 1;
    }

    // Detailed requirements
    if (lead.requirements && lead.requirements.length > 50) {
      score += 1;
    }

    // Organic vs paid
    if ('isOrganic' in lead && !lead.isOrganic) {
      score += 1; // Paid leads often have higher intent
    }

    // Recent capture
    const hoursSinceCapture = (new Date().getTime() - lead.capturedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCapture <= 2) {
      score += 1;
    }

    if (score >= 4) return 'HIGH';
    if (score >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Process WhatsApp webhook for incoming messages
   */
  async processWhatsAppWebhook(webhookData: any): Promise<void> {
    try {
      // Process incoming messages
      const messages = this.whatsappService.processIncomingMessage(webhookData);
      
      for (const message of messages) {
        // Find lead or customer by phone number
        const lead = await this.prisma.lead.findFirst({
          where: { phone: message.from },
          orderBy: { createdAt: 'desc' },
        });

        const customer = await this.prisma.customer.findFirst({
          where: { phone: message.from },
        });

        // Record communication
        await this.communicationService.sendCommunication({
          leadId: lead?.id,
          customerId: customer?.id,
          type: 'WHATSAPP',
          recipient: message.from,
          content: message.text?.body || 'Media message received',
          metadata: {
            messageId: message.id,
            messageType: message.type,
            timestamp: message.timestamp,
          },
        });
      }

      // Process status updates
      const statuses = this.whatsappService.processStatusUpdate(webhookData);
      
      for (const status of statuses) {
        await this.communicationService.updateCommunicationStatus(
          status.id,
          status.status.toUpperCase() as any,
          status.status === 'delivered' ? new Date(parseInt(status.timestamp) * 1000) : undefined,
          status.status === 'read' ? new Date(parseInt(status.timestamp) * 1000) : undefined
        );
      }

      logger.info('WhatsApp webhook processed', {
        messagesProcessed: messages.length,
        statusesProcessed: statuses.length,
      });

    } catch (error) {
      logger.error('Error processing WhatsApp webhook:', error);
      throw error;
    }
  }

  /**
   * Process Meta webhook for new leads
   */
  async processMetaWebhook(webhookData: any): Promise<void> {
    try {
      const leads = this.metaService.processWebhookLead(webhookData);
      
      // For each lead notification, fetch the full lead data and process
      for (const leadNotification of leads) {
        // This would typically trigger a background job to fetch and process the lead
        logger.info('Meta lead webhook received', {
          externalId: leadNotification.externalId,
        });
        
        // You could queue this for background processing
        // await this.queueLeadProcessing(leadNotification.externalId, 'META');
      }

    } catch (error) {
      logger.error('Error processing Meta webhook:', error);
      throw error;
    }
  }

  /**
   * Send automated customer notifications
   */
  async sendCustomerNotifications(
    customerId: string,
    notificationType: 'ORDER_CONFIRMATION' | 'PRODUCTION_UPDATE' | 'DELIVERY_NOTIFICATION' | 'SERVICE_REMINDER',
    data: Record<string, any>
  ): Promise<void> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Determine channels based on customer preferences and availability
      const channels: ('EMAIL' | 'SMS' | 'WHATSAPP')[] = [];
      
      if (customer.email) {
        channels.push('EMAIL');
      }
      
      if (customer.phone) {
        // Prefer WhatsApp for rich notifications, SMS as fallback
        channels.push('WHATSAPP');
        if (notificationType === 'SERVICE_REMINDER') {
          channels.push('SMS'); // SMS for important reminders
        }
      }

      await this.communicationService.sendNotification({
        type: notificationType,
        channels: channels,
        recipient: {
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
        },
        data: {
          customerId: customerId,
          ...data,
        },
        priority: notificationType === 'SERVICE_REMINDER' ? 'HIGH' : 'MEDIUM',
      });

      logger.info('Customer notifications sent', {
        customerId: customerId,
        notificationType: notificationType,
        channels: channels,
      });

    } catch (error) {
      logger.error('Error sending customer notifications:', error);
      throw error;
    }
  }

  /**
   * Get external integration statistics
   */
  async getIntegrationStats(since?: Date, until?: Date): Promise<any> {
    try {
      const whereClause: any = {};
      
      if (since && until) {
        whereClause.capturedAt = {
          gte: since,
          lte: until,
        };
      }

      // Lead source statistics
      const leadSources = await this.prisma.externalLeadSource.groupBy({
        by: ['platform'],
        where: whereClause,
        _count: {
          id: true,
        },
        _sum: {
          cost: true,
          conversions: true,
        },
      });

      // Communication statistics
      const communicationStats = await this.prisma.communicationHistory.groupBy({
        by: ['type', 'status'],
        where: since && until ? {
          sentAt: {
            gte: since,
            lte: until,
          },
        } : {},
        _count: {
          id: true,
        },
      });

      // Lead scoring statistics
      const scoringStats = await this.prisma.leadScoring.groupBy({
        by: ['qualificationStatus'],
        _count: {
          id: true,
        },
        _avg: {
          totalScore: true,
        },
      });

      return {
        period: {
          since: since,
          until: until,
        },
        leadSources: leadSources,
        communications: communicationStats,
        leadScoring: scoringStats,
        summary: {
          totalExternalLeads: leadSources.reduce((sum, source) => sum + source._count.id, 0),
          totalCommunications: communicationStats.reduce((sum, stat) => sum + stat._count.id, 0),
          totalCost: leadSources.reduce((sum, source) => sum + (source._sum.cost || 0), 0),
          totalConversions: leadSources.reduce((sum, source) => sum + (source._sum.conversions || 0), 0),
        },
      };

    } catch (error) {
      logger.error('Error getting integration stats:', error);
      throw error;
    }
  }

  /**
   * Test external API connections
   */
  async testConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Test WhatsApp
    try {
      // Simple test - this would need to be implemented in WhatsAppService
      results.whatsapp = true; // Placeholder
    } catch (error) {
      results.whatsapp = false;
    }

    // Test Email
    try {
      // Simple test - this would need to be implemented in EmailService
      results.email = true; // Placeholder
    } catch (error) {
      results.email = false;
    }

    // Test SMS
    try {
      // Simple test - this would need to be implemented in SMSService
      results.sms = true; // Placeholder
    } catch (error) {
      results.sms = false;
    }

    // Test Meta
    try {
      // Simple test - this would need to be implemented in MetaService
      results.meta = true; // Placeholder
    } catch (error) {
      results.meta = false;
    }

    // Test Google
    try {
      // Simple test - this would need to be implemented in GoogleService
      results.google = true; // Placeholder
    } catch (error) {
      results.google = false;
    }

    return results;
  }
}