import { AuthModule } from '@modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@supplysense/prisma';
import { AiController } from './ai.controller';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [AiController],
  providers: [PrismaService],
  exports: [],
})
export class AiModule {}
