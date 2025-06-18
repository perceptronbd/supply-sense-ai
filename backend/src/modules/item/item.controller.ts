import {
  type AuthenticatedUser,
  CurrentUser,
} from '@modules/auth/decorators/current-user.decorator';
import { Roles, UserRole } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { CreateItemDto } from './dto/create-item.dto';
import { QueryItemDto } from './dto/query-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemEntity } from './entities/item.entity';
import { ItemService } from './item.service';

@ApiTags('items')
@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.BRANCH_MANAGER)
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
  async create(@Body() createItemDto: CreateItemDto) {
    return this.itemService.create(createItemDto);
  }

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
    @Query('limit') limit?: string | number
  ) {
    // Convert limit to number if it's a string
    const numericLimit = limit ? Number(limit) : undefined;
    return this.itemService.searchItems(searchTerm, branchId, numericLimit);
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
    @Param('branchId', ParseUUIDPipe) branchId: string,
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
    @Param('id', ParseUUIDPipe) id: string,
    @Query('branchId') branchId?: string,
    @Query('includeStock') includeStock?: boolean
  ) {
    return this.itemService.findOne(id, branchId, includeStock);
  }

  @Put(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({
    summary: 'Update an existing item',
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
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemService.update(id, updateItemDto);
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete an item',
    description:
      'Deactivates an item (sets isActive to false). Only system admins can delete items.',
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
  @ApiResponse({
    status: 400,
    description: 'Cannot delete item - it is being used in active records',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemService.remove(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete an item',
    description:
      'Permanently deletes an item from the system. Only possible if no references exist.',
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
  @ApiResponse({
    status: 400,
    description: 'Cannot delete item - it has references in the system',
  })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.itemService.hardDelete(id);
  }
}
