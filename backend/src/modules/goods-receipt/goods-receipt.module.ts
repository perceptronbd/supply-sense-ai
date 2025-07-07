import { PrismaService } from '@app/prisma.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GoodsReceiptController } from './goods-receipt.controller';
import { GoodsReceiptService } from './goods-receipt.service';

@Module({
  imports: [AuthModule],
  controllers: [GoodsReceiptController],
  providers: [GoodsReceiptService, PrismaService],
})
export class GoodsReceiptModule {}
