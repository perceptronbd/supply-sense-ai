import { Mastra } from '@mastra/core/mastra';
import { supplyChainAgent } from './agents/supply-chain-agent';
import { supplyChainWorkflow } from './workflows/supply-chain-workflow';

export const mastra = new Mastra({
  agents: {
    supplyChainAgent,
  },
  workflows: {
    supplyChainWorkflow,
  },
});
