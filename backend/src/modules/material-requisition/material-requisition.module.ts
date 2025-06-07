import { Module } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import { MaterialRequisitionController } from './material-requisition.controller';
import { MaterialRequisitionService } from './material-requisition.service';

@Module({
  controllers: [MaterialRequisitionController],
  providers: [MaterialRequisitionService, PrismaService],
  exports: [MaterialRequisitionService],
})
export class MaterialRequisitionModule {}
