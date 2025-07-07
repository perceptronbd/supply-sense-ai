import { PrismaService } from '@app/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionEntity, RoleEntity } from './entities/role.entity';

// Type definitions for Prisma query results with relations
interface RoleWithRelations {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{
    permission: {
      id: string;
      module: string;
      action: string;
      description: string;
    };
  }>;
  _count?: {
    userRoles: number;
  };
}

@Injectable()
export class RoleService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto, companyId: string): Promise<RoleEntity> {
    // Check if role name already exists in the same company
    const existingRole = await this.prisma.role.findFirst({
      where: {
        name: createRoleDto.name,
        companyId,
      },
    });

    if (existingRole) {
      throw new ConflictException('Role name already exists in this company');
    }

    // Validate that all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: createRoleDto.permissionIds },
      },
    });

    if (permissions.length !== createRoleDto.permissionIds.length) {
      throw new BadRequestException('One or more permissions not found');
    }

    // Create role with permissions
    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        companyId,
        permissions: {
          create: createRoleDto.permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    return this.transformRoleEntity(role);
  }

  async findAll(companyId: string): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return roles.map((role) => this.transformRoleEntity(role));
  }

  async findOne(id: string, companyId: string): Promise<RoleEntity> {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.transformRoleEntity(role);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, companyId: string): Promise<RoleEntity> {
    // Check if role exists and belongs to company
    const existingRole = await this.prisma.role.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    // Check name uniqueness if name is being updated
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const duplicateRole = await this.prisma.role.findFirst({
        where: {
          name: updateRoleDto.name,
          companyId,
          id: { not: id },
        },
      });

      if (duplicateRole) {
        throw new ConflictException('Role name already exists in this company');
      }
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    return this.transformRoleEntity(role);
  }

  async assignPermissions(
    id: string,
    assignPermissionsDto: AssignPermissionsDto,
    companyId: string
  ): Promise<RoleEntity> {
    // Check if role exists and belongs to company
    const existingRole = await this.prisma.role.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    // Validate that all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: assignPermissionsDto.permissionIds },
      },
    });

    if (permissions.length !== assignPermissionsDto.permissionIds.length) {
      throw new BadRequestException('One or more permissions not found');
    }

    // Perform the action based on the request (Discord-like permission management)
    switch (assignPermissionsDto.action) {
      case 'assign': {
        // Add new permissions (avoid duplicates)
        const existingPermissionIds = await this.prisma.rolePermission
          .findMany({
            where: { roleId: id },
            select: { permissionId: true },
          })
          .then((rolePermissions) => rolePermissions.map((rp) => rp.permissionId));

        const newPermissionIds = assignPermissionsDto.permissionIds.filter(
          (permissionId) => !existingPermissionIds.includes(permissionId)
        );

        if (newPermissionIds.length > 0) {
          await this.prisma.rolePermission.createMany({
            data: newPermissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
        break;
      }

      case 'remove': {
        // Check that role will still have at least one permission after removal
        const currentPermissions = await this.prisma.rolePermission.findMany({
          where: { roleId: id },
        });

        const remainingPermissions = currentPermissions.filter(
          (rolePermission) =>
            !assignPermissionsDto.permissionIds.includes(rolePermission.permissionId)
        );

        if (remainingPermissions.length === 0) {
          throw new BadRequestException('Role must have at least one permission');
        }

        await this.prisma.rolePermission.deleteMany({
          where: {
            roleId: id,
            permissionId: { in: assignPermissionsDto.permissionIds },
          },
        });
        break;
      }

      case 'replace': {
        // Replace all permissions with new ones (Discord-style complete permission replacement)
        await this.prisma.rolePermission.deleteMany({
          where: { roleId: id },
        });

        await this.prisma.rolePermission.createMany({
          data: assignPermissionsDto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
        break;
      }
    }

    // Return updated role
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<RoleEntity> {
    // Check if role exists and belongs to company
    const existingRole = await this.prisma.role.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    // Check if role is assigned to any users
    if (existingRole._count.userRoles > 0) {
      throw new ForbiddenException(
        `Cannot delete role that is assigned to ${existingRole._count.userRoles} user(s). Remove users from this role first.`
      );
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: { isActive: false },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    return this.transformRoleEntity(role);
  }

  async activate(id: string, companyId: string): Promise<RoleEntity> {
    // Check if role exists and belongs to company
    const existingRole = await this.prisma.role.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    return this.transformRoleEntity(role);
  }

  async getAllPermissions(): Promise<PermissionEntity[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return permissions.map((permission) => ({
      id: permission.id,
      module: permission.module,
      action: permission.action,
      permission: `${permission.module}:${permission.action}`,
      description: permission.description,
    }));
  }

  async getPermissionsByModule(): Promise<Record<string, PermissionEntity[]>> {
    const permissions = await this.getAllPermissions();

    return permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      },
      {} as Record<string, PermissionEntity[]>
    );
  }

  private transformRoleEntity(role: RoleWithRelations): RoleEntity {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        permission: `${rp.permission.module}:${rp.permission.action}`,
        description: rp.permission.description,
      })),
      userCount: role._count?.userRoles || 0,
    };
  }
}
