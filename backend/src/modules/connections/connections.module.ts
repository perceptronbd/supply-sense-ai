import { PrismaModule } from '@/app/prisma.module';
import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';

@Module({
  imports: [PrismaModule],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
