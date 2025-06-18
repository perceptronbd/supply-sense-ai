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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierService } from './supplier.service';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({
    summary: 'Create a new supplier',
    description: 'Creates a new supplier in the system',
  })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid' },
        name: { type: 'string', example: 'Premium Materials Inc.' },
        code: { type: 'string', example: 'SUP001' },
        contactPerson: { type: 'string', example: 'John Smith' },
        email: { type: 'string', example: 'orders@premiummaterials.com' },
        phone: { type: 'string', example: '+1-555-2001' },
        address: { type: 'string', example: '100 Supplier Street, Industrial Park' },
        averageLeadTime: { type: 'number', example: 7 },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - supplier code already exists',
  })
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK
  )
  @ApiOperation({
    summary: 'Get all suppliers with optional pagination and search',
    description:
      'Returns all suppliers if no pagination params provided, otherwise returns paginated results',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for supplier name, code, or contact person',
    example: 'Premium',
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
    description: 'Include inactive suppliers',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Suppliers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid' },
              name: { type: 'string', example: 'Premium Materials Inc.' },
              code: { type: 'string', example: 'SUP001' },
              contactPerson: { type: 'string', example: 'John Smith' },
              email: { type: 'string', example: 'orders@premiummaterials.com' },
              phone: { type: 'string', example: '+1-555-2001' },
              address: { type: 'string', example: '100 Supplier Street, Industrial Park' },
              isActive: { type: 'boolean', example: true },
            },
          },
        },
        pagination: {
          type: 'object',
          nullable: true,
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(@Query() query: QuerySupplierDto) {
    return this.supplierService.findAll(query);
  }

  @Get(':id')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK
  )
  @ApiOperation({
    summary: 'Get a supplier by ID',
    description:
      'Returns detailed supplier information including related items and recent purchase orders',
  })
  @ApiParam({
    name: 'id',
    description: 'Supplier UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Supplier retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid' },
        name: { type: 'string', example: 'Premium Materials Inc.' },
        code: { type: 'string', example: 'SUP001' },
        contactPerson: { type: 'string', example: 'John Smith' },
        email: { type: 'string', example: 'orders@premiummaterials.com' },
        phone: { type: 'string', example: '+1-555-2001' },
        address: { type: 'string', example: '100 Supplier Street, Industrial Park' },
        averageLeadTime: { type: 'number', example: 7 },
        isActive: { type: 'boolean', example: true },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              item: { type: 'object' },
              unitPrice: { type: 'number' },
              minOrderQty: { type: 'number' },
              leadTimeDays: { type: 'number' },
            },
          },
        },
        purchaseOrders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              poNumber: { type: 'string' },
              status: { type: 'string' },
              orderDate: { type: 'string', format: 'date-time' },
              totalAmount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.supplierService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({
    summary: 'Update an existing supplier',
    description: 'Updates an existing supplier with the provided data',
  })
  @ApiParam({
    name: 'id',
    description: 'Supplier UUID',
    example: 'uuid',
  })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiResponse({
    status: 200,
    description: 'Supplier updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid' },
        name: { type: 'string', example: 'Premium Materials Inc.' },
        code: { type: 'string', example: 'SUP001' },
        contactPerson: { type: 'string', example: 'John Smith' },
        email: { type: 'string', example: 'orders@premiummaterials.com' },
        phone: { type: 'string', example: '+1-555-2001' },
        address: { type: 'string', example: '100 Supplier Street, Industrial Park' },
        averageLeadTime: { type: 'number', example: 7 },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - supplier code already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupplierDto: UpdateSupplierDto
  ) {
    return this.supplierService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete a supplier',
    description:
      'Deactivates a supplier (sets isActive to false). Only system admins can delete suppliers.',
  })
  @ApiParam({
    name: 'id',
    description: 'Supplier UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Supplier deleted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid' },
        name: { type: 'string', example: 'Premium Materials Inc.' },
        code: { type: 'string', example: 'SUP001' },
        contactPerson: { type: 'string', example: 'John Smith' },
        email: { type: 'string', example: 'orders@premiummaterials.com' },
        phone: { type: 'string', example: '+1-555-2001' },
        address: { type: 'string', example: '100 Supplier Street, Industrial Park' },
        averageLeadTime: { type: 'number', example: 7 },
        isActive: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete supplier - it has active records',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.supplierService.remove(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete a supplier',
    description:
      'Permanently deletes a supplier from the system. Only possible if no references exist.',
  })
  @ApiParam({
    name: 'id',
    description: 'Supplier UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Supplier permanently deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete supplier - it has references in the system',
  })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.supplierService.hardDelete(id);
  }
}
