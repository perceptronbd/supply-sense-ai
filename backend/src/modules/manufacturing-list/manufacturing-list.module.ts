import { Module } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import { ManufacturingListController } from './manufacturing-list.controller';
import { ManufacturingListService } from './manufacturing-list.service';

@Module({
  controllers: [ManufacturingListController],
  providers: [ManufacturingListService, PrismaService],
  exports: [ManufacturingListService],
})
export class ManufacturingListModule {}
