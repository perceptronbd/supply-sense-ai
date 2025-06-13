import { PrismaService } from '@app/prisma.service';
import { Module } from '@nestjs/common';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';

@Module({
  controllers: [ItemController],
  providers: [ItemService, PrismaService],
  exports: [ItemService],
})
export class ItemModule {}
