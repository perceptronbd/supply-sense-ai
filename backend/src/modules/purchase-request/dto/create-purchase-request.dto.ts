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

export class CreatePRItemDto {
  @ApiProperty({
    description: 'UUID of the item being requested',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  itemId: string;

  @ApiProperty({
    description: 'Requested quantity of the item',
    example: 10.5,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => Number.parseFloat(value))
  requestedQty: number;

  @ApiPropertyOptional({
    description: 'Estimated price per unit',
    example: 25.99,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => Number.parseFloat(value))
  @IsOptional()
  estimatedPrice?: number;

  @ApiProperty({
    description: 'Required date for the item in ISO 8601 format',
    example: '2024-03-15T10:00:00Z',
  })
  @IsDateString()
  requiredDate: string;

  @ApiPropertyOptional({
    description: 'Additional remarks for the item',
    example: 'Urgent requirement for production',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreatePurchaseRequestDto {
  @ApiPropertyOptional({
    description: 'Title of the purchase request',
    example: 'Raw Materials for Production Line A',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the purchase request',
    example: 'Monthly requirement for raw materials to support production',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Required date for the purchase request in ISO 8601 format',
    example: '2024-03-20T10:00:00Z',
  })
  @IsDateString()
  requiredDate: string;

  @ApiProperty({
    description: 'UUID of the branch making the request',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    description: 'UUID of the purchase request template to use',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID()
  @IsOptional()
  prTemplateId?: string;

  @ApiPropertyOptional({
    description: 'Justification for the purchase request',
    example: 'Critical for maintaining production schedule',
  })
  @IsString()
  @IsOptional()
  justification?: string;

  @ApiProperty({
    description: 'List of items being requested',
    type: [CreatePRItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePRItemDto)
  items: CreatePRItemDto[];
}
