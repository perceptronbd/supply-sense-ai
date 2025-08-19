import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { McpClientService } from './services/mcp-client.service';
import { TableDescriptionAgentService } from './services/table-description-agent.service';
import { TableMetadataAgentService } from './services/table-metadata-agent.service';
import { TestAgentService } from './services/test-agent.service';

@Module({
  imports: [CommonModule],
  providers: [
    McpClientService,
    TableMetadataAgentService,
    TableDescriptionAgentService,
    TestAgentService,
  ],
  exports: [
    McpClientService,
    TableMetadataAgentService,
    TableDescriptionAgentService,
    TestAgentService,
  ],
})
export class McpClientModule {}
