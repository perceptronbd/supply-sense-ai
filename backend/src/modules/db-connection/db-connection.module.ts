import { PrismaModule } from '@/app/prisma.module';
import { Module } from '@nestjs/common';
import { DbConnectionController } from './db-connection.controller';
import { DbConnectionService } from './db-connection.service';

@Module({
  imports: [PrismaModule],
  controllers: [DbConnectionController],
  providers: [DbConnectionService],
  exports: [DbConnectionService], // Export the service if other modules need it
})
export class DbConnectionModule {}
