import { Module } from '@nestjs/common';
import { PrismaModule } from '@supplysense/prisma';
import { ConnectionsService } from './connections.service';

@Module({
  imports: [PrismaModule],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
