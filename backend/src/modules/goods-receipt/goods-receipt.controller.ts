import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';
import type { GoodsReceiptService } from './goods-receipt.service';

@ApiTags('goods-receipt')
@Controller('goods-receipt')
export class GoodsReceiptController {
  constructor(private readonly goodsReceiptService: GoodsReceiptService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goods receipt' })
  @ApiBody({ type: CreateGoodsReceiptDto })
  @ApiResponse({
    status: 201,
    description: 'Goods receipt created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createGoodsReceiptDto: CreateGoodsReceiptDto) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.goodsReceiptService.create(createGoodsReceiptDto, userId);
  }

  @Get()
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
  async findAll(@Query('branchId') branchId?: string) {
    return await this.goodsReceiptService.findAll(branchId);
  }

  @Get(':id')
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
  async findOne(@Param('id') id: string) {
    return await this.goodsReceiptService.findOne(id);
  }

  @Patch(':id')
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
  async update(@Param('id') id: string, @Body() updateGoodsReceiptDto: UpdateGoodsReceiptDto) {
    return await this.goodsReceiptService.update(id, updateGoodsReceiptDto);
  }

  @Delete(':id')
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
  async remove(@Param('id') id: string) {
    return await this.goodsReceiptService.remove(id);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
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
  async post(@Param('id') id: string) {
    return await this.goodsReceiptService.post(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
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
  async cancel(@Param('id') id: string) {
    return await this.goodsReceiptService.cancel(id);
  }

  @Post('from-po/:poId')
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
  async createFromPO(@Param('poId') poId: string) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.goodsReceiptService.createFromPO(poId, userId);
  }

  @Post('from-mr/:mrId')
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
  async createFromMR(@Param('mrId') mrId: string) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.goodsReceiptService.createFromMR(mrId, userId);
  }
}
