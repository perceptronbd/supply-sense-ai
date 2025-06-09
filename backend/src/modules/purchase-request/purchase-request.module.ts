import { Module } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequestService } from './purchase-request.service';

@Module({
  controllers: [PurchaseRequestController],
  providers: [PurchaseRequestService, PrismaService],
  exports: [PurchaseRequestService],
})
export class PurchaseRequestModule {}
