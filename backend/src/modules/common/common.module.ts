import { PrismaModule } from '@/app/prisma.module';
import { Module } from '@nestjs/common';
import { SharedService } from './services/shared.service';

@Module({
  imports: [PrismaModule],
  providers: [SharedService],
  exports: [SharedService],
})
export class CommonModule {}
