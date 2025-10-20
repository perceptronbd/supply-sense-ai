import { IsString } from 'class-validator';

export class GetTableMetadataDto {
  @IsString()
  dbConnectionId: string;
}
