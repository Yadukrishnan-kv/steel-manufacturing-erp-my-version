// Lead Scoring Service - Automated lead qualification and scoring
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface LeadScoringCriteria {
  sourceWeights: Record<string, number>;
  engagementWeights: {
    emailOpened: number;
    linkClicked: number;
    formSubmitted: number;
    phoneCallMade: number;
    siteVisit: number;
    responseTime: number;
  };
  profileWeights: {
    hasEmail: number;
    hasPhone: number;
    hasAddress: number;
    hasRequirements: number;
    hasEstimatedValue: number;
    estimatedValueRange: Record<string, number>;
  };
  behaviorWeights: {
    multipleInquiries: number;
    quickResponse: number;
    detailedRequirements: number;
    priceInquiry: number;
    timelineUrgency: number;
  };
}

export interface LeadScore {
  leadId: string;
  totalScore: number;
  sourceScore: number;
  engagementScore: number;
  profileScore: number;
  behaviorScore: number;
  qualificationStatus: 'UNQUALIFIED' | 'QUALIFIED' | 'HOT' | 'COLD';
  scoringBreakdown: {
    source: { score: number; factors: string[] };
    engagement: { score: number; factors: string[] };
    profile: { score: number; factors: string[] };
    behavior: { score: number; factors: string[] };
  };
  recommendations: string[];
}

export class LeadScoringService {
  private scoringCriteria: LeadScoringCriteria;

  constructor(private prisma: PrismaClient) {
    // Default scoring criteria - can be made configurable
    this.scoringCriteria = {
      sourceWeights: {
        'META': 25,      // Facebook/Instagram leads
        'GOOGLE': 30,    // Google Ads leads
        'REFERRAL': 35,  // Referral leads (highest quality)
        'DIRECT': 20,    // Direct website inquiries
      },
      engagementWeights: {
        emailOpened: 5,
        linkClicked: 8,
        formSubmitted: 15,
        phoneCallMade: 20,
        siteVisit: 25,
        responseTime: 10,
      },
      profileWeights: {
        hasEmail: 5,
        hasPhone: 10,
        hasAddress: 8,
        hasRequirements: 15,
        hasEstimatedValue: 12,
        estimatedValueRange: {
          'low': 5,      // < 50,000
          'medium': 15,  // 50,000 - 200,000
          'high': 25,    // 200,000 - 500,000
          'premium': 35, // > 500,000
        },
      },
      behaviorWeights: {
        multipleInquiries: 15,
        quickResponse: 10,
        detailedRequirements: 20,
        priceInquiry: 12,
        timelineUrgency: 18,
      },
    };
  }

  /**
   * Calculate comprehensive lead score
   * Validates: Requirements 4.1 - Lead scoring and qualification algorithms
   */
  async calculateLeadScore(leadId: string): Promise<LeadScore> {
    try {
      // Get lead with related data
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          communications: {
            orderBy: { sentAt: 'desc' },
          },
          measurements: true,
          estimates: true,
          externalSources: true,
        },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Calculate individual scores
      const sourceScore = this.calculateSourceScore(lead);
      const engagementScore = this.calculateEngagementScore(lead);
      const profileScore = this.calculateProfileScore(lead);
      const behaviorScore = this.calculateBehaviorScore(lead);

      // Calculate total score (weighted average)
      const totalScore = Math.round(
        (sourceScore.score * 0.2) +
        (engagementScore.score * 0.3) +
        (profileScore.score * 0.25) +
        (behaviorScore.score * 0.25)
      );

      // Determine qualification status
      const qualificationStatus = this.determineQualificationStatus(totalScore);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        lead,
        totalScore,
        sourceScore,
        engagementScore,
        profileScore,
        behaviorScore
      );

      const leadScore: LeadScore = {
        leadId: leadId,
        totalScore: totalScore,
        sourceScore: sourceScore.score,
        engagementScore: engagementScore.score,
        profileScore: profileScore.score,
        behaviorScore: behaviorScore.score,
        qualificationStatus: qualificationStatus,
        scoringBreakdown: {
          source: sourceScore,
          engagement: engagementScore,
          profile: profileScore,
          behavior: behaviorScore,
        },
        recommendations: recommendations,
      };

      // Save or update lead scoring in database
      await this.saveLeadScore(leadScore);

      logger.info('Lead score calculated', {
        leadId: leadId,
        totalScore: totalScore,
        qualificationStatus: qualificationStatus,
      });

      return leadScore;
    } catch (error) {
      logger.error('Error calculating lead score:', error);
      throw error;
    }
  }

  /**
   * Calculate source-based score
   */
  private calculateSourceScore(lead: any): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    // Base score from source type
    const baseScore = this.scoringCriteria.sourceWeights[lead.source] || 10;
    score += baseScore;
    factors.push(`${lead.source} source: +${baseScore}`);

    // Additional points for external source data
    if (lead.externalSources && lead.externalSources.length > 0) {
      const externalSource = lead.externalSources[0];
      
      // Campaign quality indicators
      if (externalSource.campaignId) {
        score += 5;
        factors.push('Campaign tracking: +5');
      }

      // Cost efficiency (if available)
      if (externalSource.cost && externalSource.conversions) {
        const costPerConversion = externalSource.cost / externalSource.conversions;
        if (costPerConversion < 500) {
          score += 10;
          factors.push('Cost-effective source: +10');
        } else if (costPerConversion < 1000) {
          score += 5;
          factors.push('Moderate cost source: +5');
        }
      }
    }

    // Referral bonus
    if (lead.source === 'REFERRAL') {
      score += 10;
      factors.push('Referral bonus: +10');
    }

    return {
      score: Math.min(score, 50), // Cap at 50
      factors: factors,
    };
  }

  /**
   * Calculate engagement-based score
   */
  private calculateEngagementScore(lead: any): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    // Communication engagement
    if (lead.communications && lead.communications.length > 0) {
      const communications = lead.communications;
      
      // Response rate
      const inboundComms = communications.filter(c => c.direction === 'INBOUND').length;
      const outboundComms = communications.filter(c => c.direction === 'OUTBOUND').length;
      
      if (outboundComms > 0) {
        const responseRate = inboundComms / outboundComms;
        if (responseRate > 0.5) {
          score += 20;
          factors.push('High response rate: +20');
        } else if (responseRate > 0.2) {
          score += 10;
          factors.push('Moderate response rate: +10');
        }
      }

      // Communication frequency
      if (communications.length > 5) {
        score += 15;
        factors.push('High engagement: +15');
      } else if (communications.length > 2) {
        score += 8;
        factors.push('Moderate engagement: +8');
      }

      // Recent activity
      const recentComm = communications[0];
      const daysSinceLastComm = Math.floor(
        (new Date().getTime() - new Date(recentComm.sentAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastComm <= 1) {
        score += 15;
        factors.push('Recent activity: +15');
      } else if (daysSinceLastComm <= 7) {
        score += 8;
        factors.push('Active within week: +8');
      }
    }

    // Site measurement engagement
    if (lead.measurements && lead.measurements.length > 0) {
      score += 25;
      factors.push('Site measurement completed: +25');
    }

    // Estimate request engagement
    if (lead.estimates && lead.estimates.length > 0) {
      score += 20;
      factors.push('Estimate requested: +20');
    }

    return {
      score: Math.min(score, 50), // Cap at 50
      factors: factors,
    };
  }

  /**
   * Calculate profile completeness score
   */
  private calculateProfileScore(lead: any): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    // Contact information completeness
    if (lead.email) {
      score += this.scoringCriteria.profileWeights.hasEmail;
      factors.push(`Email provided: +${this.scoringCriteria.profileWeights.hasEmail}`);
    }

    if (lead.phone) {
      score += this.scoringCriteria.profileWeights.hasPhone;
      factors.push(`Phone provided: +${this.scoringCriteria.profileWeights.hasPhone}`);
    }

    if (lead.address) {
      score += this.scoringCriteria.profileWeights.hasAddress;
      factors.push(`Address provided: +${this.scoringCriteria.profileWeights.hasAddress}`);
    }

    // Requirements detail
    if (lead.requirements) {
      score += this.scoringCriteria.profileWeights.hasRequirements;
      factors.push(`Requirements specified: +${this.scoringCriteria.profileWeights.hasRequirements}`);
      
      // Detailed requirements bonus
      if (lead.requirements.length > 100) {
        score += 10;
        factors.push('Detailed requirements: +10');
      }
    }

    // Estimated value
    if (lead.estimatedValue) {
      score += this.scoringCriteria.profileWeights.hasEstimatedValue;
      factors.push(`Budget indicated: +${this.scoringCriteria.profileWeights.hasEstimatedValue}`);
      
      // Value range scoring
      const value = lead.estimatedValue;
      let rangeScore = 0;
      let rangeName = '';
      
      if (value > 500000) {
        rangeScore = this.scoringCriteria.profileWeights.estimatedValueRange.premium;
        rangeName = 'Premium budget';
      } else if (value > 200000) {
        rangeScore = this.scoringCriteria.profileWeights.estimatedValueRange.high;
        rangeName = 'High budget';
      } else if (value > 50000) {
        rangeScore = this.scoringCriteria.profileWeights.estimatedValueRange.medium;
        rangeName = 'Medium budget';
      } else {
        rangeScore = this.scoringCriteria.profileWeights.estimatedValueRange.low;
        rangeName = 'Low budget';
      }
      
      score += rangeScore;
      factors.push(`${rangeName}: +${rangeScore}`);
    }

    return {
      score: Math.min(score, 50), // Cap at 50
      factors: factors,
    };
  }

  /**
   * Calculate behavior-based score
   */
  private calculateBehaviorScore(lead: any): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    // Multiple touchpoints
    const touchpoints = [
      lead.communications?.length || 0,
      lead.measurements?.length || 0,
      lead.estimates?.length || 0,
    ].filter(count => count > 0).length;

    if (touchpoints >= 3) {
      score += this.scoringCriteria.behaviorWeights.multipleInquiries;
      factors.push(`Multiple touchpoints: +${this.scoringCriteria.behaviorWeights.multipleInquiries}`);
    }

    // Quick response (if first communication was inbound and quick)
    if (lead.communications && lead.communications.length > 0) {
      const firstComm = lead.communications[lead.communications.length - 1];
      const timeDiff = new Date(firstComm.sentAt).getTime() - new Date(lead.createdAt).getTime();
      const hoursToResponse = timeDiff / (1000 * 60 * 60);
      
      if (hoursToResponse <= 2) {
        score += this.scoringCriteria.behaviorWeights.quickResponse;
        factors.push(`Quick response: +${this.scoringCriteria.behaviorWeights.quickResponse}`);
      }
    }

    // Detailed requirements analysis
    if (lead.requirements) {
      const keywords = ['size', 'color', 'material', 'installation', 'delivery', 'budget', 'timeline'];
      const mentionedKeywords = keywords.filter(keyword => 
        lead.requirements.toLowerCase().includes(keyword)
      ).length;
      
      if (mentionedKeywords >= 3) {
        score += this.scoringCriteria.behaviorWeights.detailedRequirements;
        factors.push(`Detailed requirements: +${this.scoringCriteria.behaviorWeights.detailedRequirements}`);
      }
    }

    // Price inquiry behavior
    if (lead.estimates && lead.estimates.length > 0) {
      score += this.scoringCriteria.behaviorWeights.priceInquiry;
      factors.push(`Price inquiry: +${this.scoringCriteria.behaviorWeights.priceInquiry}`);
    }

    // Timeline urgency
    if (lead.requirements && 
        (lead.requirements.toLowerCase().includes('urgent') || 
         lead.requirements.toLowerCase().includes('asap') ||
         lead.requirements.toLowerCase().includes('immediate'))) {
      score += this.scoringCriteria.behaviorWeights.timelineUrgency;
      factors.push(`Timeline urgency: +${this.scoringCriteria.behaviorWeights.timelineUrgency}`);
    }

    return {
      score: Math.min(score, 50), // Cap at 50
      factors: factors,
    };
  }

  /**
   * Determine qualification status based on total score
   */
  private determineQualificationStatus(totalScore: number): 'UNQUALIFIED' | 'QUALIFIED' | 'HOT' | 'COLD' {
    if (totalScore >= 80) return 'HOT';
    if (totalScore >= 60) return 'QUALIFIED';
    if (totalScore >= 30) return 'COLD';
    return 'UNQUALIFIED';
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    lead: any,
    totalScore: number,
    sourceScore: any,
    engagementScore: any,
    profileScore: any,
    behaviorScore: any
  ): string[] {
    const recommendations: string[] = [];

    // Score-based recommendations
    if (totalScore >= 80) {
      recommendations.push('High-priority lead: Schedule immediate follow-up call');
      recommendations.push('Prepare detailed proposal and site visit');
    } else if (totalScore >= 60) {
      recommendations.push('Qualified lead: Follow up within 24 hours');
      recommendations.push('Send detailed product information');
    } else if (totalScore >= 30) {
      recommendations.push('Nurture lead: Add to email marketing campaign');
      recommendations.push('Follow up weekly with valuable content');
    } else {
      recommendations.push('Low-priority lead: Add to monthly newsletter');
    }

    // Specific improvement recommendations
    if (profileScore.score < 20) {
      recommendations.push('Collect missing contact information');
      if (!lead.phone) recommendations.push('Request phone number for better communication');
      if (!lead.email) recommendations.push('Request email for sending proposals');
    }

    if (engagementScore.score < 15) {
      recommendations.push('Increase engagement: Send personalized content');
      recommendations.push('Schedule a discovery call to understand needs better');
    }

    if (!lead.measurements || lead.measurements.length === 0) {
      recommendations.push('Schedule site measurement visit');
    }

    if (!lead.estimates || lead.estimates.length === 0) {
      recommendations.push('Prepare and send initial estimate');
    }

    // Urgency-based recommendations
    if (lead.requirements && 
        (lead.requirements.toLowerCase().includes('urgent') || 
         lead.requirements.toLowerCase().includes('asap'))) {
      recommendations.unshift('URGENT: Contact immediately - customer has urgent timeline');
    }

    return recommendations;
  }

  /**
   * Save lead score to database
   */
  private async saveLeadScore(leadScore: LeadScore): Promise<void> {
    try {
      await this.prisma.leadScoring.upsert({
        where: { leadId: leadScore.leadId },
        update: {
          totalScore: leadScore.totalScore,
          sourceScore: leadScore.sourceScore,
          engagementScore: leadScore.engagementScore,
          profileScore: leadScore.profileScore,
          behaviorScore: leadScore.behaviorScore,
          qualificationStatus: leadScore.qualificationStatus,
          lastUpdated: new Date(),
          scoringRules: JSON.stringify({
            breakdown: leadScore.scoringBreakdown,
            recommendations: leadScore.recommendations,
          }),
        },
        create: {
          leadId: leadScore.leadId,
          totalScore: leadScore.totalScore,
          sourceScore: leadScore.sourceScore,
          engagementScore: leadScore.engagementScore,
          profileScore: leadScore.profileScore,
          behaviorScore: leadScore.behaviorScore,
          qualificationStatus: leadScore.qualificationStatus,
          lastUpdated: new Date(),
          scoringRules: JSON.stringify({
            breakdown: leadScore.scoringBreakdown,
            recommendations: leadScore.recommendations,
          }),
        },
      });
    } catch (error) {
      logger.error('Error saving lead score:', error);
      throw error;
    }
  }

  /**
   * Get lead score by lead ID
   */
  async getLeadScore(leadId: string): Promise<LeadScore | null> {
    try {
      const scoring = await this.prisma.leadScoring.findUnique({
        where: { leadId: leadId },
        include: {
          lead: {
            select: {
              leadNumber: true,
              contactName: true,
              source: true,
              status: true,
            },
          },
        },
      });

      if (!scoring) {
        return null;
      }

      const scoringRules = scoring.scoringRules ? JSON.parse(scoring.scoringRules) : {};

      return {
        leadId: scoring.leadId,
        totalScore: scoring.totalScore,
        sourceScore: scoring.sourceScore,
        engagementScore: scoring.engagementScore,
        profileScore: scoring.profileScore,
        behaviorScore: scoring.behaviorScore,
        qualificationStatus: scoring.qualificationStatus as any,
        scoringBreakdown: scoringRules.breakdown || {},
        recommendations: scoringRules.recommendations || [],
      };
    } catch (error) {
      logger.error('Error getting lead score:', error);
      throw error;
    }
  }

  /**
   * Bulk calculate scores for multiple leads
   */
  async bulkCalculateScores(leadIds: string[]): Promise<LeadScore[]> {
    const scores: LeadScore[] = [];

    for (const leadId of leadIds) {
      try {
        const score = await this.calculateLeadScore(leadId);
        scores.push(score);
      } catch (error) {
        logger.error(`Error calculating score for lead ${leadId}:`, error);
        // Continue with other leads
      }
    }

    return scores;
  }

  /**
   * Get leads by qualification status
   */
  async getLeadsByQualification(
    status: 'UNQUALIFIED' | 'QUALIFIED' | 'HOT' | 'COLD',
    limit: number = 50
  ): Promise<any[]> {
    try {
      const scorings = await this.prisma.leadScoring.findMany({
        where: {
          qualificationStatus: status,
        },
        include: {
          lead: {
            select: {
              id: true,
              leadNumber: true,
              contactName: true,
              phone: true,
              email: true,
              source: true,
              status: true,
              createdAt: true,
              assignedTo: true,
            },
          },
        },
        orderBy: {
          totalScore: 'desc',
        },
        take: limit,
      });

      return scorings.map(scoring => ({
        ...scoring.lead,
        scoring: {
          totalScore: scoring.totalScore,
          qualificationStatus: scoring.qualificationStatus,
          lastUpdated: scoring.lastUpdated,
        },
      }));
    } catch (error) {
      logger.error('Error getting leads by qualification:', error);
      throw error;
    }
  }
}