import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export enum MRType {
  TRANSFER = 'TRANSFER',
  TRIM_WASTE = 'TRIM_WASTE',
}

export class CreateMRItemDto {
  @ApiProperty({
    description: 'The unique identifier of the item',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  itemId: string;

  @ApiProperty({
    description:
      'Quantity of the item (in transfer unit for TRANSFER type, in main unit for TRIM_WASTE type)',
    example: 100,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => Number.parseFloat(value))
  quantity: number;

  @ApiPropertyOptional({
    description: 'Type of waste for TRIM_WASTE material requisitions',
    example: 'TRIM',
    enum: ['TRIM', 'WASTE', 'DAMAGE'],
  })
  @IsString()
  @IsOptional()
  wasteType?: string; // "TRIM", "WASTE", "DAMAGE"

  @ApiPropertyOptional({
    description: 'Additional remarks or notes for the item',
    example: 'Handle with care - fragile items',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateMaterialRequisitionDto {
  @ApiPropertyOptional({
    description: 'Title or description of the material requisition',
    example: 'Monthly material transfer to Branch B',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Reference to the source Request Form ID (when creating MR from RF)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  rfId?: string;

  @ApiProperty({
    description: 'Type of material requisition',
    example: MRType.TRANSFER,
    enum: MRType,
  })
  @IsEnum(MRType)
  type: MRType;

  @ApiPropertyOptional({
    description: 'Source branch ID (required for TRANSFER type)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  fromBranchId?: string;

  @ApiPropertyOptional({
    description: 'Destination branch ID (required for TRANSFER type)',
    example: '550e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  toBranchId?: string;

  @ApiPropertyOptional({
    description: 'Branch ID (required for TRIM_WASTE type)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string; // For TRIM_WASTE type

  @ApiPropertyOptional({
    description: 'Scheduled transfer date (ISO 8601 format)',
    example: '2025-06-15',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  transferDate?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or instructions',
    example: 'Urgent transfer required for production schedule',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'List of items to be requisitioned',
    type: [CreateMRItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMRItemDto)
  items: CreateMRItemDto[];
}
