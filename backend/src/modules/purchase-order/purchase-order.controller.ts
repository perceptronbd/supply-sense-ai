import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';

@ApiTags('purchase-order')
@Controller('purchase-order')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}
  @Post()
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiBody({ type: CreatePurchaseOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.purchaseOrderService.create(createPurchaseOrderDto, user.id);
  }
  @Get()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK
  )
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Filter by branch ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of purchase orders retrieved successfully',
  })
  async findAll(@Query('branchId') branchId?: string) {
    return this.purchaseOrderService.findAll(branchId);
  }
  @Get(':id')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK
  )
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  @ApiParam({
    name: 'id',
    description: 'Purchase order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase order retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async findOne(@Param('id') id: string) {
    return this.purchaseOrderService.findOne(id);
  }
  @Patch(':id')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({ summary: 'Update a purchase order' })
  @ApiParam({
    name: 'id',
    description: 'Purchase order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiBody({ type: UpdatePurchaseOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Purchase order updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto
  ) {
    return this.purchaseOrderService.update(id, updatePurchaseOrderDto);
  }
  @Delete(':id')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({ summary: 'Delete a purchase order' })
  @ApiParam({
    name: 'id',
    description: 'Purchase order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase order deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async remove(@Param('id') id: string) {
    return this.purchaseOrderService.remove(id);
  }
  @Post(':id/send-to-supplier')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({ summary: 'Send purchase order to supplier' })
  @ApiParam({
    name: 'id',
    description: 'Purchase order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase order sent to supplier successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async sendToSupplier(@Param('id') id: string) {
    return this.purchaseOrderService.sendToSupplier(id);
  }
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({ summary: 'Confirm a purchase order' })
  @ApiParam({
    name: 'id',
    description: 'Purchase order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase order confirmed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async confirm(@Param('id') id: string) {
    return this.purchaseOrderService.confirm(id);
  }
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({ summary: 'Cancel a purchase order' })
  @ApiParam({
    name: 'id',
    description: 'Purchase order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase order cancelled successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async cancel(@Param('id') id: string) {
    return this.purchaseOrderService.cancel(id);
  }
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({ summary: 'Close a purchase order' })
  @ApiParam({
    name: 'id',
    description: 'Purchase order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase order closed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async close(@Param('id') id: string) {
    return this.purchaseOrderService.close(id);
  }
  @Post('create-from-pr/:prId')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
  @ApiOperation({ summary: 'Create purchase order from purchase request' })
  @ApiParam({
    name: 'prId',
    description: 'Purchase request ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        supplierId: {
          type: 'string',
          description: 'UUID of the supplier',
          example: '550e8400-e29b-41d4-a716-446655440002',
        },
      },
      required: ['supplierId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created from purchase request successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createFromPR(
    @Param('prId') prId: string,
    @Body('supplierId') supplierId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.purchaseOrderService.createFromPR(prId, supplierId, user.id);
  }
}
