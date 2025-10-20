import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import type { GetTableMetadataDto } from './table-metadata.dto';
import { TableMetadataService } from './table-metadata.service';

@Controller('table-metadata')
@UsePipes(new ValidationPipe({ transform: true }))
export class TableMetadataController {
  constructor(
    @Inject(TableMetadataService)
    private readonly tableMetadataService: TableMetadataService
  ) {}

  @Get('/:dbConnectionId')
  @HttpCode(HttpStatus.OK)
  async getTableMetadata(@Param() params: GetTableMetadataDto) {
    return await this.tableMetadataService.getTableMetadata(params.dbConnectionId);
  }

  @Get('/sample-questions/:dbConnectionId')
  @HttpCode(HttpStatus.OK)
  async getSampleQuestions(@Param() params: GetTableMetadataDto) {
    return await this.tableMetadataService.getSampleQuestions(params.dbConnectionId);
  }
}
