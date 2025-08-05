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
import { ConnectionsService } from '../connections/connections.service';
import { GetTablesDto, SaveDbConnectionDto } from './dto/db-connect.dto';
import type { CaptureMetadataDto, TableMetadataDto } from './dto/metadata.dto';
import { GetSchemaDto } from './dto/schema.dto';
import type { GetRelationshipsDto, UpsertRelationshipsDto } from './dto/table-relationship.dto';
import { MetadataService } from './services/metadata.service';
import { OnboardingService } from './services/onboarding.service';
import { SchemaBuilderService } from './services/schema-builder.service';

@Controller('onboarding')
@UsePipes(new ValidationPipe({ transform: true }))
export class OnboardingController {
  constructor(
    @Inject(OnboardingService)
    private readonly onboardingService: OnboardingService,
    @Inject(MetadataService) private readonly metadataService: MetadataService,
    @Inject(SchemaBuilderService)
    private readonly schemaBuilderService: SchemaBuilderService,
    @Inject(ConnectionsService)
    private readonly connectionsService: ConnectionsService
  ) {}

  /**
   * Save database connection credentials
   */
  @Post('/db-connect')
  @HttpCode(HttpStatus.CREATED)
  async saveConnection(@Body() dto: SaveDbConnectionDto) {
    return await this.connectionsService.saveDbConnection(dto);
  }

  /**
   * get table names from the database
   */
  @Get('/:companyId/tables')
  @HttpCode(HttpStatus.OK)
  async getTables(@Param() dto: GetTablesDto) {
    return await this.onboardingService.getTables(dto.companyId, dto.dbConnectionId);
  }

  @Post('/:companyId/capture-metadata')
  @HttpCode(HttpStatus.OK)
  async captureMetadata(@Body() dto: CaptureMetadataDto) {
    return await this.metadataService.captureMetadata(dto);
  }

  @Post('/:companyId/save-metadata')
  @HttpCode(HttpStatus.CREATED)
  async saveMetadata(@Body() dto: TableMetadataDto) {
    return await this.metadataService.saveTableMetadata(dto);
  }
  /**
   * Get foreign key relationships for selected tables
   */
  @Get('/:companyId/:dbConnectionId/relationships')
  @HttpCode(HttpStatus.OK)
  async getRelationships(@Param() params: GetRelationshipsDto) {
    // Should return array of TableRelationshipDto (unconfirmed)
    return await this.onboardingService.getTableRelationships(
      params.companyId,
      params.dbConnectionId
    );
  }

  /**
   * Upsert confirmed table relationships
   */
  @Post('/table-relationships')
  @HttpCode(HttpStatus.CREATED)
  async upsertRelationships(@Body() dto: UpsertRelationshipsDto) {
    return await this.onboardingService.upsertTableRelationships(dto);
  }

  /**
   * Get the cached schema for a company's database connection
   * If the cache is expired (24h), it will rebuild the schema
   */
  @Get('/:companyId/:dbConnectionId/schema')
  @HttpCode(HttpStatus.OK)
  async getSchema(@Param() params: GetSchemaDto) {
    return await this.schemaBuilderService.getSchema(params.companyId, params.dbConnectionId);
  }
}
