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
} from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Controller('purchase-order')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  async create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    // TODO: Get actual user ID from auth token
    const userId = 'placeholder-user-id';
    return this.purchaseOrderService.create(createPurchaseOrderDto, userId);
  }

  @Get()
  async findAll(@Query('branchId') branchId?: string) {
    return this.purchaseOrderService.findAll(branchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.purchaseOrderService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto
  ) {
    return this.purchaseOrderService.update(id, updatePurchaseOrderDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.purchaseOrderService.remove(id);
  }

  @Post(':id/send-to-supplier')
  @HttpCode(HttpStatus.OK)
  async sendToSupplier(@Param('id') id: string) {
    return this.purchaseOrderService.sendToSupplier(id);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Param('id') id: string) {
    return this.purchaseOrderService.confirm(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    return this.purchaseOrderService.cancel(id);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  async close(@Param('id') id: string) {
    return this.purchaseOrderService.close(id);
  }

  @Post('create-from-pr/:prId')
  async createFromPR(
    @Param('prId') prId: string,
    @Body('supplierId') supplierId: string
  ) {
    // TODO: Get actual user ID from auth token
    const userId = 'placeholder-user-id';
    return this.purchaseOrderService.createFromPR(prId, supplierId, userId);
  }
}
