import { Mastra } from '@mastra/core/mastra';
import { supplyChainAgent } from './agents/supply-chain-agent';
import { chatWorkflow } from './workflows/chat-workflow';
import { supplyChainWorkflow } from './workflows/supply-chain-workflow';
import { tableMetadataWorkflow } from './workflows/table-metadata-workflow';

export const mastra = new Mastra({
  agents: {
    supplyChainAgent,
  },
  workflows: {
    supplyChainWorkflow,
    tableMetadataWorkflow,
    chatWorkflow,
  },
});
