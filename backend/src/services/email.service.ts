// Email Service - SMTP integration for notifications
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  variables: string[];
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor() {
    this.fromAddress = process.env.SMTP_USER || 'noreply@steelerp.com';
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  /**
   * Send email message
   * Validates: Requirements 11.4, 20.2 - Email integration for notifications
   */
  async sendEmail(message: EmailMessage): Promise<EmailResult | null> {
    try {
      const mailOptions = {
        from: this.fromAddress,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : undefined,
        bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : undefined,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: message.to,
        subject: message.subject,
        accepted: info.accepted,
        rejected: info.rejected,
      });

      return {
        messageId: info.messageId,
        accepted: info.accepted || [],
        rejected: info.rejected || [],
        pending: info.pending || [],
        response: info.response,
      };
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    customerEmail: string,
    customerName: string,
    orderNumber: string,
    orderAmount: number,
    deliveryDate: string,
    orderItems: Array<{ description: string; quantity: number; unitPrice: number }>
  ): Promise<EmailResult | null> {
    const itemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.quantity * item.unitPrice).toLocaleString()}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5aa0;">Order Confirmation</h1>
          </div>
          
          <p>Dear ${customerName},</p>
          
          <p>Thank you for your order! We're excited to confirm that we've received your order and it's being processed.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Order Amount:</strong> ₹${orderAmount.toLocaleString()}</p>
            <p><strong>Expected Delivery:</strong> ${deliveryDate}</p>
          </div>
          
          <h3>Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #2c5aa0; color: white;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Unit Price</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="text-align: right; margin: 20px 0;">
            <h3>Total Amount: ₹${orderAmount.toLocaleString()}</h3>
          </div>
          
          <p>We'll keep you updated on your order progress. You can also track your order status through our customer portal.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>Steel Manufacturing Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${orderNumber}`,
      html: html,
    });
  }

  /**
   * Send production update email
   */
  async sendProductionUpdate(
    customerEmail: string,
    customerName: string,
    orderNumber: string,
    stage: string,
    completionPercentage: number
  ): Promise<EmailResult | null> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Production Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5aa0;">Production Update</h1>
          </div>
          
          <p>Dear ${customerName},</p>
          
          <p>We wanted to update you on the progress of your order.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Progress</h3>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Current Stage:</strong> ${stage}</p>
            <p><strong>Completion:</strong> ${completionPercentage}%</p>
            
            <div style="background-color: #e9ecef; border-radius: 10px; height: 20px; margin: 10px 0;">
              <div style="background-color: #28a745; height: 20px; border-radius: 10px; width: ${completionPercentage}%;"></div>
            </div>
          </div>
          
          <p>Your order is progressing well and we're committed to delivering it on time. We'll continue to keep you updated as it moves through each stage of production.</p>
          
          <p>Thank you for your patience and trust in our services.</p>
          
          <p>Best regards,<br>Steel Manufacturing Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Production Update - ${orderNumber}`,
      html: html,
    });
  }

  /**
   * Send service appointment reminder
   */
  async sendServiceReminder(
    customerEmail: string,
    customerName: string,
    serviceNumber: string,
    appointmentDate: string,
    technicianName: string,
    serviceType: string
  ): Promise<EmailResult | null> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Service Appointment Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5aa0;">Service Appointment Reminder</h1>
          </div>
          
          <p>Dear ${customerName},</p>
          
          <p>This is a reminder about your upcoming service appointment.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Appointment Details</h3>
            <p><strong>Service Number:</strong> ${serviceNumber}</p>
            <p><strong>Service Type:</strong> ${serviceType}</p>
            <p><strong>Date & Time:</strong> ${appointmentDate}</p>
            <p><strong>Technician:</strong> ${technicianName}</p>
          </div>
          
          <p>Please ensure that someone is available at the service location during the scheduled time. Our technician will contact you before arrival.</p>
          
          <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
          
          <p>Best regards,<br>Steel Manufacturing Service Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Service Appointment Reminder - ${serviceNumber}`,
      html: html,
    });
  }

  /**
   * Send lead follow-up email
   */
  async sendLeadFollowUp(
    leadEmail: string,
    leadName: string,
    salesPersonName: string,
    companyName: string = 'Steel Manufacturing Company'
  ): Promise<EmailResult | null> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thank you for your interest</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5aa0;">Thank You for Your Interest</h1>
          </div>
          
          <p>Dear ${leadName},</p>
          
          <p>Thank you for your interest in our premium steel doors, windows, and frames. We're excited to help you with your project!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">What's Next?</h3>
            <ul>
              <li>Our sales representative ${salesPersonName} will contact you within 24 hours</li>
              <li>We'll schedule a site visit for accurate measurements</li>
              <li>You'll receive a detailed quotation within 2-3 business days</li>
              <li>Our team will guide you through the entire process</li>
            </ul>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Why Choose Us?</h3>
            <ul>
              <li>Premium quality steel products</li>
              <li>Custom manufacturing to your specifications</li>
              <li>Professional installation services</li>
              <li>Comprehensive warranty and after-sales support</li>
              <li>Competitive pricing with transparent quotations</li>
            </ul>
          </div>
          
          <p>If you have any immediate questions or would like to speak with someone right away, please don't hesitate to call us.</p>
          
          <p>We look forward to working with you!</p>
          
          <p>Best regards,<br>${salesPersonName}<br>${companyName}</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: leadEmail,
      subject: 'Thank you for your interest in our steel products',
      html: html,
    });
  }

  /**
   * Send alert notification email
   */
  async sendAlertNotificationEmail(
    recipientEmail: string,
    alertType: string,
    message: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    dueDate?: Date
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.sendAlertNotification(recipientEmail, alertType, message, priority, dueDate);
      return {
        success: true,
        messageId: result?.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send alert notification email (internal method)
   */
  async sendAlertNotification(
    recipientEmail: string,
    alertType: string,
    message: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    dueDate?: Date
  ): Promise<EmailResult | null> {
    const priorityColors = {
      LOW: '#28a745',
      MEDIUM: '#ffc107',
      HIGH: '#fd7e14',
      CRITICAL: '#dc3545',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>System Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${priorityColors[priority]};">System Alert - ${priority} Priority</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${priorityColors[priority]};">
            <h3 style="margin-top: 0; color: ${priorityColors[priority]};">${alertType}</h3>
            <p>${message}</p>
            ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate.toLocaleString()}</p>` : ''}
          </div>
          
          <p>Please take appropriate action to resolve this alert. Log in to the system for more details.</p>
          
          <p>Best regards,<br>Steel ERP System</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated system alert. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `[${priority}] System Alert: ${alertType}`,
      html: html,
    });
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
    } catch (error) {
      logger.warn('SMTP connection verification failed:', error);
    }
  }

  /**
   * Send template-based email
   */
  async sendTemplateEmail(
    to: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<EmailResult | null> {
    try {
      // This would typically load templates from database or file system
      // For now, we'll use a simple template system
      const templates: Record<string, EmailTemplate> = {
        'welcome': {
          name: 'welcome',
          subject: 'Welcome to {{companyName}}',
          html: '<h1>Welcome {{customerName}}!</h1><p>Thank you for choosing {{companyName}}.</p>',
          variables: ['customerName', 'companyName'],
        },
        'order_update': {
          name: 'order_update',
          subject: 'Order Update - {{orderNumber}}',
          html: '<h1>Order Update</h1><p>Your order {{orderNumber}} status: {{status}}</p>',
          variables: ['orderNumber', 'status'],
        },
      };

      const template = templates[templateName];
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      let subject = template.subject;
      let html = template.html;

      // Replace variables in template
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        html = html.replace(new RegExp(placeholder, 'g'), value);
      }

      return this.sendEmail({
        to,
        subject,
        html,
      });
    } catch (error) {
      logger.error('Error sending template email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();