import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Steel Rod 10mm',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Stock Keeping Unit (SKU) - must be unique',
    example: 'STEEL-ROD-10MM',
  })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'High-grade steel rod with 10mm diameter',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Main unit for storage',
    example: 'kg',
  })
  @IsNotEmpty()
  @IsString()
  mainUnit: string;

  @ApiProperty({
    description: 'Unit used for purchasing',
    example: 'ton',
  })
  @IsNotEmpty()
  @IsString()
  buyingUnit: string;

  @ApiProperty({
    description: 'Unit used for transfers',
    example: 'kg',
  })
  @IsNotEmpty()
  @IsString()
  transferUnit: string;

  @ApiProperty({
    description: 'Unit used for production',
    example: 'kg',
  })
  @IsNotEmpty()
  @IsString()
  usingUnit: string;

  @ApiPropertyOptional({
    description: 'Conversion rate: 1 buying unit = X main units',
    example: 1000,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  buyingToMainRate?: number;

  @ApiPropertyOptional({
    description: 'Conversion rate: 1 transfer unit = X main units',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  transferToMainRate?: number;

  @ApiPropertyOptional({
    description: 'Conversion rate: 1 using unit = X main units',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  usingToMainRate?: number;

  @ApiPropertyOptional({
    description: 'Safety stock level in main units',
    example: 100,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  safetyStockLevel?: number;

  @ApiPropertyOptional({
    description: 'Reorder level in main units',
    example: 50,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({
    description: 'Whether the item is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
