import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AISuggestionType, SuggestionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAISuggestionDto {
  @ApiProperty({
    description: 'Type of AI suggestion',
    enum: AISuggestionType,
    example: AISuggestionType.STOCK_REORDER,
  })
  @IsEnum(AISuggestionType)
  type: AISuggestionType;

  @ApiProperty({
    description: 'Title of the suggestion',
    example: 'Reorder Required: Steel Pipes',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the suggestion',
    example: 'Stock level (5) is below minimum threshold (20)',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'User ID who will receive this suggestion',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;
  @ApiProperty({
    description: 'Suggestion data in JSON format',
    example: {
      itemId: '123e4567-e89b-12d3-a456-426614174000',
      itemName: 'Steel Pipes',
      currentStock: 5,
      minimumStock: 20,
      recommendedQuantity: 50,
    },
  })
  @IsObject()
  suggestionData: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'AI reasoning for this suggestion',
    example:
      'Current stock level is below the minimum threshold, indicating potential stockout risk',
  })
  @IsString()
  @IsOptional()
  reasoning?: string;

  @ApiPropertyOptional({
    description: 'AI confidence level (0-1)',
    example: 0.85,
  })
  @IsDecimal({ decimal_digits: '0,2' })
  @IsOptional()
  confidence?: number;

  @ApiPropertyOptional({
    description: 'Type of entity this suggestion relates to',
    example: 'Item',
  })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'ID of the related entity',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  entityId?: string;
}

export class UpdateAISuggestionDto {
  @ApiProperty({
    description: 'New status for the suggestion',
    enum: SuggestionStatus,
    example: SuggestionStatus.ACCEPTED,
  })
  @IsEnum(SuggestionStatus)
  status: SuggestionStatus;

  @ApiPropertyOptional({
    description: 'Action taken by the user',
    example: 'Created Purchase Request PR-12345',
  })
  @IsString()
  @IsOptional()
  actionTaken?: string;
}

export class AISuggestionFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by suggestion type',
    enum: AISuggestionType,
    example: AISuggestionType.STOCK_REORDER,
  })
  @IsEnum(AISuggestionType)
  @IsOptional()
  type?: AISuggestionType;

  @ApiPropertyOptional({
    description: 'Filter by suggestion status',
    enum: SuggestionStatus,
    example: SuggestionStatus.PENDING,
  })
  @IsEnum(SuggestionStatus)
  @IsOptional()
  status?: SuggestionStatus;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    example: 'Item',
  })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filter suggestions created after this date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter suggestions created before this date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Number of items to skip for pagination',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({
    description: 'Number of items to take for pagination',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  take?: number;
}

export class AcceptSuggestionDto {
  @ApiPropertyOptional({
    description: 'Additional notes for accepting the suggestion',
    example: 'Approved for immediate implementation',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether to auto-implement the suggestion',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  autoImplement?: boolean = true;
}

export class RejectSuggestionDto {
  @ApiProperty({
    description: 'Reason for rejecting the suggestion',
    example: 'Budget constraints prevent implementation',
  })
  @IsString()
  reason: string;
}

export class GenerateSuggestionsDto {
  @ApiProperty({
    description: 'Branch ID to generate suggestions for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    description: 'Types of suggestions to generate',
    enum: AISuggestionType,
    isArray: true,
    example: [AISuggestionType.STOCK_REORDER, AISuggestionType.TRANSFER_REQUEST],
  })
  @IsEnum(AISuggestionType, { each: true })
  @IsOptional()
  suggestionTypes?: AISuggestionType[];

  @ApiPropertyOptional({
    description: 'Maximum number of suggestions to generate',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  maxSuggestions?: number = 10;
}

export class BulkUpdateSuggestionsDto {
  @ApiProperty({
    description: 'Array of suggestion IDs to update',
    example: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51d4-43f2-b567-789012345678'],
  })
  @IsUUID(4, { each: true })
  suggestionIds: string[];

  @ApiProperty({
    description: 'New status to apply to all suggestions',
    enum: SuggestionStatus,
    example: SuggestionStatus.REJECTED,
  })
  @IsEnum(SuggestionStatus)
  status: SuggestionStatus;

  @ApiPropertyOptional({
    description: 'Action taken for all suggestions',
    example: 'Bulk rejected due to budget constraints',
  })
  @IsString()
  @IsOptional()
  actionTaken?: string;
}
