import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
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
import { type AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PURCHASE_ORDER_PERMISSIONS } from '../auth/types/permissions.types';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderService } from './purchase-order.service';

@ApiTags('purchase-order')
@Controller('purchase-order')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PurchaseOrderController {
  constructor(
    @Inject(PurchaseOrderService) private readonly purchaseOrderService: PurchaseOrderService
  ) {}
  @Post()
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.CREATE)
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
    return this.purchaseOrderService.create(createPurchaseOrderDto, user);
  }
  @Get()
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.READ)
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.purchaseOrderService.findAll(user, branchId);
  }
  @Get(':id')
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.READ)
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
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrderService.findOne(id, user);
  }
  @Patch(':id')
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.UPDATE)
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
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.purchaseOrderService.update(id, updatePurchaseOrderDto, user);
  }
  @Delete(':id')
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.DELETE)
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
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrderService.remove(id, user);
  }
  @Post(':id/send-to-supplier')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.UPDATE)
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
  async sendToSupplier(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrderService.sendToSupplier(id, user);
  }
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.UPDATE)
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
  async confirm(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrderService.confirm(id, user);
  }
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.UPDATE)
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
  async cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrderService.cancel(id, user);
  }
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.UPDATE)
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
  async close(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrderService.close(id, user);
  }
  @Post('create-from-pr/:prId')
  @RequirePermissions(PURCHASE_ORDER_PERMISSIONS.CREATE)
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
    return this.purchaseOrderService.createFromPR(prId, supplierId, user);
  }
}
