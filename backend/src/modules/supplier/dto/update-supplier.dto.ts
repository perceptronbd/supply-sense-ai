import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Allow,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateSupplierDto {
  @ApiPropertyOptional({
    description: 'Supplier name',
    example: 'Premium Materials Inc.',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Supplier code - must be unique',
    example: 'SUP001',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Contact person name',
    example: 'John Smith',
  })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({
    description: 'Supplier email address',
    example: 'orders@premiummaterials.com',
  })
  @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== '')
  @IsEmail({}, { message: 'email must be a valid email address' })
  @ValidateIf((o) => o.email === undefined || o.email === null || o.email === '')
  @Allow()
  email?: string;

  @ApiPropertyOptional({
    description: 'Supplier phone number',
    example: '+1-555-2001',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Supplier address',
    example: '100 Supplier Street, Industrial Park',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Average lead time in days',
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  averageLeadTime?: number;

  @ApiPropertyOptional({
    description: 'Whether the supplier is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
