import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateItemDto {
  @ApiProperty({
    description: 'Item name - should be descriptive and unique within company',
    example: 'Steel Rod 10mm',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description:
      'Stock Keeping Unit (SKU) - must be unique within company, alphanumeric with hyphens/underscores only',
    example: 'STEEL-ROD-10MM',
    pattern: '^[A-Z0-9_-]+$',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'SKU must contain only uppercase letters, numbers, hyphens, and underscores',
  })
  sku: string;

  @ApiPropertyOptional({
    description: 'Detailed item description for better identification',
    example: 'High-grade steel rod with 10mm diameter, suitable for construction and manufacturing',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Main unit for storage - this is the base unit for all stock calculations (FR-3)',
    example: 'kg',
    examples: ['kg', 'pieces', 'liters', 'meters', 'tons'],
  })
  @IsNotEmpty()
  @IsString()
  mainUnit: string;

  @ApiProperty({
    description: 'Unit used for purchasing from suppliers',
    example: 'ton',
    examples: ['ton', 'box', 'pallet', 'roll'],
  })
  @IsNotEmpty()
  @IsString()
  buyingUnit: string;

  @ApiProperty({
    description: 'Unit used for inter-branch transfers',
    example: 'kg',
    examples: ['kg', 'pieces', 'box', 'bundle'],
  })
  @IsNotEmpty()
  @IsString()
  transferUnit: string;

  @ApiProperty({
    description: 'Unit used for production and manufacturing',
    example: 'kg',
    examples: ['kg', 'pieces', 'liters', 'grams'],
  })
  @IsNotEmpty()
  @IsString()
  usingUnit: string;

  @ApiPropertyOptional({
    description: 'Conversion rate: 1 buying unit = X main units (FR-2)',
    example: 1000,
    default: 1,
    minimum: 0.000001,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001, { message: 'Buying to main rate must be greater than 0' })
  buyingToMainRate?: number;

  @ApiPropertyOptional({
    description: 'Conversion rate: 1 transfer unit = X main units (FR-2)',
    example: 1,
    default: 1,
    minimum: 0.000001,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001, { message: 'Transfer to main rate must be greater than 0' })
  transferToMainRate?: number;

  @ApiPropertyOptional({
    description: 'Conversion rate: 1 using unit = X main units (FR-2)',
    example: 1,
    default: 1,
    minimum: 0.000001,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001, { message: 'Using to main rate must be greater than 0' })
  usingToMainRate?: number;

  @ApiPropertyOptional({
    description:
      'Safety stock level in main units - triggers AI alerts when stock falls below this level (FR-9)',
    example: 100,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0, { message: 'Safety stock level cannot be negative' })
  safetyStockLevel?: number;

  @ApiPropertyOptional({
    description: 'Reorder level in main units - recommended reorder point for this item',
    example: 50,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0, { message: 'Reorder level cannot be negative' })
  reorderLevel?: number;

  @ApiPropertyOptional({
    description: 'Whether the item is active and available for transactions',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
