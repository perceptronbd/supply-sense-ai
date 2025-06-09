import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export enum ForecastPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export class DemandForecastDto {
  @ApiProperty({ description: 'Item ID to forecast demand for' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Branch ID for location-specific forecast' })
  @IsString()
  branchId: string;

  @ApiProperty({ description: 'Forecast period', enum: ForecastPeriod })
  @IsEnum(ForecastPeriod)
  period: ForecastPeriod;

  @ApiProperty({ description: 'Number of periods to forecast', default: 12 })
  @IsNumber()
  @IsOptional()
  periods?: number = 12;
}

export class PurchaseOptimizationDto {
  @ApiProperty({ description: 'Array of item IDs to optimize' })
  @IsArray()
  @IsString({ each: true })
  itemIds: string[];

  @ApiProperty({ description: 'Branch ID for optimization' })
  @IsString()
  branchId: string;

  @ApiProperty({ description: 'Budget constraint', required: false })
  @IsNumber()
  @IsOptional()
  budgetLimit?: number;
}

export class QualityAnalysisDto {
  @ApiProperty({ description: 'Goods Receipt ID to analyze' })
  @IsString()
  goodsReceiptId: string;

  @ApiProperty({ description: 'Include supplier analysis', default: true })
  @IsOptional()
  includeSupplierAnalysis?: boolean = true;
}

export class StockPredictionDto {
  @ApiProperty({ description: 'Branch ID for stock prediction' })
  @IsString()
  branchId: string;

  @ApiProperty({ description: 'Days ahead to predict', default: 30 })
  @IsNumber()
  @IsOptional()
  daysAhead?: number = 30;

  @ApiProperty({ description: 'Specific item IDs to analyze', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  itemIds?: string[];
}

export class AutoApprovalDto {
  @ApiProperty({ description: 'Document ID (PR or PO)' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Document type' })
  @IsEnum(['PR', 'PO'])
  documentType: 'PR' | 'PO';
}

export class POItemDto {
  @ApiProperty({ description: 'Purchase order item ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Item ID' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Current order quantity' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ description: 'Item description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class OptimizeQuantitiesDto {
  @ApiProperty({
    description: 'Array of PO items to optimize',
    type: [POItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POItemDto)
  poItems: POItemDto[];
}

export class SmartRoutingDto {
  @ApiProperty({
    description: 'Type of document to route',
    enum: ['PR', 'PO', 'GR'],
    example: 'PR',
  })
  @IsEnum(['PR', 'PO', 'GR'])
  documentType: 'PR' | 'PO' | 'GR';

  @ApiProperty({
    description: 'ID of the document to route',
    example: 'uuid-string',
  })
  @IsString()
  documentId: string;
}
