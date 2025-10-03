import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const supplyChainTool = createTool({
  id: 'get-supply-chain-status',
  description: 'Get current supply chain status for items and suppliers',
  inputSchema: z.object({
    itemSku: z.string().optional().describe('SKU of the item to check'),
    supplierCode: z.string().optional().describe('Supplier code to check'),
    location: z.string().optional().describe('Location/branch to check'),
  }),
  outputSchema: z.object({
    output: z.string(),
    status: z.enum(['healthy', 'warning', 'critical']),
    details: z
      .object({
        stockLevel: z.number().optional(),
        leadTime: z.number().optional(),
        supplierReliability: z.string().optional(),
      })
      .optional(),
  }),
  execute: async () => {
    // Simple mock implementation for now
    // In a real implementation, this would query your supply chain data

    const output =
      'Supply Chain Status Report:\n' +
      '- Overall Status: All systems operational\n' +
      '- Active Suppliers: 25\n' +
      '- Items in Stock: 1,250\n' +
      '- Pending Orders: 15\n' +
      '- Average Lead Time: 5-7 days\n' +
      '- Supplier Reliability: 95%';

    return {
      output,
      status: 'healthy' as const,
      details: {
        stockLevel: 150,
        leadTime: 6,
        supplierReliability: '95%',
      },
    };
  },
});
