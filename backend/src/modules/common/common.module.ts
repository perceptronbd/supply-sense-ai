import { Module } from '@nestjs/common';
import { PrismaModule } from '@supplysense/prisma';
import { TokenAndCredit } from './services/tokenAndCredit.service';

@Module({
  imports: [PrismaModule],
  providers: [TokenAndCredit],
  exports: [TokenAndCredit],
})
export class CommonModule {}
