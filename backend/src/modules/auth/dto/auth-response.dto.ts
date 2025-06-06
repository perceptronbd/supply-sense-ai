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
    description: 'User role',
    example: 'SYSTEM_ADMIN',
    enum: [
      'SYSTEM_ADMIN',
      'BRANCH_MANAGER',
      'PROCUREMENT_SPECIALIST',
      'INVENTORY_CLERK',
    ],
  })
  role: string;

  @ApiProperty({
    description: 'Branch ID the user belongs to',
    example: '7beb5368-e1ae-4677-82f6-cb529c14cb51',
  })
  branchId: string;

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
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
