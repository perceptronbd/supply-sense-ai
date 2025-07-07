import { PrismaService } from '@app/prisma.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  imports: [AuthModule],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService, PrismaService],
})
export class PurchaseOrderModule {}
