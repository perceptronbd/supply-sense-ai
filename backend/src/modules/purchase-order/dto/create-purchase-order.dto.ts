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

export class CreatePOItemDto {
  @IsUUID()
  itemId: string;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  orderedQty: number;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  unitPrice: number;

  @IsDateString()
  deliveryDate: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsUUID()
  @IsOptional()
  prId?: string;

  @IsUUID()
  supplierId: string;

  @IsDateString()
  expectedDeliveryDate: string;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsString()
  @IsOptional()
  deliveryTerms?: string;

  @IsUUID()
  branchId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePOItemDto)
  items: CreatePOItemDto[];
}
