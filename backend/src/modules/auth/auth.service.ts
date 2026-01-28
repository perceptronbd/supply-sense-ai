import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CREDIT } from '@supplysense/constant';
import { BillingCycle, SubscriptionStatus } from '@supplysense/prisma-client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../../libs/shared/prisma/src/lib/prisma.service';
import { AuthenticatedUser } from './decorators/current-user.decorator';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// Type definitions for complex Prisma queries
interface UserWithRelations {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  password: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  isCompleteOnboarding: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  company: {
    id: string;
    name: string;
    isActive: boolean;
    taxId: string | null;
    businessAddress: string | null;
    contactPhone: string | null;
    contactEmail: string;
    industry: string | null;
    defaultCurrency: string;
    timezone: string;
    createdAt: Date;
    updatedAt: Date;
  };
  userRoles: Array<{
    role: {
      id: string;
      name: string;
      permissions: Array<{
        permission: {
          id: string;
          module: string;
          action: string;
        };
      }>;
    };
  }>;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.validateUser(email, password);
    console.log('🚀 > AuthService > user:', user);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isCompleteOnboarding) {
      throw new UnauthorizedException('Please complete onboarding process before logging in');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.permissions,
      isSuperAdmin: false, // Will be set based on user data
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = await this.generateRefreshToken(user.id);

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  /**
   * Register a new company and create the first super admin user
   */
  async register(registerDto: RegisterDto): Promise<RegistrationResponseDto> {
    // Check if company email already exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { contactEmail: registerDto.companyEmail },
    });

    if (existingCompany) {
      // If company exists, check if it already has a subscription
      const existingCompanySubscription = await this.prisma.companySubscription.findFirst({
        where: { companyId: existingCompany.id },
      });
      if (existingCompanySubscription) {
        throw new ConflictException('This company is already subscribed. Try another one.');
      }
      throw new ConflictException('A company with this email is already registered');
    }

    // Check if user email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash the password
    const hashedPassword = await argon2.hash(registerDto.password);

    // Create company and user in a transaction
    const result = await this.prisma.$transaction(
      async (tx) => {
        // Create the company
        const company = await tx.company.create({
          data: {
            name: registerDto.companyName,
            contactEmail: registerDto.companyEmail,
            taxId: registerDto.taxId,
            businessAddress: registerDto.businessAddress,
            contactPhone: registerDto.contactPhone,
            industry: registerDto.industry,
          },
        });

        // Find or create the default subscription plan (TRIAL)
        let defaultPlan = await tx.subscriptionPlan.findFirst({
          where: {
            name: CREDIT.TRIAL.name,
            isActive: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        if (!defaultPlan) {
          defaultPlan = await tx.subscriptionPlan.create({
            data: {
              ...CREDIT.TRIAL,
              isActive: true,
            },
          });
        }

        // Create the company subscription
        await tx.companySubscription.create({
          data: {
            status: SubscriptionStatus.ACTIVE,
            billingCycle: BillingCycle.MONTHLY,
            startPeriod: new Date(),
            endPeriod: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            totalCredits: defaultPlan.credits,
            remainingCredits: defaultPlan.credits,
            isCancelAtPeriodEnd: false,
            stripeSubscriptionId: randomUUID(), // TODO: To be set after Stripe integration
            companyId: company.id,
            subscriptionPlanId: defaultPlan.id,
          },
        });

        // Create default "Super Admin" role for the company
        const superAdminRole = await tx.role.create({
          data: {
            name: 'Super Admin',
            description: 'Full access to all company resources and settings',
            companyId: company.id,
          },
        });

        // Get all available permissions
        const allPermissions = await tx.permission.findMany();

        // Assign all permissions to Super Admin role
        const rolePermissions = allPermissions.map((permission) => ({
          roleId: superAdminRole.id,
          permissionId: permission.id,
        }));

        await tx.rolePermission.createMany({
          data: rolePermissions,
        });

        // Create the super admin user
        const user = await tx.user.create({
          data: {
            email: registerDto.email,
            username: registerDto.email, // Use email as default username
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            password: hashedPassword,
            isSuperAdmin: true,
            companyId: company.id,
          },
        });

        // Assign Super Admin role to user
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: superAdminRole.id,
          },
        });

        return { company, user };
      },
      {
        timeout: 20000, // 20 seconds to account for remote DB latency
        maxWait: 5000,
      }
    );

    // Get the user with full relations for token generation
    const userWithRelations = await this.getUserById(result.user.id);
    if (!userWithRelations) {
      throw new BadRequestException('Failed to retrieve user data after registration');
    }

    // Generate JWT token
    const access_token = await this.generateToken(userWithRelations);

    return {
      success: true,
      message: 'Company and user registered successfully',
      company: {
        id: result.company.id,
        name: result.company.name,
        contactEmail: result.company.contactEmail,
        industry: result.company.industry ?? '',
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
        isSuperAdmin: result.user.isSuperAdmin,
        isCompleteOnboarding: result.user.isCompleteOnboarding,
      },
      access_token,
      refresh_token: await this.generateRefreshToken(result.user.id),
    };
  }

  async refreshToken(authenticatedUser: AuthenticatedUser): Promise<string> {
    // Get fresh user data to ensure we have latest permissions/roles
    const user = await this.getUserById(authenticatedUser.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.permissions,
      isSuperAdmin: user.isSuperAdmin,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Generate a new refresh token and store it in the database
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Optional: Revoke the old token (Token Rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const user = await this.getUserById(tokenRecord.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.permissions,
      isSuperAdmin: user.isSuperAdmin,
    };

    const access_token = this.jwtService.sign(payload);
    const new_refresh_token = await this.generateRefreshToken(user.id);

    return {
      access_token,
      refresh_token: new_refresh_token,
    };
  }

  /**
   * Revoke all refresh tokens for a user (on logout or security breach)
   */
  async revokeRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async validateUser(email: string, password: string): Promise<UserResponseDto | null> {
    const user = (await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })) as unknown as UserWithRelations | null;

    if (!user?.isActive) {
      return null;
    }

    // Check if company is active
    if (!user.company?.isActive) {
      return null;
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return null;
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return this.transformUserToResponseDto(user);
  }

  async getUserById(id: string): Promise<UserResponseDto | null> {
    const user = (await this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })) as unknown as UserWithRelations | null;

    if (!user?.isActive) {
      return null;
    }

    return this.transformUserToResponseDto(user);
  }

  private transformUserToResponseDto(userWithRelations: UserWithRelations): UserResponseDto {
    const roles = userWithRelations.userRoles.map((ur) => ur.role.name);

    // Extract permissions from all roles
    const permissionSet = new Set<string>();
    for (const userRole of userWithRelations.userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        const permission = `${rolePermission.permission.module}:${rolePermission.permission.action}`;
        permissionSet.add(permission);
      }
    }

    return {
      id: userWithRelations.id,
      email: userWithRelations.email,
      firstName: userWithRelations.firstName || '',
      lastName: userWithRelations.lastName || '',
      companyId: userWithRelations.companyId,
      companyName: userWithRelations.company?.name || '',
      roles,
      permissions: Array.from(permissionSet),
      isSuperAdmin: userWithRelations.isSuperAdmin,
      isActive: userWithRelations.isActive,
      isCompleteOnboarding: userWithRelations.isCompleteOnboarding,
    };
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permissions: string[], requiredModule: string, requiredAction: string): boolean {
    const requiredPermission = `${requiredModule}:${requiredAction}`;
    return permissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  /**
   * Check if user has access to specific branch
   */
  hasAccessToBranch(userBranchIds: string[], requiredBranchId: string): boolean {
    return userBranchIds.includes(requiredBranchId);
  }

  /**
   * Check if user belongs to same company
   */
  isSameCompany(userCompanyId: string, targetCompanyId: string): boolean {
    return userCompanyId === targetCompanyId;
  }

  /**
   * Generate JWT token for a user
   */
  async generateToken(user: UserResponseDto): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.permissions,
      isSuperAdmin: user.isSuperAdmin,
    };

    return this.jwtService.sign(payload);
  }
}
