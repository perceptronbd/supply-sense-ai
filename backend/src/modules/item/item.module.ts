import { PrismaService } from '@app/prisma.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';

@Module({
  imports: [AuthModule],
  controllers: [ItemController],
  providers: [ItemService, PrismaService],
  exports: [ItemService],
})
export class ItemModule {}
