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

export class CreateGRItemDto {
  @IsUUID()
  itemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => Number.parseFloat(value))
  orderedQty: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => Number.parseFloat(value))
  receivedQty: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => Number.parseFloat(value))
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
