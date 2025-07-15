import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

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
