import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '57194f4f-bd8c-4b25-b512-7b70c17e74de',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'admin@supplychain.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'System',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Administrator',
  })
  lastName: string;

  @ApiProperty({
    description: 'Company ID the user belongs to',
    example: '7beb5368-e1ae-4677-82f6-cb529c14cb51',
  })
  companyId: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Manufacturing Corp',
  })
  companyName: string;

  @ApiProperty({
    description: 'User roles',
    example: ['Super Admin', 'Branch Manager'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'User permissions',
    example: ['PURCHASE_REQUESTS:CREATE', 'INVENTORY_MANAGEMENT:VIEW'],
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: 'Whether the user is a super admin',
    example: false,
  })
  isSuperAdmin: boolean;

  @ApiProperty({
    description: 'Whether the user has completed onboarding',
    example: false,
  })
  isCompleteOnboarding: boolean;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  isActive: boolean;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'd8c9f01f-cf5d-49f7-a9dd-de9d24c75ab0',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
