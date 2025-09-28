import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

// DTO for GET /onboarding/:companyId/relationships
export class GetRelationshipsDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  dbConnectionId: string;
}

// DTO for column example result
export class ColumnExampleDto {
  @IsString()
  @IsNotEmpty()
  columnName: string;

  @IsString()
  @IsNotEmpty()
  exampleValue: string;

  @IsString()
  @IsNotEmpty()
  formattedColumnName: string;
}

// DTO for a single table relationship
export class TableRelationshipDto {
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @IsString()
  @IsNotEmpty()
  columnName: string;

  @IsString()
  @IsNotEmpty()
  refTable: string;

  @IsString()
  @IsNotEmpty()
  refColumn: string;

  @IsBoolean()
  @IsOptional()
  isConfirmed?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  sampleData?: any[];

  @ValidateNested({ each: true })
  @Type(() => ColumnExampleDto)
  @IsOptional()
  formattedColumns?: ColumnExampleDto[];
}

// DTO for POST /onboarding/:companyId/relationships
export class UpsertRelationshipsDto extends GetRelationshipsDto {
  @ValidateNested({ each: true })
  @Type(() => TableRelationshipDto)
  relationships: TableRelationshipDto[];
}
