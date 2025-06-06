import {
  IsUUID,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRFItemDto {
  @ApiProperty({
    description: 'The unique identifier of the item being requested',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  itemId: string;

  @ApiProperty({
    description: 'Requested quantity in transfer unit',
    example: 50,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  requestedQty: number;

  @ApiPropertyOptional({
    description: 'Additional remarks or notes for the requested item',
    example: 'Urgent requirement for new project',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateRequestFormDto {
  @ApiPropertyOptional({
    description: 'Title or subject of the request form',
    example: 'Monthly inventory request for Branch B',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the request',
    example: 'Requesting materials for upcoming production schedule',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Source branch ID (requesting branch)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID()
  fromBranchId: string;

  @ApiProperty({
    description: 'Destination branch ID (branch that will fulfill the request)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsUUID()
  toBranchId: string;

  @ApiProperty({
    description: 'Required delivery date (ISO 8601 format)',
    example: '2025-06-20',
    format: 'date',
  })
  @IsDateString()
  requiredDate: string;

  @ApiPropertyOptional({
    description: 'Template ID to pre-populate common items',
    example: '550e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  rfTemplateId?: string;

  @ApiPropertyOptional({
    description: 'Reason or justification for the request',
    example: 'Stock replenishment for increased demand',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({
    description: 'List of items being requested',
    type: [CreateRFItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRFItemDto)
  items: CreateRFItemDto[];
}
