import { Module } from '@nestjs/common';
import { McpClientService } from './services/mcp-client.service';
import { TableDescriptionAgentService } from './services/table-description-agent.service';
import { TableMetadataAgentService } from './services/table-metadata-agent.service';
import { TestAgentService } from './services/test-agent.service';

@Module({
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
