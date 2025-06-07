import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateFormulaItemDto {
  @ApiProperty({
    description: 'UUID of the item used in the formula',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({
    description: 'Quantity of the item required',
    example: 2.5,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Additional remarks for the formula item',
    example: 'Must be pre-heated to 80°C',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateFormulaDto {
  @ApiProperty({
    description: 'Name of the formula',
    example: 'Chocolate Cake Mix',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Unique code for the formula',
    example: 'FORM-001',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the formula',
    example: 'Standard chocolate cake formula for commercial production',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Version of the formula',
    example: 'v1.2',
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({
    description: 'Output item ID that this formula produces',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsString()
  outputItem?: string;

  @ApiPropertyOptional({
    description: 'Quantity of output item produced',
    example: 100.0,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  outputQuantity?: number;

  @ApiPropertyOptional({
    description: 'Whether the formula is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'List of items and quantities required for the formula',
    type: [CreateFormulaItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormulaItemDto)
  items: CreateFormulaItemDto[];
}
