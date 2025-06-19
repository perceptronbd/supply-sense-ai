import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateBranchDto {
  @ApiPropertyOptional({
    description: 'Branch name',
    example: 'Main Branch',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Branch code - must be unique',
    example: 'MAIN001',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Branch address',
    example: '123 Main Street, City, State 12345',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Branch phone number',
    example: '+1-555-0123',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.phone !== undefined && o.phone !== '')
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Branch email address',
    example: 'main@company.com',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.email !== undefined && o.email !== '')
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Whether the branch is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
