import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupplierService } from './supplier.service';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK
  )
  @ApiOperation({ summary: 'Get all active suppliers' })
  @ApiResponse({
    status: 200,
    description: 'List of active suppliers retrieved successfully',
    schema: {
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll() {
    return this.supplierService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK
  )
  @ApiOperation({ summary: 'Get a supplier by ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async findOne(@Param('id') id: string) {
    return this.supplierService.findOne(id);
  }
}
