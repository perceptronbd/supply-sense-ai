import { Module } from '@nestjs/common';
import { RequestFormService } from './request-form.service';
import { RequestFormController } from './request-form.controller';
import { PrismaService } from '../../app/prisma.service';

@Module({
  controllers: [RequestFormController],
  providers: [RequestFormService, PrismaService],
})
export class RequestFormModule {}
