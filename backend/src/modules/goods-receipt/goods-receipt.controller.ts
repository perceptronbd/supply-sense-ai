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
import { GOODS_RECEIPT_PERMISSIONS } from '../auth/types/permissions.types';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';
import { GoodsReceiptService } from './goods-receipt.service';

@ApiTags('goods-receipt')
@Controller('goods-receipt')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class GoodsReceiptController {
  constructor(
    @Inject(GoodsReceiptService) private readonly goodsReceiptService: GoodsReceiptService
  ) {}

  @Post()
  @RequirePermissions(GOODS_RECEIPT_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Create a new goods receipt' })
  @ApiBody({ type: CreateGoodsReceiptDto })
  @ApiResponse({
    status: 201,
    description: 'Goods receipt created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @Body() createGoodsReceiptDto: CreateGoodsReceiptDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return await this.goodsReceiptService.create(createGoodsReceiptDto, user);
  }

  @Get()
  @RequirePermissions(GOODS_RECEIPT_PERMISSIONS.READ)
  @ApiOperation({ summary: 'Get all goods receipts' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Filter by branch ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of goods receipts retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(@Query('branchId') branchId?: string) {
    return await this.goodsReceiptService.findAll(branchId);
  }

  @Get(':id')
  @RequirePermissions(GOODS_RECEIPT_PERMISSIONS.READ)
  @ApiOperation({ summary: 'Get a goods receipt by ID' })
  @ApiParam({
    name: 'id',
    description: 'Goods receipt ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Goods receipt retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Goods receipt not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findOne(@Param('id') id: string) {
    return await this.goodsReceiptService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(GOODS_RECEIPT_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a goods receipt' })
  @ApiParam({
    name: 'id',
    description: 'Goods receipt ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiBody({ type: UpdateGoodsReceiptDto })
  @ApiResponse({
    status: 200,
    description: 'Goods receipt updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async update(@Param('id') id: string, @Body() updateGoodsReceiptDto: UpdateGoodsReceiptDto) {
    return await this.goodsReceiptService.update(id, updateGoodsReceiptDto);
  }

  @Delete(':id')
  @RequirePermissions(GOODS_RECEIPT_PERMISSIONS.DELETE)
  @ApiOperation({ summary: 'Delete a goods receipt' })
  @ApiParam({
    name: 'id',
    description: 'Goods receipt ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Goods receipt deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async remove(@Param('id') id: string) {
    return await this.goodsReceiptService.remove(id);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(GOODS_RECEIPT_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Post a goods receipt' })
  @ApiParam({
    name: 'id',
    description: 'Goods receipt ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Goods receipt posted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async post(@Param('id') id: string) {
    return await this.goodsReceiptService.post(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(GOODS_RECEIPT_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Cancel a goods receipt' })
  @ApiParam({
    name: 'id',
    description: 'Goods receipt ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Goods receipt cancelled successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async cancel(@Param('id') id: string) {
    return await this.goodsReceiptService.cancel(id);
  }

  @Post('from-po/:poId')
  @RequirePermissions(GOODS_RECEIPT_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Create goods receipt from purchase order' })
  @ApiParam({
    name: 'poId',
    description: 'Purchase order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 201,
    description: 'Goods receipt created from purchase order successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createFromPO(@Param('poId') poId: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.goodsReceiptService.createFromPO(poId, user);
  }

  @Post('from-mr/:mrId')
  @RequirePermissions(GOODS_RECEIPT_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Create goods receipt from material requisition' })
  @ApiParam({
    name: 'mrId',
    description: 'Material requisition ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 201,
    description: 'Goods receipt created from material requisition successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createFromMR(@Param('mrId') mrId: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.goodsReceiptService.createFromMR(mrId, user);
  }
}
