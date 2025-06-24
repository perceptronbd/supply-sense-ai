import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../app/prisma.service';
import { AuthenticatedUser } from './decorators/current-user.decorator';
import { UserResponseDto } from './dto/auth-response.dto';
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
  userBranches: Array<{
    branchId: string;
    isActive: boolean;
    branch: {
      id: string;
      name: string;
      code: string;
      isHQ: boolean;
    };
  }>;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  async login(
    email: string,
    password: string
  ): Promise<{ access_token: string; user: UserResponseDto }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.permissions,
      branchIds: user.branchIds,
      isSuperAdmin: false, // Will be set based on user data
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
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
      branchIds: user.branchIds,
      isSuperAdmin: false, // Will be set based on user data
    };
    return this.jwtService.sign(payload);
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
        userBranches: {
          where: { isActive: true },
          include: {
            branch: true,
          },
        },
      },
    })) as UserWithRelations | null;

    if (!user || !user.isActive) {
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
        userBranches: {
          where: { isActive: true },
          include: {
            branch: true,
          },
        },
      },
    })) as UserWithRelations | null;

    if (!user || !user.isActive) {
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

    const branchIds = userWithRelations.userBranches.map((ub) => ub.branchId);
    const branches = userWithRelations.userBranches.map((ub) => ({
      id: ub.branch.id,
      name: ub.branch.name,
      code: ub.branch.code,
      isHQ: ub.branch.isHQ,
    }));

    return {
      id: userWithRelations.id,
      email: userWithRelations.email,
      firstName: userWithRelations.firstName || '',
      lastName: userWithRelations.lastName || '',
      companyId: userWithRelations.companyId,
      companyName: userWithRelations.company?.name || '',
      roles,
      permissions: Array.from(permissionSet),
      branchIds,
      branches,
      isSuperAdmin: userWithRelations.isSuperAdmin,
      isActive: userWithRelations.isActive,
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
      branchIds: user.branchIds,
      isSuperAdmin: user.isSuperAdmin,
    };

    return this.jwtService.sign(payload);
  }
}
