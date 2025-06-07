import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthModule } from "../modules/auth/auth.module";
import { FormulaModule } from "../modules/formula/formula.module";
import { GoodsReceiptModule } from "../modules/goods-receipt/goods-receipt.module";
import { ManufacturingListModule } from "../modules/manufacturing-list/manufacturing-list.module";
import { MaterialRequisitionModule } from "../modules/material-requisition/material-requisition.module";
import { PurchaseOrderModule } from "../modules/purchase-order/purchase-order.module";
import { PurchaseRequestModule } from "../modules/purchase-request/purchase-request.module";
import { RequestFormModule } from "../modules/request-form/request-form.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaService } from "./prisma.service";

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
  providers: [AppService, PrismaService, Reflector],
  exports: [PrismaService],
})
export class AppModule {}
