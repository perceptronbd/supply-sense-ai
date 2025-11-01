import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { TableListDto } from './metadata.dto';

export class UpdateConnectionsDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  businessContext: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @ValidateNested()
  @Type(() => TableListDto)
  tables: TableListDto[];
}
