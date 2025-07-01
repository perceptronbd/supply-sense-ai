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
import { Supplier } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { SUPPLIER_PERMISSIONS } from '@supplysense/types';
import { type AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiErrorResponseDto, ApiResponseDto, PaginatedResponseDto } from '../common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierService } from './supplier.service';

// Type definitions for responses using Prisma generated types
type SupplierWithRelations = Prisma.SupplierGetPayload<{
  include: {
    items: {
      include: {
        item: {
          select: {
            id: true;
            name: true;
            sku: true;
          };
        };
      };
    };
    purchaseOrders: {
      select: {
        id: true;
        poNumber: true;
        status: true;
        orderDate: true;
        totalAmount: true;
      };
    };
  };
}>;

// Response type for paginated suppliers - handled by ResponseInterceptor
type PaginatedSuppliersResponse = {
  data: Supplier[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SupplierController {
  constructor(@Inject(SupplierService) private readonly supplierService: SupplierService) {}

  @Post()
  @RequirePermissions(SUPPLIER_PERMISSIONS.CREATE)
  @ApiOperation({
    summary: 'Create a new supplier',
    description: 'Creates a new supplier in the system',
  })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully',
    type: ApiResponseDto<Supplier>,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - supplier code already exists',
    type: ApiErrorResponseDto,
  })
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<Supplier> {
    return this.supplierService.create(createSupplierDto, user.companyId);
  }

  @Get()
  @RequirePermissions(SUPPLIER_PERMISSIONS.READ)
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
    description:
      'Suppliers retrieved successfully. Returns array when no pagination, or paginated response when page/limit provided.',
    type: PaginatedResponseDto<Supplier>,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
    type: ApiErrorResponseDto,
  })
  async findAll(
    @Query() query: QuerySupplierDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<Supplier[] | PaginatedSuppliersResponse> {
    return this.supplierService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions(SUPPLIER_PERMISSIONS.READ)
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
    type: ApiResponseDto<Supplier>,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ApiErrorResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<SupplierWithRelations> {
    return this.supplierService.findOne(id, user.companyId);
  }

  @Put(':id')
  @RequirePermissions(SUPPLIER_PERMISSIONS.UPDATE)
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
    type: ApiResponseDto<Supplier>,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - supplier code already exists',
    type: ApiErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<Supplier> {
    return this.supplierService.update(id, updateSupplierDto, user.companyId);
  }

  @Delete(':id')
  @RequirePermissions(SUPPLIER_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete a supplier',
    description: 'Marks a supplier as inactive (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'Supplier UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Supplier deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ApiErrorResponseDto,
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<Supplier> {
    return this.supplierService.remove(id, user.companyId);
  }

  @Delete(':id/hard')
  @RequirePermissions(SUPPLIER_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete a supplier',
    description: 'Permanently removes a supplier from the system (hard delete)',
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
    type: ApiErrorResponseDto,
  })
  async hardDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.supplierService.hardDelete(id, user.companyId);
  }
}
