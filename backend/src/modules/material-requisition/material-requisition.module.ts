import { Module } from '@nestjs/common';
import { MaterialRequisitionService } from './material-requisition.service';
import { MaterialRequisitionController } from './material-requisition.controller';
import { PrismaService } from '../../app/prisma.service';

@Module({
  controllers: [MaterialRequisitionController],
  providers: [MaterialRequisitionService, PrismaService],
  exports: [MaterialRequisitionService],
})
export class MaterialRequisitionModule {}
