import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetTableRelationshipsDto {
  @IsUUID()
  @ApiProperty({
    description: 'ID of the database connection',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dbConnectionId: string;
}
