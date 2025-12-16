// Performance Management Test - Basic functionality test
import { hrService } from '../src/services/hr.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Performance Management', () => {
  let testEmployeeId: string;
  let testBranchId: string;

  beforeAll(async () => {
    // Create test branch with unique code
    const branchCode = `TEST-BRANCH-${Date.now()}`;
    const branch = await prisma.branch.create({
      data: {
        code: branchCode,
        name: 'Test Branch',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        createdBy: 'test-user'
      }
    });
    testBranchId = branch.id;

    // Create test employee
    const employee = await hrService.createEmployee({
      employeeCode: `EMP-TEST-${Date.now()}`,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      dateOfJoining: new Date(),
      designation: 'Software Engineer',
      department: 'IT',
      branchId: testBranchId,
      salary: 50000
    }, 'test-user');
    testEmployeeId = employee.id;
  });

  afterAll(async () => {
    // Clean up test data in correct order (child records first)
    await prisma.appraisalItem.deleteMany({});
    await prisma.promotion.deleteMany({});
    await prisma.incentive.deleteMany({});
    await prisma.trainingEnrollment.deleteMany({});
    await prisma.trainingProgram.deleteMany({});
    await prisma.performanceReview.deleteMany({
      where: { employeeId: testEmployeeId }
    });
    await prisma.employee.deleteMany({
      where: { id: testEmployeeId }
    });
    await prisma.branch.deleteMany({
      where: { id: testBranchId }
    });
    await prisma.$disconnect();
  });

  describe('Performance Review Management', () => {
    test('should create performance review', async () => {
      const reviewRequest = {
        employeeId: testEmployeeId,
        reviewPeriod: '2024-Q4',
        reviewType: 'QUARTERLY' as const,
        reviewerIds: ['reviewer-1', 'reviewer-2'],
        goals: 'Improve technical skills',
        developmentPlan: 'Complete certification courses'
      };

      const review = await hrService.createPerformanceReview(reviewRequest, 'test-manager');

      expect(review).toBeDefined();
      expect(review.employeeId).toBe(testEmployeeId);
      expect(review.reviewPeriod).toBe('2024-Q4');
      expect(review.reviewType).toBe('QUARTERLY');
      expect(review.status).toBe('DRAFT');
      expect(review.overallScore).toBe(0);
    });

    test('should add appraisal item to review', async () => {
      // First create a review
      const review = await hrService.createPerformanceReview({
        employeeId: testEmployeeId,
        reviewPeriod: '2024-Q3',
        reviewType: 'QUARTERLY' as const,
        reviewerIds: ['reviewer-1']
      }, 'test-manager');

      const appraisalRequest = {
        reviewId: review.id,
        category: 'TECHNICAL' as const,
        criterion: 'Code Quality',
        description: 'Ability to write clean, maintainable code',
        targetValue: 90,
        actualValue: 85,
        managerRating: 4,
        weightage: 25,
        comments: 'Good progress, needs improvement in documentation',
        jobDescRef: 'Software Engineer - Technical Skills'
      };

      const appraisalItem = await hrService.addAppraisalItem(appraisalRequest);

      expect(appraisalItem).toBeDefined();
      expect(appraisalItem.reviewId).toBe(review.id);
      expect(appraisalItem.category).toBe('TECHNICAL');
      expect(appraisalItem.managerRating).toBe(4);
      expect(appraisalItem.score).toBe(20); // (4/5) * 25 = 20
    });

    test('should submit self-assessment', async () => {
      // Create review with appraisal items
      const review = await hrService.createPerformanceReview({
        employeeId: testEmployeeId,
        reviewPeriod: '2024-Q2',
        reviewType: 'QUARTERLY' as const,
        reviewerIds: ['reviewer-1']
      }, 'test-manager');

      const appraisalItem = await hrService.addAppraisalItem({
        reviewId: review.id,
        category: 'BEHAVIORAL' as const,
        criterion: 'Communication',
        managerRating: 4,
        weightage: 30
      });

      const selfAssessmentRequest = {
        reviewId: review.id,
        selfAssessment: {
          strengths: 'Good technical skills',
          improvements: 'Need to improve communication',
          goals: 'Complete leadership training'
        },
        selfRatings: {
          [appraisalItem.id]: 3
        }
      };

      const updatedReview = await hrService.submitSelfAssessment(selfAssessmentRequest);

      expect(updatedReview.status).toBe('SUBMITTED');
      expect(updatedReview.submittedAt).toBeDefined();
      expect(updatedReview.selfAssessment).toBeDefined();
    });

    test('should complete performance review', async () => {
      // Create and submit review
      const review = await hrService.createPerformanceReview({
        employeeId: testEmployeeId,
        reviewPeriod: '2024-Q1',
        reviewType: 'QUARTERLY' as const,
        reviewerIds: ['reviewer-1']
      }, 'test-manager');

      await hrService.addAppraisalItem({
        reviewId: review.id,
        category: 'LEADERSHIP' as const,
        criterion: 'Team Management',
        managerRating: 5,
        weightage: 40
      });

      await hrService.submitSelfAssessment({
        reviewId: review.id,
        selfAssessment: { goals: 'Lead more projects' },
        selfRatings: {}
      });

      const completedReview = await hrService.completePerformanceReview(
        review.id,
        'Excellent performance this quarter',
        'Recommended for promotion',
        'test-hr'
      );

      expect(completedReview.status).toBe('COMPLETED');
      expect(completedReview.completedAt).toBeDefined();
      expect(completedReview.managerComments).toBe('Excellent performance this quarter');
      expect(completedReview.hrComments).toBe('Recommended for promotion');
      expect(completedReview.promotionEligible).toBe(true); // Score >= 80%
    });
  });

  describe('Promotion Management', () => {
    test('should process promotion', async () => {
      const promotionRequest = {
        employeeId: testEmployeeId,
        toDesignation: 'Senior Software Engineer',
        toSalary: 70000,
        salaryIncrease: 40, // 40% increase
        effectiveDate: new Date('2024-01-01'),
        reason: 'PERFORMANCE',
        approvedBy: 'test-manager'
      };

      const promotion = await hrService.processPromotion(promotionRequest);

      expect(promotion).toBeDefined();
      expect(promotion.employeeId).toBe(testEmployeeId);
      expect(promotion.toDesignation).toBe('Senior Software Engineer');
      expect(promotion.toSalary).toBe(70000);
      expect(promotion.status).toBe('APPROVED');

      // Verify employee record was updated
      const updatedEmployee = await hrService.getEmployeeById(testEmployeeId);
      expect(updatedEmployee.designation).toBe('Senior Software Engineer');
      expect(updatedEmployee.salary).toBe(70000);
    });
  });

  describe('Incentive Management', () => {
    test('should award incentive', async () => {
      const incentiveRequest = {
        employeeId: testEmployeeId,
        incentiveType: 'PERFORMANCE_BONUS',
        amount: 10000,
        period: '2024-Q4',
        criteria: 'Exceeded quarterly targets by 20%',
        kpiMetrics: ['sales_target', 'customer_satisfaction'],
        calculationBase: 'ACHIEVEMENT_PERCENTAGE',
        approvedBy: 'test-manager'
      };

      const incentive = await hrService.awardIncentive(incentiveRequest);

      expect(incentive).toBeDefined();
      expect(incentive.employeeId).toBe(testEmployeeId);
      expect(incentive.incentiveType).toBe('PERFORMANCE_BONUS');
      expect(incentive.amount).toBe(10000);
      expect(incentive.status).toBe('APPROVED');
    });
  });

  describe('Training Management', () => {
    test('should create training program and enroll employee', async () => {
      // Create training program
      const programRequest = {
        name: 'Leadership Development',
        description: 'Advanced leadership skills training',
        category: 'LEADERSHIP',
        duration: 40,
        provider: 'Internal Training Team',
        cost: 5000,
        maxParticipants: 20
      };

      const program = await hrService.createTrainingProgram(programRequest, 'test-admin');

      expect(program).toBeDefined();
      expect(program.name).toBe('Leadership Development');
      expect(program.category).toBe('LEADERSHIP');

      // Enroll employee
      const enrollmentRequest = {
        employeeId: testEmployeeId,
        programId: program.id,
        startDate: new Date('2024-02-01')
      };

      const enrollment = await hrService.enrollInTraining(enrollmentRequest, 'test-manager');

      expect(enrollment).toBeDefined();
      expect(enrollment.employeeId).toBe(testEmployeeId);
      expect(enrollment.programId).toBe(program.id);
      expect(enrollment.status).toBe('ENROLLED');

      // Complete training
      const completedEnrollment = await hrService.completeTraining(
        enrollment.id,
        85,
        'Excellent participation and engagement',
        'https://certificates.example.com/cert123'
      );

      expect(completedEnrollment.status).toBe('COMPLETED');
      expect(completedEnrollment.score).toBe(85);
      expect(completedEnrollment.completedAt).toBeDefined();
    });
  });

  describe('Performance Analytics', () => {
    test('should get performance analytics', async () => {
      const analytics = await hrService.getPerformanceAnalytics(testBranchId, 'IT', '2024-Q4');

      expect(analytics).toBeDefined();
      expect(analytics.totalReviews).toBeGreaterThanOrEqual(0);
      expect(analytics.averageScore).toBeGreaterThanOrEqual(0);
      expect(analytics.ratingDistribution).toBeDefined();
      expect(analytics.departmentAnalytics).toBeDefined();
    });
  });
});