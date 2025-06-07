import { Module } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService, PrismaService],
})
export class PurchaseOrderModule {}
