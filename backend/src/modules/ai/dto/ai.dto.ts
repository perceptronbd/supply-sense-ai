import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export enum ForecastPeriod {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
}

export class DemandForecastDto {
  @ApiProperty({ description: "Item ID to forecast demand for" })
  @IsString()
  itemId: string;

  @ApiProperty({ description: "Branch ID for location-specific forecast" })
  @IsString()
  branchId: string;

  @ApiProperty({ description: "Forecast period", enum: ForecastPeriod })
  @IsEnum(ForecastPeriod)
  period: ForecastPeriod;

  @ApiProperty({ description: "Number of periods to forecast", default: 12 })
  @IsNumber()
  @IsOptional()
  periods?: number = 12;
}

export class PurchaseOptimizationDto {
  @ApiProperty({ description: "Array of item IDs to optimize" })
  @IsArray()
  @IsString({ each: true })
  itemIds: string[];

  @ApiProperty({ description: "Branch ID for optimization" })
  @IsString()
  branchId: string;

  @ApiProperty({ description: "Budget constraint", required: false })
  @IsNumber()
  @IsOptional()
  budgetLimit?: number;
}

export class QualityAnalysisDto {
  @ApiProperty({ description: "Goods Receipt ID to analyze" })
  @IsString()
  goodsReceiptId: string;

  @ApiProperty({ description: "Include supplier analysis", default: true })
  @IsOptional()
  includeSupplierAnalysis?: boolean = true;
}

export class StockPredictionDto {
  @ApiProperty({ description: "Branch ID for stock prediction" })
  @IsString()
  branchId: string;

  @ApiProperty({ description: "Days ahead to predict", default: 30 })
  @IsNumber()
  @IsOptional()
  daysAhead?: number = 30;

  @ApiProperty({ description: "Specific item IDs to analyze", required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  itemIds?: string[];
}

export class AutoApprovalDto {
  @ApiProperty({ description: "Document ID (PR or PO)" })
  @IsString()
  documentId: string;

  @ApiProperty({ description: "Document type" })
  @IsEnum(["PR", "PO"])
  documentType: "PR" | "PO";
}
