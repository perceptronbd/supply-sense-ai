import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { type AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { QueryItemDto } from './dto/query-item.dto';
import { ItemEntity } from './entities/item.entity';
import { ItemService } from './item.service';

@ApiTags('items')
@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK,
    UserRole.PRODUCTION_PLANNER
  )
  @ApiOperation({
    summary: 'Get all items with optional pagination, search, and stock information',
    description:
      'Returns all items if no pagination params provided, otherwise returns paginated results. Can include stock information for a specific branch.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for item name, SKU, or description',
    example: 'steel',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Branch ID to filter stock information',
    example: 'uuid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based). If provided, limit must also be provided.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page. If provided, page must also be provided.',
    example: 10,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive items',
    example: false,
  })
  @ApiQuery({
    name: 'includeStock',
    required: false,
    description: 'Include stock information for specified branch',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Items retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ItemEntity' },
        },
        pagination: {
          type: 'object',
          nullable: true,
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 250 },
            totalPages: { type: 'number', example: 25 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async findAll(@Query() query: QueryItemDto) {
    return this.itemService.findAll(query);
  }

  @Get('search')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK,
    UserRole.PRODUCTION_PLANNER
  )
  @ApiOperation({
    summary: 'Search items for dropdowns and selection',
    description: 'Simplified search endpoint optimized for item selection in forms',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search term',
    example: 'steel',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Branch ID to include stock information',
    example: 'uuid',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid' },
          name: { type: 'string', example: 'Steel Rod 10mm' },
          sku: { type: 'string', example: 'STEEL-ROD-10MM' },
          mainUnit: { type: 'string', example: 'kg' },
          buyingUnit: { type: 'string', example: 'ton' },
          transferUnit: { type: 'string', example: 'kg' },
          usingUnit: { type: 'string', example: 'kg' },
          stock: {
            type: 'object',
            nullable: true,
            properties: {
              quantity: { type: 'number', example: 100.5 },
              availableQty: { type: 'number', example: 90.5 },
            },
          },
        },
      },
    },
  })
  async searchItems(
    @Query('q') searchTerm: string,
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: number
  ) {
    return this.itemService.searchItems(searchTerm, branchId, limit);
  }

  @Get('by-branch/:branchId')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK,
    UserRole.PRODUCTION_PLANNER
  )
  @ApiOperation({
    summary: 'Get items for a specific branch with stock information',
    description: 'Returns items with stock information for the specified branch',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Branch items retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ItemEntity' },
        },
        pagination: {
          type: 'object',
          nullable: true,
        },
      },
    },
  })
  async findByBranch(
    @Param('branchId') branchId: string,
    @Query() query: Omit<QueryItemDto, 'branchId'>
  ) {
    return this.itemService.findByBranch(branchId, query);
  }

  @Get(':id')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK,
    UserRole.PRODUCTION_PLANNER
  )
  @ApiOperation({
    summary: 'Get a specific item by ID with optional stock information',
  })
  @ApiParam({
    name: 'id',
    description: 'Item UUID',
    example: 'uuid',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Branch ID to include stock information',
    example: 'uuid',
  })
  @ApiQuery({
    name: 'includeStock',
    required: false,
    description: 'Include stock information',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Item retrieved successfully',
    type: ItemEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  async findOne(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
    @Query('includeStock') includeStock?: boolean
  ) {
    return this.itemService.findOne(id, branchId, includeStock);
  }
}
