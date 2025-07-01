import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Role name (unique per company)',
    example: 'Branch Manager',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Role name cannot be empty' })
  @MaxLength(100, { message: 'Role name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Manages branch operations and staff',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the role is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
