import { Module } from '@nestjs/common';
import { GoodsReceiptService } from './goods-receipt.service';
import { GoodsReceiptController } from './goods-receipt.controller';
import { PrismaService } from '../../app/prisma.service';

@Module({
  controllers: [GoodsReceiptController],
  providers: [GoodsReceiptService, PrismaService],
})
export class GoodsReceiptModule {}
