import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ColumnExampleAgentService } from './services/column-example-agent.service';
import { McpClientService } from './services/mcp-client.service';
import { TableDescriptionAgentService } from './services/table-description-agent.service';
import { TableMetadataAgentService } from './services/table-metadata-agent.service';

@Module({
  imports: [CommonModule],
  providers: [
    McpClientService,
    TableMetadataAgentService,
    TableDescriptionAgentService,
    ColumnExampleAgentService,
  ],
  exports: [
    McpClientService,
    TableMetadataAgentService,
    TableDescriptionAgentService,
    ColumnExampleAgentService,
  ],
})
export class McpClientModule {}
