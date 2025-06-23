import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthModule } from '../modules/auth/auth.module';
import { BranchModule } from '../modules/branch/branch.module';
import { ChatModule } from '../modules/chat/chat.module';
import { FormulaModule } from '../modules/formula/formula.module';
import { GoodsReceiptModule } from '../modules/goods-receipt/goods-receipt.module';
import { ItemModule } from '../modules/item/item.module';
import { ManufacturingListModule } from '../modules/manufacturing-list/manufacturing-list.module';
import { MaterialRequisitionModule } from '../modules/material-requisition/material-requisition.module';
import { PurchaseOrderModule } from '../modules/purchase-order/purchase-order.module';
import { PurchaseRequestModule } from '../modules/purchase-request/purchase-request.module';
import { RequestFormModule } from '../modules/request-form/request-form.module';
import { SupplierModule } from '../modules/supplier/supplier.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    BranchModule,
    ItemModule,
    PurchaseRequestModule,
    PurchaseOrderModule,
    SupplierModule,
    GoodsReceiptModule,
    RequestFormModule,
    MaterialRequisitionModule,
    ManufacturingListModule,
    FormulaModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, Reflector],
})
export class AppModule {}
