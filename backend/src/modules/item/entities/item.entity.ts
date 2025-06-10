import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class StockEntity {
  @ApiProperty({
    description: 'Available quantity in main unit',
    example: 100.5,
  })
  quantity: Decimal;

  @ApiProperty({
    description: 'Reserved quantity in main unit',
    example: 10.0,
  })
  reservedQty: Decimal;

  @ApiProperty({
    description: 'Available quantity (quantity - reservedQty) in main unit',
    example: 90.5,
  })
  availableQty: Decimal;

  @ApiProperty({
    description: 'Average cost per main unit',
    example: 25.5,
  })
  averageCost: Decimal;

  @ApiProperty({
    description: 'Last purchase cost per main unit',
    example: 26.0,
  })
  lastCost: Decimal;
}

export class ItemEntity {
  @ApiProperty({
    description: 'Unique identifier for the item',
    example: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Steel Rod 10mm',
  })
  name: string;

  @ApiProperty({
    description: 'Stock Keeping Unit (SKU)',
    example: 'STEEL-ROD-10MM',
  })
  sku: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'High quality steel rod for construction',
  })
  description?: string;

  @ApiProperty({
    description: 'Main unit for storage',
    example: 'kg',
  })
  mainUnit: string;

  @ApiProperty({
    description: 'Unit used for purchasing',
    example: 'ton',
  })
  buyingUnit: string;

  @ApiProperty({
    description: 'Unit used for transfers',
    example: 'kg',
  })
  transferUnit: string;

  @ApiProperty({
    description: 'Unit used for production',
    example: 'kg',
  })
  usingUnit: string;

  @ApiProperty({
    description: 'Conversion rate: 1 buying unit = X main units',
    example: 1000,
  })
  buyingToMainRate: Decimal;

  @ApiProperty({
    description: 'Conversion rate: 1 transfer unit = X main units',
    example: 1,
  })
  transferToMainRate: Decimal;

  @ApiProperty({
    description: 'Conversion rate: 1 using unit = X main units',
    example: 1,
  })
  usingToMainRate: Decimal;

  @ApiProperty({
    description: 'Safety stock level in main units',
    example: 50,
  })
  safetyStockLevel: Decimal;

  @ApiProperty({
    description: 'Reorder level in main units',
    example: 100,
  })
  reorderLevel: Decimal;

  @ApiProperty({
    description: 'Whether the item is active',
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

  @ApiPropertyOptional({
    description: 'Stock information for the requested branch',
    type: StockEntity,
  })
  stock?: StockEntity;
}
