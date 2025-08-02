import { Module } from '@nestjs/common';
import { McpClientService } from './services/mcp-client.service';
import { TableDescriptionAgentService } from './services/table-description-agent.service';
import { TableMetadataAgentService } from './services/table-metadata-agent.service';

@Module({
  providers: [McpClientService, TableMetadataAgentService, TableDescriptionAgentService],
  exports: [McpClientService, TableMetadataAgentService, TableDescriptionAgentService],
})
export class McpClientModule {}
