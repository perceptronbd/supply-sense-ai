import { Module } from '@nestjs/common';
import { McpClientService } from './services/mcp-client.service';
import { TableMetadataAgentService } from './services/table-metadata-agent.service';

@Module({
  providers: [McpClientService, TableMetadataAgentService],
  exports: [McpClientService, TableMetadataAgentService],
})
export class McpClientModule {}
