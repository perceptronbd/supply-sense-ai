import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name (unique per company)',
    example: 'Branch Manager',
  })
  @IsString()
  @MinLength(1, { message: 'Role name is required' })
  @MaxLength(100, { message: 'Role name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Manages branch operations and staff',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to the role (at least one required)',
    example: ['permission-uuid-1', 'permission-uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one permission must be assigned' })
  @IsUUID('4', { each: true, message: 'Each permission ID must be a valid UUID' })
  permissionIds: string[];
}
