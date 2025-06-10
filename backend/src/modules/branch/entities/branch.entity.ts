import { ApiProperty } from '@nestjs/swagger';

export class BranchEntity {
  @ApiProperty({
    description: 'Unique identifier for the branch',
    example: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Branch name',
    example: 'Main Branch',
  })
  name: string;

  @ApiProperty({
    description: 'Branch code',
    example: 'MAIN001',
  })
  code: string;

  @ApiProperty({
    description: 'Branch address',
    example: '123 Main Street, City',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Branch phone number',
    example: '+1234567890',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Branch email',
    example: 'main@company.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Whether the branch is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
