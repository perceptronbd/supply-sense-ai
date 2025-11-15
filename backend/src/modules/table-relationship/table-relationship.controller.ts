import { Controller, Get, HttpStatus, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetTableRelationshipsDto } from './dto/table-relationships.dto';
import { TableRelationshipService } from './table-relationship.service';
@ApiTags('Table Relationships')
@ApiBearerAuth()
@Controller('table-relationships')
@UseGuards(JwtAuthGuard)
export class TableRelationshipController {
  constructor(
    @Inject(TableRelationshipService)
    private readonly tableRelationshipService: TableRelationshipService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get table relationships for a database connection' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved table relationships',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        dbConnectionId: { type: 'string' },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              columnName: { type: 'string' },
              refTable: { type: 'string' },
              refColumn: { type: 'string' },
              description: { type: 'string', nullable: true },
              isConfirmed: { type: 'boolean' },
              actionVariant: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Database connection not found',
  })
  async getTableRelationships(@Query() query: GetTableRelationshipsDto) {
    return this.tableRelationshipService.getTableRelationships(query);
  }
}
