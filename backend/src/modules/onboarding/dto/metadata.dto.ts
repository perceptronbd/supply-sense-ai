import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

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

export class BatchSaveMetadataDto {
  @IsString()
  @IsNotEmpty({ message: 'Database connection ID is required' })
  dbConnectionId: string;

  @ValidateNested({ each: true })
  @Type(() => TableMetadataDto)
  tableMetadata: Omit<TableMetadataDto, 'dbConnectionId'>[];
}
