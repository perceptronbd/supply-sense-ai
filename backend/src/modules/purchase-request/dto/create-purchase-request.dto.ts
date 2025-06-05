import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsDecimal,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreatePRItemDto {
  @IsUUID()
  itemId: string;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  requestedQty: number;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  estimatedPrice?: number;

  @IsDateString()
  requiredDate: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreatePurchaseRequestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  requiredDate: string;

  @IsUUID()
  branchId: string;

  @IsUUID()
  @IsOptional()
  prTemplateId?: string;

  @IsString()
  @IsOptional()
  justification?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePRItemDto)
  items: CreatePRItemDto[];
}
