// Google Ads API Service - Lead capture and attribution
import axios from 'axios';
import { logger } from '../utils/logger';

export interface GoogleAdsLead {
  resourceName: string;
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  campaignId?: string;
  campaignName?: string;
  adGroupId?: string;
  adGroupName?: string;
  keywordText?: string;
  gclid?: string;
  conversionDateTime: string;
  conversionValue?: number;
  currencyCode?: string;
  clickId?: string;
}

export interface GoogleAdsCampaign {
  resourceName: string;
  id: string;
  name: string;
  status: string;
  advertisingChannelType: string;
  startDate?: string;
  endDate?: string;
  biddingStrategy?: string;
  budget?: {
    amountMicros: number;
    deliveryMethod: string;
  };
  metrics?: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
    averageCpc: number;
  };
}

export interface GoogleAdsKeyword {
  resourceName: string;
  id: string;
  text: string;
  matchType: string;
  status: string;
  adGroupId: string;
  campaignId: string;
  metrics?: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
    averageCpc: number;
  };
}

export interface ProcessedGoogleLead {
  externalId: string;
  source: 'GOOGLE';
  platform: 'GOOGLE_ADS';
  campaignId?: string;
  campaignName?: string;
  adGroupId?: string;
  adGroupName?: string;
  keywordText?: string;
  gclid?: string;
  clickId?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  requirements?: string;
  estimatedValue?: number;
  capturedAt: Date;
  conversionValue?: number;
  currencyCode?: string;
  rawData: any;
}

export class GoogleService {
  private readonly baseUrl = 'https://googleads.googleapis.com/v14';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly developerToken: string;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor() {
    this.clientId = process.env.GOOGLE_ADS_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
    this.refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
    this.developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';

    if (!this.clientId || !this.clientSecret || !this.refreshToken || !this.developerToken) {
      logger.warn('Google Ads API credentials not configured');
    }
  }

  /**
   * Fetch leads from Google Ads API
   * Validates: Requirements 4.1 - External lead source attribution
   */
  async fetchLeads(
    customerId: string,
    since?: Date,
    until?: Date,
    limit: number = 100
  ): Promise<ProcessedGoogleLead[]> {
    try {
      await this.ensureValidAccessToken();

      const leads: ProcessedGoogleLead[] = [];
      
      // Query for lead form submissions
      let query = `
        SELECT 
          lead_form_submission_data.id,
          lead_form_submission_data.resource_name,
          lead_form_submission_data.gclid,
          lead_form_submission_data.submission_date_time,
          lead_form_submission_data.campaign_id,
          lead_form_submission_data.ad_group_id,
          lead_form_submission_data.creative_id,
          lead_form_submission_data.lead_form_submission_fields
        FROM lead_form_submission_data
      `;

      const conditions: string[] = [];

      if (since) {
        conditions.push(`lead_form_submission_data.submission_date_time >= '${since.toISOString()}'`);
      }

      if (until) {
        conditions.push(`lead_form_submission_data.submission_date_time <= '${until.toISOString()}'`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY lead_form_submission_data.submission_date_time DESC LIMIT ${limit}`;

      const response = await this.executeQuery(customerId, query);

      if (response?.results) {
        for (const result of response.results) {
          const processedLead = this.processGoogleLead(result);
          if (processedLead) {
            leads.push(processedLead);
          }
        }
      }

      logger.info(`Fetched ${leads.length} leads from Google Ads API`, {
        customerId,
        since,
        until,
        limit,
      });

      return leads;
    } catch (error) {
      logger.error('Error fetching Google Ads leads:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance data
   */
  async getCampaignInsights(
    customerId: string,
    campaignId?: string,
    since?: Date,
    until?: Date
  ): Promise<GoogleAdsCampaign[]> {
    try {
      await this.ensureValidAccessToken();

      let query = `
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.start_date,
          campaign.end_date,
          campaign.bidding_strategy_type,
          campaign_budget.amount_micros,
          campaign_budget.delivery_method,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign
      `;

      const conditions: string[] = [];

      if (campaignId) {
        conditions.push(`campaign.id = ${campaignId}`);
      }

      if (since && until) {
        conditions.push(`segments.date >= '${since.toISOString().split('T')[0]}'`);
        conditions.push(`segments.date <= '${until.toISOString().split('T')[0]}'`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      const response = await this.executeQuery(customerId, query);
      const campaigns: GoogleAdsCampaign[] = [];

      if (response?.results) {
        for (const result of response.results) {
          campaigns.push({
            resourceName: result.campaign.resourceName,
            id: result.campaign.id,
            name: result.campaign.name,
            status: result.campaign.status,
            advertisingChannelType: result.campaign.advertisingChannelType,
            startDate: result.campaign.startDate,
            endDate: result.campaign.endDate,
            biddingStrategy: result.campaign.biddingStrategyType,
            budget: result.campaignBudget ? {
              amountMicros: result.campaignBudget.amountMicros,
              deliveryMethod: result.campaignBudget.deliveryMethod,
            } : undefined,
            metrics: result.metrics ? {
              impressions: result.metrics.impressions,
              clicks: result.metrics.clicks,
              cost: result.metrics.costMicros / 1000000, // Convert from micros
              conversions: result.metrics.conversions,
              ctr: result.metrics.ctr,
              averageCpc: result.metrics.averageCpc / 1000000, // Convert from micros
            } : undefined,
          });
        }
      }

      return campaigns;
    } catch (error) {
      logger.error('Error fetching Google Ads campaign insights:', error);
      throw error;
    }
  }

  /**
   * Get keyword performance data
   */
  async getKeywordInsights(
    customerId: string,
    campaignId?: string,
    since?: Date,
    until?: Date,
    limit: number = 100
  ): Promise<GoogleAdsKeyword[]> {
    try {
      await this.ensureValidAccessToken();

      let query = `
        SELECT 
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.status,
          ad_group.id,
          campaign.id,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc
        FROM keyword_view
      `;

      const conditions: string[] = ['ad_group_criterion.type = KEYWORD'];

      if (campaignId) {
        conditions.push(`campaign.id = ${campaignId}`);
      }

      if (since && until) {
        conditions.push(`segments.date >= '${since.toISOString().split('T')[0]}'`);
        conditions.push(`segments.date <= '${until.toISOString().split('T')[0]}'`);
      }

      query += ` WHERE ${conditions.join(' AND ')} LIMIT ${limit}`;

      const response = await this.executeQuery(customerId, query);
      const keywords: GoogleAdsKeyword[] = [];

      if (response?.results) {
        for (const result of response.results) {
          keywords.push({
            resourceName: result.adGroupCriterion.resourceName,
            id: result.adGroupCriterion.criterionId,
            text: result.adGroupCriterion.keyword.text,
            matchType: result.adGroupCriterion.keyword.matchType,
            status: result.adGroupCriterion.status,
            adGroupId: result.adGroup.id,
            campaignId: result.campaign.id,
            metrics: result.metrics ? {
              impressions: result.metrics.impressions,
              clicks: result.metrics.clicks,
              cost: result.metrics.costMicros / 1000000,
              conversions: result.metrics.conversions,
              ctr: result.metrics.ctr,
              averageCpc: result.metrics.averageCpc / 1000000,
            } : undefined,
          });
        }
      }

      return keywords;
    } catch (error) {
      logger.error('Error fetching Google Ads keyword insights:', error);
      throw error;
    }
  }

  /**
   * Process raw Google Ads lead data
   */
  private processGoogleLead(leadData: any): ProcessedGoogleLead | null {
    try {
      const submission = leadData.leadFormSubmissionData;
      if (!submission) return null;

      const processedLead: ProcessedGoogleLead = {
        externalId: submission.id,
        source: 'GOOGLE',
        platform: 'GOOGLE_ADS',
        campaignId: submission.campaignId,
        adGroupId: submission.adGroupId,
        gclid: submission.gclid,
        capturedAt: new Date(submission.submissionDateTime),
        rawData: leadData,
      };

      // Process lead form fields
      if (submission.leadFormSubmissionFields) {
        for (const field of submission.leadFormSubmissionFields) {
          const fieldType = field.fieldType?.toLowerCase();
          const value = field.fieldValue || '';

          switch (fieldType) {
            case 'full_name':
            case 'first_name':
            case 'name':
              processedLead.contactName = value;
              break;
            case 'phone_number':
            case 'phone':
              processedLead.phone = this.cleanPhoneNumber(value);
              break;
            case 'email':
              processedLead.email = value;
              break;
            case 'street_address':
            case 'address':
            case 'city':
              processedLead.address = value;
              break;
            case 'custom':
              // Handle custom fields based on field name
              if (field.fieldName?.toLowerCase().includes('requirement')) {
                processedLead.requirements = value;
              } else if (field.fieldName?.toLowerCase().includes('budget')) {
                const numValue = parseFloat(value.replace(/[^\d.]/g, ''));
                if (!isNaN(numValue)) {
                  processedLead.estimatedValue = numValue;
                }
              }
              break;
          }
        }
      }

      // Validate required fields
      if (!processedLead.contactName && !processedLead.phone && !processedLead.email) {
        logger.warn('Google Ads lead missing required contact information', { 
          leadId: submission.id 
        });
        return null;
      }

      return processedLead;
    } catch (error) {
      logger.error('Error processing Google Ads lead:', error);
      return null;
    }
  }

  /**
   * Execute Google Ads API query
   */
  private async executeQuery(customerId: string, query: string): Promise<any> {
    try {
      if (!this.accessToken) {
        throw new Error('No valid access token available');
      }

      const url = `${this.baseUrl}/customers/${customerId}/googleAds:search`;
      
      const response = await axios.post(
        url,
        { query },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Google Ads API query failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
        query,
      });
      throw error;
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidAccessToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return; // Token is still valid
    }

    await this.refreshAccessToken();
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      logger.info('Google Ads access token refreshed successfully');
    } catch (error) {
      logger.error('Error refreshing Google Ads access token:', error);
      throw error;
    }
  }

  /**
   * Clean and format phone number
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Track conversion back to Google Ads
   */
  async trackConversion(
    customerId: string,
    gclid: string,
    conversionAction: string,
    conversionValue?: number,
    currencyCode: string = 'INR'
  ): Promise<boolean> {
    try {
      await this.ensureValidAccessToken();

      const url = `${this.baseUrl}/customers/${customerId}:uploadClickConversions`;
      
      const conversion = {
        gclid: gclid,
        conversionAction: `customers/${customerId}/conversionActions/${conversionAction}`,
        conversionDateTime: new Date().toISOString(),
        conversionValue: conversionValue,
        currencyCode: currencyCode,
      };

      const response = await axios.post(
        url,
        {
          conversions: [conversion],
          partialFailureEnabled: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      logger.info('Google Ads conversion tracked successfully', {
        customerId,
        gclid,
        conversionValue,
      });

      return true;
    } catch (error) {
      logger.error('Error tracking Google Ads conversion:', error);
      return false;
    }
  }
}