import { prisma } from '../database/connection';
import { hashPassword, comparePassword } from '../auth/password';
import { generateTokenPair } from '../auth/jwt';
import { AppError } from '../middleware/error';
import { logger } from '../utils/logger';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserWithRoles {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    role: {
      id: string;
      name: string;
      description: string | null;
      permissions: any;
    };
  }>;
}

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */
export class AuthService {
  /**
   * Register a new user
   */
  static async registerUser(userData: CreateUserData) {
    const { email, username, password, firstName, lastName, phone } = userData;

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
        phone: phone || null,
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

    return user;
  }

  /**
   * Authenticate user and create session
   */
  static async loginUser(loginData: LoginData) {
    const { email, password } = loginData;

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
    }) as UserWithRoles | null;

    if (!user || !user.isActive) {
      throw new AppError(
        'Invalid credentials or account inactive',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Verify password
    const userWithPassword = await prisma.user.findUnique({
      where: { email },
      select: { password: true },
    });

    if (!userWithPassword) {
      throw new AppError(
        'Invalid credentials',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    const isPasswordValid = await comparePassword(password, userWithPassword.password);
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

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map(ur => ur.role.name),
      },
      tokens,
      sessionId: session.id,
    };
  }

  /**
   * Logout user and invalidate session
   */
  static async logoutUser(sessionId: string) {
    await prisma.userSession.delete({
      where: { id: sessionId },
    });

    logger.info('User logged out successfully', { sessionId });
  }

  /**
   * Get user by ID with roles
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND'
      );
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(ur => ur.role.name),
    };
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
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

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Invalidate all sessions for this user
    await prisma.userSession.deleteMany({
      where: { userId },
    });

    logger.info('Password changed successfully', {
      userId,
      email: user.email,
    });
  }

  /**
   * Validate session
   */
  static async validateSession(sessionId: string) {
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
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
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        roles: session.user.roles.map(ur => ur.role.name),
      },
      sessionId: session.id,
    };
  }
}