import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GoodsReceiptService } from './goods-receipt.service';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';

@Controller('goods-receipt')
export class GoodsReceiptController {
  constructor(private readonly goodsReceiptService: GoodsReceiptService) {}

  @Post()
  async create(@Body() createGoodsReceiptDto: CreateGoodsReceiptDto) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.goodsReceiptService.create(createGoodsReceiptDto, userId);
  }

  @Get()
  async findAll(@Query('branchId') branchId?: string) {
    return await this.goodsReceiptService.findAll(branchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.goodsReceiptService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGoodsReceiptDto: UpdateGoodsReceiptDto
  ) {
    return await this.goodsReceiptService.update(id, updateGoodsReceiptDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.goodsReceiptService.remove(id);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  async post(@Param('id') id: string) {
    return await this.goodsReceiptService.post(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    return await this.goodsReceiptService.cancel(id);
  }

  @Post('from-po/:poId')
  async createFromPO(@Param('poId') poId: string) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.goodsReceiptService.createFromPO(poId, userId);
  }

  @Post('from-mr/:mrId')
  async createFromMR(@Param('mrId') mrId: string) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.goodsReceiptService.createFromMR(mrId, userId);
  }
}
