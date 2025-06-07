import { Module } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import { RequestFormController } from './request-form.controller';
import { RequestFormService } from './request-form.service';

@Module({
  controllers: [RequestFormController],
  providers: [RequestFormService, PrismaService],
})
export class RequestFormModule {}
