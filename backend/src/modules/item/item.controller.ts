import {
  type AuthenticatedUser,
  CurrentUser,
} from '@modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ITEM_PERMISSIONS } from '@supplysense/types';
import { CreateItemDto } from './dto/create-item.dto';
import { QueryItemDto } from './dto/query-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemEntity } from './entities/item.entity';
import { ItemService } from './item.service';

@ApiTags('items')
@Controller('items')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ItemController {
  constructor(@Inject(ItemService) private readonly itemService: ItemService) {}

  @Post()
  @RequirePermissions(ITEM_PERMISSIONS.CREATE)
  @ApiOperation({
    summary: 'Create a new item',
    description: 'Creates a new item in the system with unit management and conversion rates',
  })
  @ApiBody({ type: CreateItemDto })
  @ApiResponse({
    status: 201,
    description: 'Item created successfully',
    type: ItemEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - SKU already exists',
  })
  async create(@Body() createItemDto: CreateItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemService.create(createItemDto, user.companyId);
  }

  @Get()
  @RequirePermissions(ITEM_PERMISSIONS.READ)
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
  async findAll(@Query() query: QueryItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemService.findAll(query, user.companyId);
  }

  @Get('search')
  @RequirePermissions(ITEM_PERMISSIONS.READ)
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
    @CurrentUser() user: AuthenticatedUser,
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: string | number
  ) {
    const itemLimit = typeof limit === 'string' ? Number.parseInt(limit, 10) : limit || 20;
    return this.itemService.searchItems(searchTerm, user.companyId, branchId, itemLimit);
  }

  @Get('alerts/:branchId')
  @RequirePermissions(ITEM_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get stock monitoring alerts for a branch',
    description: 'Returns items that need attention based on stock levels and reorder points',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch UUID',
    example: 'uuid',
  })
  @ApiQuery({
    name: 'alertType',
    required: false,
    description: 'Filter by specific alert type',
    enum: ['outOfStock', 'belowSafetyStock', 'belowReorderLevel', 'lowStock'],
  })
  @ApiResponse({
    status: 200,
    description: 'Stock alerts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid' },
              name: { type: 'string', example: 'Steel Rod 10mm' },
              sku: { type: 'string', example: 'STEEL-ROD-10MM' },
              currentStock: { type: 'number', example: 5.5 },
              safetyStock: { type: 'number', example: 10 },
              reorderLevel: { type: 'number', example: 20 },
              alertType: { type: 'string', example: 'belowSafetyStock' },
              severity: { type: 'string', example: 'medium' },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 15 },
            outOfStock: { type: 'number', example: 3 },
            belowSafetyStock: { type: 'number', example: 7 },
            belowReorderLevel: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  async getMonitoringAlerts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Query('alertType') alertType?:
      | 'outOfStock'
      | 'belowSafetyStock'
      | 'belowReorderLevel'
      | 'lowStock'
  ) {
    const alertResults = {
      outOfStock: await this.itemService.findAll(
        { branchId, includeStock: true, outOfStock: true },
        user.companyId
      ),
      belowSafetyStock: await this.itemService.findAll(
        { branchId, includeStock: true, belowSafetyStock: true },
        user.companyId
      ),
      belowReorderLevel: await this.itemService.findAll(
        { branchId, includeStock: true, belowReorderLevel: true },
        user.companyId
      ),
      lowStock: await this.itemService.findAll(
        { branchId, includeStock: true, lowStock: true },
        user.companyId
      ),
    };

    const alerts = {
      outOfStock: Array.isArray(alertResults.outOfStock)
        ? alertResults.outOfStock
        : alertResults.outOfStock.data,
      belowSafetyStock: Array.isArray(alertResults.belowSafetyStock)
        ? alertResults.belowSafetyStock
        : alertResults.belowSafetyStock.data,
      belowReorderLevel: Array.isArray(alertResults.belowReorderLevel)
        ? alertResults.belowReorderLevel
        : alertResults.belowReorderLevel.data,
      lowStock: Array.isArray(alertResults.lowStock)
        ? alertResults.lowStock
        : alertResults.lowStock.data,
    };

    const data = alertType
      ? alerts[alertType]
      : [
          ...alerts.outOfStock,
          ...alerts.belowSafetyStock,
          ...alerts.belowReorderLevel,
          ...alerts.lowStock,
        ].filter((item, index, self) => index === self.findIndex((i) => i.id === item.id));

    return {
      data,
      summary: {
        outOfStock: alerts.outOfStock.length,
        belowSafetyStock: alerts.belowSafetyStock.length,
        belowReorderLevel: alerts.belowReorderLevel.length,
        lowStock: alerts.lowStock.length,
        total: data.length,
      },
    };
  }

  @Get('by-branch/:branchId')
  @RequirePermissions(ITEM_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get items for a specific branch with stock information',
    description: 'Returns all items with stock information for the specified branch',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Items with stock information retrieved successfully',
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
  async findByBranch(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Query() query: Omit<QueryItemDto, 'branchId'>,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.itemService.findAll({ ...query, branchId, includeStock: true }, user.companyId);
  }

  @Get(':id')
  @RequirePermissions(ITEM_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get a specific item by ID with optional stock information',
    description: 'Returns detailed item information with optional stock data for a specific branch',
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
    type: 'boolean',
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
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('branchId') branchId?: string,
    @Query('includeStock') includeStock?: boolean
  ) {
    return this.itemService.findOne(id, user.companyId, branchId, includeStock);
  }

  @Get(':id/conversions')
  @RequirePermissions(ITEM_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get item unit conversion information',
    description: 'Calculate conversions between different units for the item',
  })
  @ApiParam({
    name: 'id',
    description: 'Item UUID',
    example: 'uuid',
  })
  @ApiQuery({
    name: 'buyingQty',
    required: false,
    description: 'Quantity in buying unit to convert',
    example: '1',
  })
  @ApiQuery({
    name: 'transferQty',
    required: false,
    description: 'Quantity in transfer unit to convert',
    example: '100',
  })
  @ApiQuery({
    name: 'usingQty',
    required: false,
    description: 'Quantity in using unit to convert',
    example: '50',
  })
  @ApiResponse({
    status: 200,
    description: 'Unit conversions calculated successfully',
    schema: {
      type: 'object',
      properties: {
        item: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            name: { type: 'string', example: 'Steel Rod 10mm' },
            sku: { type: 'string', example: 'STEEL-ROD-10MM' },
            mainUnit: { type: 'string', example: 'kg' },
            buyingUnit: { type: 'string', example: 'ton' },
            transferUnit: { type: 'string', example: 'kg' },
            usingUnit: { type: 'string', example: 'kg' },
          },
        },
        conversions: {
          type: 'object',
          properties: {
            buyingToMain: { type: 'number', example: 1000 },
            transferToMain: { type: 'number', example: 1 },
            usingToMain: { type: 'number', example: 1 },
            inputConversions: {
              type: 'object',
              properties: {
                fromBuying: { type: 'number', example: 1000 },
                fromTransfer: { type: 'number', example: 100 },
                fromUsing: { type: 'number', example: 50 },
              },
            },
          },
        },
      },
    },
  })
  async getItemConversions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('buyingQty') buyingQty?: string,
    @Query('transferQty') transferQty?: string,
    @Query('usingQty') usingQty?: string
  ) {
    const quantities = {
      ...(buyingQty && { buying: Number.parseFloat(buyingQty) }),
      ...(transferQty && { transfer: Number.parseFloat(transferQty) }),
      ...(usingQty && { using: Number.parseFloat(usingQty) }),
    };

    return this.itemService.getItemWithConversions(
      id,
      user.companyId,
      Object.keys(quantities).length > 0 ? quantities : undefined
    );
  }

  @Put(':id')
  @RequirePermissions(ITEM_PERMISSIONS.UPDATE)
  @ApiOperation({
    summary: 'Update an item',
    description: 'Updates an existing item with the provided data',
  })
  @ApiParam({
    name: 'id',
    description: 'Item UUID',
    example: 'uuid',
  })
  @ApiBody({ type: UpdateItemDto })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: ItemEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - SKU already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemDto: UpdateItemDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.itemService.update(id, updateItemDto, user.companyId);
  }

  @Delete(':id')
  @RequirePermissions(ITEM_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete an item',
    description: 'Marks an item as inactive (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'Item UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Item deleted successfully',
    type: ItemEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itemService.remove(id, user.companyId);
  }

  @Delete(':id/hard')
  @RequirePermissions(ITEM_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete an item',
    description: 'Permanently removes an item from the system (hard delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'Item UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Item permanently deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itemService.hardDelete(id, user.companyId);
  }
}
