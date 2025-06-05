import { Module } from '@nestjs/common';
import { ManufacturingListService } from './manufacturing-list.service';
import { ManufacturingListController } from './manufacturing-list.controller';
import { PrismaService } from '../../app/prisma.service';

@Module({
  controllers: [ManufacturingListController],
  providers: [ManufacturingListService, PrismaService],
  exports: [ManufacturingListService],
})
export class ManufacturingListModule {}
