import { PrismaModule } from '@/app/prisma.module';
import { Module } from '@nestjs/common';
import { DbConnectionController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [PrismaModule],
  controllers: [DbConnectionController],
  providers: [OnboardingService],
  exports: [OnboardingService], // Export the service if other modules need it
})
export class DbConnectionModule {}
