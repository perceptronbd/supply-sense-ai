import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreatePOItemDto {
  @ApiProperty({
    description: 'UUID of the item being ordered',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  itemId: string;

  @ApiProperty({
    description: 'Ordered quantity of the item',
    example: 15.0,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => Number.parseFloat(value))
  orderedQty: number;

  @ApiProperty({
    description: 'Unit price of the item',
    example: 29.99,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => Number.parseFloat(value))
  unitPrice: number;

  @ApiProperty({
    description: 'Expected delivery date for the item in ISO 8601 format',
    example: '2024-03-25T10:00:00Z',
  })
  @IsDateString()
  deliveryDate: string;

  @ApiPropertyOptional({
    description: 'Additional remarks for the item',
    example: 'Handle with care',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({
    description: 'Title of the purchase order',
    example: 'Monthly Raw Materials Order',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'UUID of the related purchase request',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  @IsOptional()
  prId?: string;

  @ApiProperty({
    description: 'UUID of the supplier',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID()
  supplierId: string;

  @ApiProperty({
    description: 'Expected delivery date in ISO 8601 format',
    example: '2024-03-30T10:00:00Z',
  })
  @IsDateString()
  expectedDeliveryDate: string;

  @ApiPropertyOptional({
    description: 'Payment terms for the order',
    example: 'Net 30 days',
  })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({
    description: 'Delivery terms for the order',
    example: 'FOB Origin',
  })
  @IsString()
  @IsOptional()
  deliveryTerms?: string;

  @ApiProperty({
    description: 'UUID of the branch making the order',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the order',
    example: 'Urgent delivery required',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'List of items being ordered',
    type: [CreatePOItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePOItemDto)
  items: CreatePOItemDto[];
}
