import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
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
}

export class SaveDbConnectionDto {
  @IsString()
  companyId: string;

  @ValidateIf((o) => !o.connectionString)
  @IsOptional()
  @ValidateNested()
  @Type(() => DbCredentialsDto)
  credentials?: DbCredentialsDto;

  @ValidateIf((o) => !o.credentials)
  @IsString()
  @IsOptional()
  connectionString?: string;

  @IsString()
  @IsNotEmpty()
  businessContext: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}

export class GetTablesDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsOptional()
  dbConnectionId: string;
}
