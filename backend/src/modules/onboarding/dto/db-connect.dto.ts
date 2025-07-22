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

export class SaveDbConnectionDto {
  @IsString()
  companyId: string;

  @ValidateNested()
  @Type(() => DbCredentialsDto)
  credentials: DbCredentialsDto;
}

export class GetTablesDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsOptional()
  dbConnectionId?: string;
}
