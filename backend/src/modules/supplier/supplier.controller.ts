import { Roles, UserRole } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { ApiErrorResponseDto, ApiResponseDto, PaginatedResponseDto } from '@modules/common';
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

type PaginatedSuppliersResponse = {
  data: Supplier[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupplierController {
  constructor(@Inject(SupplierService) private readonly supplierService: SupplierService) {}

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
  async create(@Body() createSupplierDto: CreateSupplierDto): Promise<Supplier> {
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
    @Query() query: QuerySupplierDto
  ): Promise<PaginatedSuppliersResponse | Supplier[]> {
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
    type: ApiResponseDto<Supplier>,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ApiErrorResponseDto,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SupplierWithRelations> {
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
    @Body() updateSupplierDto: UpdateSupplierDto
  ): Promise<Supplier> {
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
    type: ApiResponseDto<Supplier>,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete supplier - it has active records',
    type: ApiErrorResponseDto,
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<Supplier> {
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
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete supplier - it has references in the system',
    type: ApiErrorResponseDto,
  })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.supplierService.hardDelete(id);
  }
}
