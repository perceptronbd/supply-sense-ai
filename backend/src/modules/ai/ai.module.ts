import { PrismaService } from '@app/prisma.service';
import { AuthModule } from '@modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { GeminiService } from './services/gemini.service';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [AiController],
  providers: [GeminiService, PrismaService],
  exports: [GeminiService],
})
export class AiModule {}
