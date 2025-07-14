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
  dbConnectionId: string;

  @ValidateNested()
  @Type(() => TableListDto)
  tables: TableListDto[];
}

export class TableMetadataDto {
  @IsString()
  @IsNotEmpty({ message: 'Company ID is required' })
  companyId: string;

  @IsString()
  @IsNotEmpty({ message: 'Database connection ID is required' })
  dbConnectionId: string;

  @IsString()
  @IsNotEmpty({ message: 'Table name is required' })
  tableName: string;

  @IsString()
  @IsNotEmpty({ message: 'Friendly label is required' })
  friendlyLabel: string;

  @IsString()
  @IsNotEmpty({ message: 'Purpose is required' })
  purpose: string;

  @IsString()
  @IsNotEmpty({ message: 'Update frequency is required' })
  updateFrequency: string;

  @IsString()
  @IsNotEmpty({ message: 'Data sensitivity is required' })
  dataSensitivity: string;

  @IsString({ each: true })
  @IsNotEmpty({ message: 'Sample questions are required' })
  sampleQuestions: string[];
}
