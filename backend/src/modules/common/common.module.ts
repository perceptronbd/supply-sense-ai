import { Module } from '@nestjs/common';
import { PrismaModule } from '@supplysense/prisma';
import { CorsService } from './services/cors.service';
import { TokenAndCredit } from './services/tokenAndCredit.service';

@Module({
  imports: [PrismaModule],
  providers: [TokenAndCredit, CorsService],
  exports: [TokenAndCredit, CorsService],
})
export class CommonModule {}
