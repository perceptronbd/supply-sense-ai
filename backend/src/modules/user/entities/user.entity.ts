import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    description: 'Role permissions',
    example: ['USERS:READ', 'ITEMS:CREATE', 'PURCHASE_REQUESTS:APPROVE'],
    type: [String],
  })
  permissions: string[];
}

export class BranchEntity {
  @ApiProperty({
    description: 'Branch ID',
    example: 'branch-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Branch name',
    example: 'Main Office',
  })
  name: string;

  @ApiProperty({
    description: 'Branch code',
    example: 'HQ',
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Branch address',
    example: '123 Main St, City, Country',
  })
  address?: string;

  @ApiProperty({
    description: 'Whether this is the headquarters branch',
    example: true,
  })
  isHQ: boolean;
}

export class UserEntity {
  @ApiProperty({
    description: 'User ID',
    example: 'user-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@company.com',
  })
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'john.doe',
  })
  username: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Government ID or employee ID',
    example: 'EMP001',
  })
  governmentId?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string;

  @ApiProperty({
    description: 'Whether the user is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the user is a super admin',
    example: false,
  })
  isSuperAdmin: boolean;

  @ApiProperty({
    description: 'User creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'User last login date',
    example: '2024-01-01T00:00:00.000Z',
  })
  lastLogin?: Date;

  @ApiPropertyOptional({
    description: 'User roles (if included in query)',
    type: [RoleEntity],
  })
  roles?: RoleEntity[];

  @ApiPropertyOptional({
    description: 'User branches (if included in query)',
    type: [BranchEntity],
  })
  branches?: BranchEntity[];
}

export class PaginatedUsersEntity {
  @ApiProperty({
    description: 'Array of users',
    type: [UserEntity],
  })
  data: UserEntity[];

  @ApiPropertyOptional({
    description: 'Pagination information',
    type: 'object',
    properties: {
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 10 },
      total: { type: 'number', example: 100 },
      totalPages: { type: 'number', example: 10 },
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
