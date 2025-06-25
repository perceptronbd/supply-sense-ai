import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreatePOItemDto, CreatePurchaseOrderDto } from './create-purchase-order.dto';

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {
  @ApiPropertyOptional({
    description: 'List of items being ordered (optional for updates)',
    type: [CreatePOItemDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required when items are provided' })
  @ArrayMaxSize(100, { message: 'Maximum 100 items allowed per order' })
  @ValidateNested({ each: true })
  @Type(() => CreatePOItemDto)
  items?: CreatePOItemDto[];
}
