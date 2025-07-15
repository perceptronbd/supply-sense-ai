import { IsNotEmpty, IsString } from 'class-validator';

export class GetSchemaDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  dbConnectionId: string;
}
