import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManufacturingListDto {
  @ApiPropertyOptional({
    description: 'Title or description of the manufacturing list',
    example: 'Weekly production batch for Product A',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Formula ID to be used for production',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsString()
  formulaId: string;

  @ApiProperty({
    description: 'Quantity of finished goods to produce (in using unit)',
    example: 100,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  outputQuantity: number;

  @ApiProperty({
    description: 'Branch where production will take place',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsString()
  branchId: string;

  @ApiPropertyOptional({
    description: 'Planned production date (ISO 8601 format)',
    example: '2025-06-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @ApiPropertyOptional({
    description: 'Additional remarks or production notes',
    example: 'Priority production for urgent order',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export enum MLStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
