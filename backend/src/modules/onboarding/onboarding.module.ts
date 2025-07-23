import { PrismaModule } from '@/app/prisma.module';
import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { McpClientModule } from '../mcp-client/mcp-client.module';
import { OnboardingController } from './onboarding.controller';
import { MetadataService } from './services/metadata.service';
import { OnboardingService } from './services/onboarding.service';
import { SchemaBuilderService } from './services/schema-builder.service';

@Module({
  imports: [PrismaModule, ConnectionsModule, McpClientModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, MetadataService, SchemaBuilderService],
  exports: [OnboardingService, MetadataService, SchemaBuilderService], // Export the services if other modules need them
})
export class OnboardingModule {}
