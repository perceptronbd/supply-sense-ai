import { Module } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import { GoodsReceiptController } from './goods-receipt.controller';
import { GoodsReceiptService } from './goods-receipt.service';

@Module({
  controllers: [GoodsReceiptController],
  providers: [GoodsReceiptService, PrismaService],
})
export class GoodsReceiptModule {}
