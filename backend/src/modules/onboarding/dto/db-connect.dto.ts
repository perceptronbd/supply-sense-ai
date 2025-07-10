import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DbCredentialsDto {
  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  database: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsBoolean()
  @IsOptional()
  sslEnabled?: boolean = false;

  @IsString()
  @IsOptional()
  title?: string;
}

export class TestConnectionDto {
  @ValidateNested()
  @Type(() => DbCredentialsDto)
  credentials: DbCredentialsDto;
}

export class SaveDbConnectionDto {
  @IsString()
  companyId: string;

  @ValidateNested()
  @Type(() => DbCredentialsDto)
  credentials: DbCredentialsDto;
}

export class GetTablesDto {
  @IsString()
  companyId: string;
}

class TableListDto {
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;
}
export class CaptureMetadataDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  connectionId: string;

  @ValidateNested()
  @Type(() => TableListDto)
  tables: TableListDto[];
}
