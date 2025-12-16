import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/connection';
import { hashPassword, comparePassword, validatePasswordStrength } from '../auth/password';
import { generateTokenPair, verifyToken } from '../auth/jwt';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const registerSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    phone: z.string().optional(),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
};

/**
 * Register new user
 */
router.post('/register', validate(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName, phone } = req.body;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new AppError(
      'Password does not meet security requirements',
      400,
      'WEAK_PASSWORD',
      true,
      { errors: passwordValidation.errors }
    );
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username },
      ],
    },
  });

  if (existingUser) {
    throw new AppError(
      'User with this email or username already exists',
      409,
      'USER_EXISTS'
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  logger.info('User registered successfully', {
    userId: user.id,
    email: user.email,
    username: user.username,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user },
  });
}));

/**
 * Login user
 */
router.post('/login', validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user with roles
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      'Invalid credentials or account inactive',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(
      'Invalid credentials',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  // Create session
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      token: '', // Will be updated with JWT
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    roles: user.roles.map(ur => ur.role.name),
    sessionId: session.id,
  };

  const tokens = generateTokenPair(tokenPayload);

  // Update session with access token
  await prisma.userSession.update({
    where: { id: session.id },
    data: { token: tokens.accessToken },
  });

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    sessionId: session.id,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map(ur => ur.role.name),
      },
      tokens,
    },
  });
}));

/**
 * Refresh access token
 */
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const payload = verifyToken(refreshToken);
    
    // Find session and user
    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      throw new AppError(
        'Invalid or expired refresh token',
        401,
        'INVALID_REFRESH_TOKEN'
      );
    }

    // Generate new tokens
    const newTokenPayload = {
      userId: session.user.id,
      email: session.user.email,
      roles: session.user.roles.map(ur => ur.role.name),
      sessionId: session.id,
    };

    const tokens = generateTokenPair(newTokenPayload);

    // Update session
    await prisma.userSession.update({
      where: { id: session.id },
      data: { 
        token: tokens.accessToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Extend session
      },
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens },
    });
  } catch (error) {
    throw new AppError(
      'Invalid refresh token',
      401,
      'INVALID_REFRESH_TOKEN'
    );
  }
}));

/**
 * Logout user
 */
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.user!.sessionId;

  // Delete session
  await prisma.userSession.delete({
    where: { id: sessionId },
  });

  logger.info('User logged out successfully', {
    userId: req.user!.id,
    sessionId,
  });

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

/**
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(
      'User not found',
      404,
      'USER_NOT_FOUND'
    );
  }

  res.json({
    success: true,
    data: { 
      user: {
        ...user,
        roles: req.user!.roles,
      },
    },
  });
}));

/**
 * Change password
 */
router.put('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(
      'User not found',
      404,
      'USER_NOT_FOUND'
    );
  }

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError(
      'Current password is incorrect',
      400,
      'INVALID_CURRENT_PASSWORD'
    );
  }

  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new AppError(
      'New password does not meet security requirements',
      400,
      'WEAK_PASSWORD',
      true,
      { errors: passwordValidation.errors }
    );
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  // Invalidate all sessions except current
  await prisma.userSession.deleteMany({
    where: {
      userId,
      id: { not: req.user!.sessionId },
    },
  });

  logger.info('Password changed successfully', {
    userId,
    email: user.email,
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

export { router as authRoutes };