// src/database/db-connection.controller.ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DbConnectionService } from './db-connection.service';
import { SaveDbConnectionDto } from './dto/create-db-connection.dto';

@Controller('db-connection')
@UsePipes(new ValidationPipe({ transform: true }))
export class DbConnectionController {
  constructor(
    @Inject(DbConnectionService)
    private readonly dynamicDbService: DbConnectionService
  ) {}

  /**
   * Save database connection credentials
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async saveConnection(@Body() dto: SaveDbConnectionDto) {
    return await this.dynamicDbService.saveDbConnection(dto);
  }
}
