import { PrismaService } from '@app/prisma.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequestService } from './purchase-request.service';

@Module({
  imports: [AuthModule],
  controllers: [PurchaseRequestController],
  providers: [PurchaseRequestService, PrismaService],
  exports: [PurchaseRequestService],
})
export class PurchaseRequestModule {}
