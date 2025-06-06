import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsPositive,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateGRItemDto {
  @IsUUID()
  itemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  orderedQty: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  receivedQty: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  qualityNotes?: string;
}

export class CreateGoodsReceiptDto {
  @IsUUID()
  @IsOptional()
  poId?: string;

  @IsUUID()
  @IsOptional()
  mrId?: string;

  @IsDateString()
  @IsOptional()
  receiptDate?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsUUID()
  branchId: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGRItemDto)
  items: CreateGRItemDto[];
}
