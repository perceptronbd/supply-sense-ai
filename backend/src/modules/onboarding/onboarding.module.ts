import { PrismaModule } from '@/app/prisma.module';
import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { DbConnectionController } from './onboarding.controller';
import { MetadataService } from './services/metadata.service';
import { OnboardingService } from './services/onboarding.service';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [DbConnectionController],
  providers: [OnboardingService, MetadataService],
  exports: [OnboardingService, MetadataService], // Export the services if other modules need them
})
export class DbConnectionModule {}
