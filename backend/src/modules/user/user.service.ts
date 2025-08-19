import { PrismaService } from '@app/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedUsersEntity, UserEntity } from './entities/user.entity';

// Type definitions for Prisma query results with relations
interface UserWithRelations {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  governmentId?: string;
  avatar?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  userRoles?: Array<{
    role: {
      id: string;
      name: string;
      description: string;
      permissions: Array<{
        permission: {
          module: string;
          action: string;
        };
      }>;
    };
  }>;
}

@Injectable()
export class UserService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, companyId: string): Promise<UserEntity> {
    // Check if email already exists in the same company
    const existingEmailUser = await this.prisma.user.findFirst({
      where: {
        email: createUserDto.email,
        companyId,
      },
    });

    if (existingEmailUser) {
      throw new ConflictException('Email already exists in this company');
    }

    // Check if username already exists globally
    const existingUsernameUser = await this.prisma.user.findUnique({
      where: {
        username: createUserDto.username,
      },
    });

    if (existingUsernameUser) {
      throw new ConflictException('Username already exists');
    }

    // Validate that all roles belong to the same company
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: createUserDto.roleIds },
        companyId,
        isActive: true,
      },
    });

    if (roles.length !== createUserDto.roleIds.length) {
      throw new BadRequestException('One or more roles not found or belong to different company');
    }

    // Hash password
    const hashedPassword = await argon2.hash(createUserDto.password);

    // Create user with roles and branches
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        governmentId: createUserDto.governmentId,
        password: hashedPassword,
        companyId,
        userRoles: {
          create: createUserDto.roleIds.map((roleId) => ({
            roleId,
          })),
        },
      },
      include: {
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
    });

    return this.transformUserEntity(user);
  }

  async findAll(
    query: QueryUserDto,
    companyId: string
  ): Promise<UserEntity[] | PaginatedUsersEntity> {
    const {
      search,
      roleId,
      isActive,
      page,
      limit,
      sortBy = 'firstName',
      sortOrder = 'asc',
      includeRoles = false,
      includeBranches = false,
    } = query;

    // Build where clause
    const where = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { username: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(roleId && {
        userRoles: {
          some: {
            roleId,
          },
        },
      }),
    };

    // Build include clause
    const include = {
      ...(includeRoles && {
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
      }),
      ...(includeBranches && {}),
    };

    // If pagination is requested
    if (page && limit) {
      // Ensure page and limit are numbers (fallback if DTO transformation fails)
      const pageNum = typeof page === 'string' ? Number.parseInt(page, 10) : page;
      const limitNum = typeof limit === 'string' ? Number.parseInt(limit, 10) : limit;

      const skip = (pageNum - 1) * limitNum;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include,
          skip,
          take: limitNum,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return {
        data: users.map((user) => this.transformUserEntity(user)),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      };
    }

    // Return all users without pagination
    const users = await this.prisma.user.findMany({
      where,
      include,
      orderBy: { [sortBy]: sortOrder },
    });

    return users.map((user) => this.transformUserEntity(user));
  }

  async findOne(id: string, companyId: string): Promise<UserEntity> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
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
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.transformUserEntity(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, companyId: string): Promise<UserEntity> {
    // Check if user exists and belongs to company
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const existingEmailUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          companyId,
          id: { not: id },
        },
      });

      if (existingEmailUser) {
        throw new ConflictException('Email already exists in this company');
      }
    }

    // Check username uniqueness if username is being updated
    if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
      const existingUsernameUser = await this.prisma.user.findUnique({
        where: {
          username: updateUserDto.username,
        },
      });

      if (existingUsernameUser) {
        throw new ConflictException('Username already exists');
      }
    }

    // Prepare update data
    const updateData: Partial<UpdateUserDto & { password: string }> = { ...updateUserDto };

    // Hash password if provided
    if (updateUserDto.password) {
      updateData.password = await argon2.hash(updateUserDto.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
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
    });

    return this.transformUserEntity(user);
  }

  async assignRoles(
    id: string,
    assignRolesDto: AssignRolesDto,
    companyId: string
  ): Promise<UserEntity> {
    // Check if user exists and belongs to company
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Validate that all roles belong to the same company
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: assignRolesDto.roleIds },
        companyId,
        isActive: true,
      },
    });

    if (roles.length !== assignRolesDto.roleIds.length) {
      throw new BadRequestException('One or more roles not found or belong to different company');
    }

    // Perform the action based on the request
    switch (assignRolesDto.action) {
      case 'assign': {
        // Add new roles (avoid duplicates)
        const existingRoleIds = await this.prisma.userRole
          .findMany({
            where: { userId: id },
            select: { roleId: true },
          })
          .then((userRoles) => userRoles.map((ur) => ur.roleId));

        const newRoleIds = assignRolesDto.roleIds.filter(
          (roleId) => !existingRoleIds.includes(roleId)
        );

        if (newRoleIds.length > 0) {
          await this.prisma.userRole.createMany({
            data: newRoleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        }
        break;
      }

      case 'remove': {
        // Check that user will still have at least one role after removal
        const currentRoles = await this.prisma.userRole.findMany({
          where: { userId: id },
        });

        const remainingRoles = currentRoles.filter(
          (userRole) => !assignRolesDto.roleIds.includes(userRole.roleId)
        );

        if (remainingRoles.length === 0) {
          throw new BadRequestException('User must have at least one role');
        }

        await this.prisma.userRole.deleteMany({
          where: {
            userId: id,
            roleId: { in: assignRolesDto.roleIds },
          },
        });
        break;
      }

      case 'replace': {
        // Replace all roles with new ones
        await this.prisma.userRole.deleteMany({
          where: { userId: id },
        });

        await this.prisma.userRole.createMany({
          data: assignRolesDto.roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        });
        break;
      }
    }

    // Return updated user
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<UserEntity> {
    // Check if user exists and belongs to company
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Prevent deactivating super admin
    if (existingUser.isSuperAdmin) {
      throw new ForbiddenException('Cannot deactivate super admin user');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
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
    });

    return this.transformUserEntity(user);
  }

  async activate(id: string, companyId: string): Promise<UserEntity> {
    // Check if user exists and belongs to company
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      include: {
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
    });

    return this.transformUserEntity(user);
  }

  private transformUserEntity(user: UserWithRelations): UserEntity {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      governmentId: user.governmentId,
      avatar: user.avatar,
      isActive: user.isActive,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      ...(user.userRoles && {
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
          description: userRole.role.description,
          permissions: userRole.role.permissions.map(
            (rp) => `${rp.permission.module}:${rp.permission.action}`
          ),
        })),
      }),
    };
  }
}
