import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from '../modules/auth/auth.module';
import { PurchaseRequestModule } from '../modules/purchase-request/purchase-request.module';
import { PurchaseOrderModule } from '../modules/purchase-order/purchase-order.module';
import { GoodsReceiptModule } from '../modules/goods-receipt/goods-receipt.module';
import { RequestFormModule } from '../modules/request-form/request-form.module';
import { MaterialRequisitionModule } from '../modules/material-requisition/material-requisition.module';
import { ManufacturingListModule } from '../modules/manufacturing-list/manufacturing-list.module';
import { FormulaModule } from '../modules/formula/formula.module';

@Module({
  imports: [
    AuthModule,
    PurchaseRequestModule,
    PurchaseOrderModule,
    GoodsReceiptModule,
    RequestFormModule,
    MaterialRequisitionModule,
    ManufacturingListModule,
    FormulaModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
