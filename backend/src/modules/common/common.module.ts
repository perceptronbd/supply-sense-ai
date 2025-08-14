import { PrismaModule } from '@/app/prisma.module';
import { Module } from '@nestjs/common';
import { TokenAndCredit } from './services/tokenAndCredit.service';

@Module({
  imports: [PrismaModule],
  providers: [TokenAndCredit],
  exports: [TokenAndCredit],
})
export class CommonModule {}
