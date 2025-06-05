import {
  IsUUID,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsDecimal,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateRFItemDto {
  @IsUUID()
  itemId: string;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  requestedQty: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateRequestFormDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  fromBranchId: string;

  @IsUUID()
  toBranchId: string;

  @IsDateString()
  requiredDate: string;

  @IsUUID()
  @IsOptional()
  rfTemplateId?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRFItemDto)
  items: CreateRFItemDto[];
}
