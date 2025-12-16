// Communication Service - Unified interface for all communication channels
import { PrismaClient } from '@prisma/client';
import { WhatsAppService } from './whatsapp.service';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { logger } from '../utils/logger';

export interface CommunicationRequest {
  leadId?: string;
  customerId?: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PHONE' | 'MEETING';
  channel?: string;
  subject?: string;
  content: string;
  recipient: string;
  metadata?: Record<string, any>;
}

export interface CommunicationResult {
  id: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  externalId?: string;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}

export interface NotificationRequest {
  type: 'ORDER_CONFIRMATION' | 'PRODUCTION_UPDATE' | 'DELIVERY_NOTIFICATION' | 'SERVICE_REMINDER' | 'LEAD_FOLLOWUP' | 'ALERT';
  channels: ('EMAIL' | 'SMS' | 'WHATSAPP')[];
  recipient: {
    name: string;
    email?: string;
    phone?: string;
  };
  data: Record<string, any>;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class CommunicationService {
  private whatsappService: WhatsAppService;
  private emailService: EmailService;
  private smsService: SMSService;

  constructor(private prisma: PrismaClient) {
    this.whatsappService = new WhatsAppService();
    this.emailService = new EmailService();
    this.smsService = new SMSService();
  }

  /**
   * Send communication through specified channel
   * Validates: Requirements 11.4, 20.2 - Multi-channel communication
   */
  async sendCommunication(request: CommunicationRequest): Promise<CommunicationResult> {
    try {
      let externalId: string | null = null;
      let status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' = 'FAILED';
      let errorMessage: string | undefined;

      // Send through appropriate channel
      switch (request.type) {
        case 'EMAIL':
          try {
            const result = await this.emailService.sendEmail({
              to: request.recipient,
              subject: request.subject || 'Notification',
              html: request.content,
            });
            if (result) {
              externalId = result.messageId;
              status = 'SENT';
            }
          } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Email send failed';
          }
          break;

        case 'SMS':
          try {
            const result = await this.smsService.sendSMS({
              to: request.recipient,
              message: request.content,
            });
            if (result) {
              externalId = result.sid;
              status = 'SENT';
            }
          } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'SMS send failed';
          }
          break;

        case 'WHATSAPP':
          try {
            const messageId = await this.whatsappService.sendTextMessage(
              request.recipient,
              request.content
            );
            if (messageId) {
              externalId = messageId;
              status = 'SENT';
            }
          } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'WhatsApp send failed';
          }
          break;

        default:
          errorMessage = `Unsupported communication type: ${request.type}`;
      }

      // Record communication in database
      const communication = await this.prisma.communicationHistory.create({
        data: {
          leadId: request.leadId || null,
          customerId: request.customerId || null,
          type: request.type,
          direction: 'OUTBOUND',
          subject: request.subject || null,
          content: request.content,
          status: status,
          channel: request.channel || null,
          externalId: externalId || null,
          metadata: request.metadata ? JSON.stringify(request.metadata) : null,
          sentAt: new Date(),
          deliveredAt: status === 'DELIVERED' ? new Date() : null,
        },
      });

      logger.info('Communication sent and recorded', {
        communicationId: communication.id,
        type: request.type,
        status: status,
        recipient: request.recipient,
        externalId: externalId,
      });

      return {
        id: communication.id,
        status: status,
        externalId: externalId || undefined,
        sentAt: communication.sentAt,
        deliveredAt: communication.deliveredAt || undefined,
        errorMessage: errorMessage,
      };
    } catch (error) {
      logger.error('Error sending communication:', error);
      throw error;
    }
  }

  /**
   * Send multi-channel notification
   */
  async sendNotification(request: NotificationRequest): Promise<CommunicationResult[]> {
    const results: CommunicationResult[] = [];

    for (const channel of request.channels) {
      try {
        let recipient: string;
        let content: string;
        let subject: string | undefined;

        // Determine recipient and format content based on channel
        switch (channel) {
          case 'EMAIL':
            if (!request.recipient.email) continue;
            recipient = request.recipient.email;
            ({ content, subject } = this.formatEmailContent(request.type, request.data));
            break;

          case 'SMS':
            if (!request.recipient.phone) continue;
            recipient = request.recipient.phone;
            content = this.formatSMSContent(request.type, request.data);
            break;

          case 'WHATSAPP':
            if (!request.recipient.phone) continue;
            recipient = request.recipient.phone;
            content = this.formatWhatsAppContent(request.type, request.data);
            break;

          default:
            continue;
        }

        const result = await this.sendCommunication({
          type: channel,
          recipient: recipient,
          subject: subject,
          content: content,
          leadId: request.data.leadId,
          customerId: request.data.customerId,
          metadata: {
            notificationType: request.type,
            priority: request.priority,
            ...request.data,
          },
        });

        results.push(result);
      } catch (error) {
        logger.error(`Error sending ${channel} notification:`, error);
        // Continue with other channels
      }
    }

    return results;
  }

  /**
   * Send order confirmation across all channels
   */
  async sendOrderConfirmation(
    customerId: string,
    orderNumber: string,
    orderAmount: number,
    deliveryDate: string,
    orderItems: Array<{ description: string; quantity: number; unitPrice: number }>
  ): Promise<CommunicationResult[]> {
    try {
      // Get customer details
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const channels: ('EMAIL' | 'SMS' | 'WHATSAPP')[] = [];
      if (customer.email) channels.push('EMAIL');
      if (customer.phone) channels.push('SMS', 'WHATSAPP');

      return this.sendNotification({
        type: 'ORDER_CONFIRMATION',
        channels: channels,
        recipient: {
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
        },
        data: {
          customerId: customerId,
          orderNumber: orderNumber,
          orderAmount: orderAmount,
          deliveryDate: deliveryDate,
          orderItems: orderItems,
        },
        priority: 'HIGH',
      });
    } catch (error) {
      logger.error('Error sending order confirmation:', error);
      throw error;
    }
  }

  /**
   * Send production update notification
   */
  async sendProductionUpdate(
    customerId: string,
    orderNumber: string,
    stage: string,
    completionPercentage: number
  ): Promise<CommunicationResult[]> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const channels: ('EMAIL' | 'SMS' | 'WHATSAPP')[] = [];
      if (customer.email) channels.push('EMAIL');
      if (customer.phone) channels.push('WHATSAPP'); // Prefer WhatsApp for updates

      return this.sendNotification({
        type: 'PRODUCTION_UPDATE',
        channels: channels,
        recipient: {
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
        },
        data: {
          customerId: customerId,
          orderNumber: orderNumber,
          stage: stage,
          completionPercentage: completionPercentage,
        },
        priority: 'MEDIUM',
      });
    } catch (error) {
      logger.error('Error sending production update:', error);
      throw error;
    }
  }

  /**
   * Send service appointment reminder
   */
  async sendServiceReminder(
    customerId: string,
    serviceNumber: string,
    appointmentDate: string,
    technicianName: string,
    serviceType: string
  ): Promise<CommunicationResult[]> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const channels: ('EMAIL' | 'SMS' | 'WHATSAPP')[] = [];
      if (customer.email) channels.push('EMAIL');
      if (customer.phone) channels.push('SMS', 'WHATSAPP');

      return this.sendNotification({
        type: 'SERVICE_REMINDER',
        channels: channels,
        recipient: {
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
        },
        data: {
          customerId: customerId,
          serviceNumber: serviceNumber,
          appointmentDate: appointmentDate,
          technicianName: technicianName,
          serviceType: serviceType,
        },
        priority: 'HIGH',
      });
    } catch (error) {
      logger.error('Error sending service reminder:', error);
      throw error;
    }
  }

  /**
   * Send lead follow-up communication
   */
  async sendLeadFollowUp(
    leadId: string,
    salesPersonName: string
  ): Promise<CommunicationResult[]> {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      const channels: ('EMAIL' | 'SMS' | 'WHATSAPP')[] = [];
      if (lead.email) channels.push('EMAIL');
      if (lead.phone) channels.push('SMS');

      return this.sendNotification({
        type: 'LEAD_FOLLOWUP',
        channels: channels,
        recipient: {
          name: lead.contactName,
          email: lead.email || undefined,
          phone: lead.phone,
        },
        data: {
          leadId: leadId,
          leadName: lead.contactName,
          salesPersonName: salesPersonName,
        },
        priority: 'MEDIUM',
      });
    } catch (error) {
      logger.error('Error sending lead follow-up:', error);
      throw error;
    }
  }

  /**
   * Get communication history for lead or customer
   */
  async getCommunicationHistory(
    leadId?: string,
    customerId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const whereClause: any = {};
      
      if (leadId) {
        whereClause.leadId = leadId;
      }
      
      if (customerId) {
        whereClause.customerId = customerId;
      }

      const communications = await this.prisma.communicationHistory.findMany({
        where: whereClause,
        orderBy: {
          sentAt: 'desc',
        },
        take: limit,
        include: {
          lead: leadId ? {
            select: {
              leadNumber: true,
              contactName: true,
            },
          } : false,
          customer: customerId ? {
            select: {
              code: true,
              name: true,
            },
          } : false,
        },
      });

      return communications;
    } catch (error) {
      logger.error('Error fetching communication history:', error);
      throw error;
    }
  }

  /**
   * Update communication status (for webhook callbacks)
   */
  async updateCommunicationStatus(
    externalId: string,
    status: 'DELIVERED' | 'READ' | 'FAILED',
    deliveredAt?: Date,
    readAt?: Date,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.prisma.communicationHistory.updateMany({
        where: {
          externalId: externalId,
        },
        data: {
          status: status,
          deliveredAt: deliveredAt || null,
          readAt: readAt || null,
        },
      });

      logger.info('Communication status updated', {
        externalId: externalId,
        status: status,
      });
    } catch (error) {
      logger.error('Error updating communication status:', error);
      throw error;
    }
  }

  /**
   * Format email content based on notification type
   */
  private formatEmailContent(type: string, data: Record<string, any>): { content: string; subject: string } {
    switch (type) {
      case 'ORDER_CONFIRMATION':
        return {
          subject: `Order Confirmation - ${data.orderNumber}`,
          content: `Your order ${data.orderNumber} for ₹${data.orderAmount?.toLocaleString()} has been confirmed. Expected delivery: ${data.deliveryDate}.`,
        };

      case 'PRODUCTION_UPDATE':
        return {
          subject: `Production Update - ${data.orderNumber}`,
          content: `Your order ${data.orderNumber} is now at ${data.stage} stage (${data.completionPercentage}% complete).`,
        };

      case 'SERVICE_REMINDER':
        return {
          subject: `Service Appointment Reminder - ${data.serviceNumber}`,
          content: `Reminder: Service appointment ${data.serviceNumber} scheduled for ${data.appointmentDate} with ${data.technicianName}.`,
        };

      case 'LEAD_FOLLOWUP':
        return {
          subject: 'Thank you for your interest in our steel products',
          content: `Dear ${data.leadName}, thank you for your interest. ${data.salesPersonName} will contact you soon.`,
        };

      default:
        return {
          subject: 'Notification',
          content: 'You have a new notification.',
        };
    }
  }

  /**
   * Format SMS content based on notification type
   */
  private formatSMSContent(type: string, data: Record<string, any>): string {
    switch (type) {
      case 'ORDER_CONFIRMATION':
        return `Order ${data.orderNumber} confirmed for ₹${data.orderAmount?.toLocaleString()}. Delivery: ${data.deliveryDate}. Thank you!`;

      case 'PRODUCTION_UPDATE':
        return `Order ${data.orderNumber} update: ${data.stage} stage (${data.completionPercentage}% complete).`;

      case 'SERVICE_REMINDER':
        return `Service reminder: ${data.serviceNumber} on ${data.appointmentDate} with ${data.technicianName}.`;

      case 'LEAD_FOLLOWUP':
        return `Hi ${data.leadName}, thank you for your interest. ${data.salesPersonName} will contact you soon.`;

      default:
        return 'You have a new notification.';
    }
  }

  /**
   * Format WhatsApp content based on notification type
   */
  private formatWhatsAppContent(type: string, data: Record<string, any>): string {
    switch (type) {
      case 'ORDER_CONFIRMATION':
        return `🎉 Order Confirmed!\n\nOrder #: ${data.orderNumber}\nAmount: ₹${data.orderAmount?.toLocaleString()}\nDelivery: ${data.deliveryDate}\n\nThank you for choosing us!`;

      case 'PRODUCTION_UPDATE':
        return `📋 Production Update\n\nOrder #: ${data.orderNumber}\nStage: ${data.stage}\nProgress: ${data.completionPercentage}%\n\nYour order is progressing well!`;

      case 'SERVICE_REMINDER':
        return `🔧 Service Reminder\n\nService #: ${data.serviceNumber}\nDate: ${data.appointmentDate}\nTechnician: ${data.technicianName}\n\nPlease be available at the scheduled time.`;

      case 'LEAD_FOLLOWUP':
        return `Hi ${data.leadName}! 👋\n\nThank you for your interest in our steel products. ${data.salesPersonName} will contact you within 24 hours.\n\nWe look forward to serving you!`;

      default:
        return 'You have a new notification from Steel ERP.';
    }
  }
}