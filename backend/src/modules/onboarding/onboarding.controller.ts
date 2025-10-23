import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConnectionsService } from '../connections/connections.service';
import { SaveDbConnectionDto } from './dto/db-connect.dto';
import type { BatchSaveMetadataDto, CaptureMetadataDto } from './dto/metadata.dto';
import { GetSchemaDto } from './dto/schema.dto';
import type { UpsertRelationshipsDto } from './dto/table-relationship.dto';
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
  async getTables(
    @Param('companyId') companyId: string,
    @Query('dbConnectionId') dbConnectionId: string
  ) {
    return await this.onboardingService.getTables(companyId, dbConnectionId);
  }

  @Post('/:companyId/capture-metadata')
  @HttpCode(HttpStatus.OK)
  async captureMetadata(@Body() dto: CaptureMetadataDto) {
    return await this.metadataService.captureMetadata(dto);
  }

  @Post('/:companyId/save-metadata')
  @HttpCode(HttpStatus.CREATED)
  async saveMetadata(@Param('companyId') companyId: string, @Body() dto: BatchSaveMetadataDto) {
    return await this.metadataService.saveTableMetadata(companyId, dto);
  }

  /**
   * Get foreign key relationships for selected tables
   */
  @Get('/:companyId/relationships')
  @HttpCode(HttpStatus.OK)
  async getRelationships(
    @Param('companyId') companyId: string,
    @Query('dbConnectionId') dbConnectionId: string
  ) {
    // Should return array of TableRelationshipDto (unconfirmed)
    return await this.onboardingService.getTableRelationships(companyId, dbConnectionId);
  }

  /**
   * Upsert confirmed table relationships the last step of onboarding process
   */
  @Post('/table-relationships')
  @HttpCode(HttpStatus.CREATED)
  async upsertRelationships(@Body() dto: UpsertRelationshipsDto, @Query('userId') userId: string) {
    return await this.onboardingService.upsertTableRelationships({
      ...dto,
      userId,
    });
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

  @Get('/:companyId/:dbConnectionId/schema/build')
  @HttpCode(HttpStatus.OK)
  async buildSchema(@Param() params: GetSchemaDto) {
    return await this.schemaBuilderService.buildAndCacheSchema(
      params.companyId,
      params.dbConnectionId
    );
  }
}
