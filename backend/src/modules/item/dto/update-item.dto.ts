import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateItemDto {
  @ApiPropertyOptional({
    description: 'Item name',
    example: 'Steel Rod 10mm',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Stock Keeping Unit (SKU) - must be unique',
    example: 'STEEL-ROD-10MM',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'High-grade steel rod with 10mm diameter',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Main unit for storage',
    example: 'kg',
  })
  @IsOptional()
  @IsString()
  mainUnit?: string;

  @ApiPropertyOptional({
    description: 'Unit used for purchasing',
    example: 'ton',
  })
  @IsOptional()
  @IsString()
  buyingUnit?: string;

  @ApiPropertyOptional({
    description: 'Unit used for transfers',
    example: 'kg',
  })
  @IsOptional()
  @IsString()
  transferUnit?: string;

  @ApiPropertyOptional({
    description: 'Unit used for production',
    example: 'kg',
  })
  @IsOptional()
  @IsString()
  usingUnit?: string;

  @ApiPropertyOptional({
    description: 'Conversion rate: 1 buying unit = X main units',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  buyingToMainRate?: number;

  @ApiPropertyOptional({
    description: 'Conversion rate: 1 transfer unit = X main units',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  transferToMainRate?: number;

  @ApiPropertyOptional({
    description: 'Conversion rate: 1 using unit = X main units',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  usingToMainRate?: number;

  @ApiPropertyOptional({
    description: 'Safety stock level in main units',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  safetyStockLevel?: number;

  @ApiPropertyOptional({
    description: 'Reorder level in main units',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({
    description: 'Whether the item is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
