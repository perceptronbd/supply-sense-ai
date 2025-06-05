import {
  IsUUID,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsDecimal,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum MRType {
  TRANSFER = 'TRANSFER',
  TRIM_WASTE = 'TRIM_WASTE',
}

export class CreateMRItemDto {
  @IsUUID()
  itemId: string;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  quantity: number;

  @IsString()
  @IsOptional()
  wasteType?: string; // "TRIM", "WASTE", "DAMAGE"

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateMaterialRequisitionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsUUID()
  @IsOptional()
  rfId?: string;

  @IsEnum(MRType)
  type: MRType;

  @IsUUID()
  @IsOptional()
  fromBranchId?: string;

  @IsUUID()
  @IsOptional()
  toBranchId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string; // For TRIM_WASTE type

  @IsDateString()
  @IsOptional()
  transferDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMRItemDto)
  items: CreateMRItemDto[];
}
