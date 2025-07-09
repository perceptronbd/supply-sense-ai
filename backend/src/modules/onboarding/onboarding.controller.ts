// src/database/db-connection.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetTablesDto, SaveDbConnectionDto } from './dto/db-connection.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UsePipes(new ValidationPipe({ transform: true }))
export class DbConnectionController {
  constructor(
    @Inject(OnboardingService)
    private readonly dynamicDbService: OnboardingService
  ) {}

  /**
   * Save database connection credentials
   */
  @Post('/db-connect')
  @HttpCode(HttpStatus.CREATED)
  async saveConnection(@Body() dto: SaveDbConnectionDto) {
    return await this.dynamicDbService.saveDbConnection(dto);
  }

  /**
   * get table names from the database
   */
  @Get('/:companyId/tables')
  @HttpCode(HttpStatus.OK)
  async getTables(@Param() dto: GetTablesDto) {
    return await this.dynamicDbService.getTables(dto.companyId);
  }
}
