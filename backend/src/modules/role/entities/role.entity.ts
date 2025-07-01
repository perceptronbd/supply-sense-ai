import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionEntity {
  @ApiProperty({
    description: 'Permission ID',
    example: 'permission-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Permission module',
    example: 'USERS',
  })
  module: string;

  @ApiProperty({
    description: 'Permission action',
    example: 'CREATE',
  })
  action: string;

  @ApiProperty({
    description: 'Permission string',
    example: 'USERS:CREATE',
  })
  permission: string;

  @ApiPropertyOptional({
    description: 'Permission description',
    example: 'Create new users',
  })
  description?: string;
}

export class RoleEntity {
  @ApiProperty({
    description: 'Role ID',
    example: 'role-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Role name',
    example: 'Branch Manager',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Manages branch operations and staff',
  })
  description?: string;

  @ApiProperty({
    description: 'Whether the role is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Role creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Role last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Role permissions',
    type: [PermissionEntity],
  })
  permissions: PermissionEntity[];

  @ApiPropertyOptional({
    description: 'Number of users with this role',
    example: 5,
  })
  userCount?: number;
}

export class PaginatedRolesEntity {
  @ApiProperty({
    description: 'Array of roles',
    type: [RoleEntity],
  })
  data: RoleEntity[];

  @ApiPropertyOptional({
    description: 'Pagination information',
    type: 'object',
    properties: {
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 10 },
      total: { type: 'number', example: 50 },
      totalPages: { type: 'number', example: 5 },
      hasNext: { type: 'boolean', example: true },
      hasPrev: { type: 'boolean', example: false },
    },
  })
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
