import { Module } from '@nestjs/common';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequestController } from './purchase-request.controller';
import { PrismaService } from '../../app/prisma.service';

@Module({
  controllers: [PurchaseRequestController],
  providers: [PurchaseRequestService, PrismaService],
})
export class PurchaseRequestModule {}
