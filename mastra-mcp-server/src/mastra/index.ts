import { Mastra } from '@mastra/core/mastra';
import { metadataAgent } from './agents/metadata-agent';
import { supplyChainAgent } from './agents/supply-chain-agent';
import { supplyChainWorkflow } from './workflows/supply-chain-workflow';
import { tableMetadataWorkflow } from './workflows/table-metadata-workflow';

export const mastra = new Mastra({
  agents: {
    supplyChainAgent,
    metadataAgent,
  },
  workflows: {
    supplyChainWorkflow,
    tableMetadataWorkflow,
  },
});
