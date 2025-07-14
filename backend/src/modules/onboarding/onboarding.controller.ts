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
import {
  CaptureMetadataDto,
  GetTablesDto,
  SaveDbConnectionDto,
  TableMetadataDto,
} from './dto/db-connect.dto';
import { MetadataService } from './services/metadata.service';
import { OnboardingService } from './services/onboarding.service';

@Controller('onboarding')
@UsePipes(new ValidationPipe({ transform: true }))
export class DbConnectionController {
  constructor(
    @Inject(OnboardingService)
    private readonly onboardingService: OnboardingService,
    @Inject(MetadataService) private readonly metadataService: MetadataService
  ) {}

  /**
   * Save database connection credentials
   */
  @Post('/db-connect')
  @HttpCode(HttpStatus.CREATED)
  async saveConnection(@Body() dto: SaveDbConnectionDto) {
    return await this.onboardingService.saveDbConnection(dto);
  }

  /**
   * get table names from the database
   */
  @Get('/:companyId/tables')
  @HttpCode(HttpStatus.OK)
  async getTables(@Param() dto: GetTablesDto) {
    return await this.onboardingService.getTables(dto.companyId);
  }

  @Post('/:companyId/capture-metadata')
  @HttpCode(HttpStatus.OK)
  async captureMetadata(@Body() dto: CaptureMetadataDto) {
    return await this.onboardingService.captureMetadata(dto);
  }
  @Post('/:companyId/save-metadata')
  @HttpCode(HttpStatus.CREATED)
  async saveMetadata(@Body() dto: TableMetadataDto) {
    return await this.metadataService.saveTableMetadata(dto);
  }
}
