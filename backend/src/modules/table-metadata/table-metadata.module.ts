import { Module } from '@nestjs/common';
import { TableMetadataController } from './table-metadata.controller';
import { TableMetadataService } from './table-metadata.service';

@Module({
  imports: [],
  controllers: [TableMetadataController],
  providers: [TableMetadataService],
  exports: [TableMetadataService],
})
export class TableMetadataModule {}
