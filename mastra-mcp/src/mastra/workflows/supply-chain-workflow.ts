import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Check inventory levels
const checkInventoryStep = createStep({
  id: 'check-inventory',
  description: 'Check current inventory levels for an item',
  inputSchema: z.object({
    itemSku: z.string().describe('SKU of the item to check'),
    threshold: z.number().default(10).describe('Minimum stock threshold'),
  }),
  outputSchema: z.object({
    itemSku: z.string(),
    currentStock: z.number(),
    threshold: z.number(),
    needsReorder: z.boolean(),
  }),
  execute: async (context) => {
    const { itemSku, threshold } = context.inputData;

    // Mock implementation - in real scenario, this would query your inventory system
    const mockInventoryLevel = Math.floor(Math.random() * 100);
    const needsReorder = mockInventoryLevel < threshold;

    console.log(`📦 Checking inventory for ${itemSku}: ${mockInventoryLevel} units`);

    return {
      itemSku,
      currentStock: mockInventoryLevel,
      threshold,
      needsReorder,
    };
  },
});

// Step 2: Create reorder alert if needed
const createReorderAlertStep = createStep({
  id: 'create-reorder-alert',
  description: 'Create a reorder alert if stock is below threshold',
  inputSchema: z.object({
    itemSku: z.string(),
    currentStock: z.number(),
    threshold: z.number(),
    needsReorder: z.boolean(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    alertCreated: z.boolean(),
    itemSku: z.string(),
    currentStock: z.number(),
    threshold: z.number(),
    urgency: z.enum(['low', 'medium', 'high']).optional(),
    message: z.string(),
  }),
  execute: async (context) => {
    const { itemSku, currentStock, threshold, needsReorder } = context.inputData;

    if (needsReorder) {
      const urgency: 'low' | 'medium' | 'high' = currentStock < threshold * 0.5 ? 'high' : 'medium';
      console.log(
        `🚨 REORDER ALERT: Item ${itemSku} is below threshold (${currentStock} < ${threshold})`
      );

      return {
        success: true,
        alertCreated: true,
        itemSku,
        currentStock,
        threshold,
        urgency,
        message: `Reorder needed for ${itemSku} - Stock critically low`,
      };
    }

    console.log(`✅ Stock level adequate for ${itemSku}`);
    return {
      success: true,
      alertCreated: false,
      itemSku,
      currentStock,
      threshold,
      message: `Stock level adequate for ${itemSku}`,
    };
  },
});

// Create the supply chain monitoring workflow
export const supplyChainWorkflow = createWorkflow({
  id: 'supply-chain-monitoring',
  description: 'Monitor inventory levels and create reorder alerts for supply chain management',
  inputSchema: z.object({
    itemSku: z.string().describe('SKU of the item to monitor'),
    threshold: z.number().default(10).describe('Minimum stock threshold for reorder alerts'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    alertCreated: z.boolean(),
    itemSku: z.string(),
    currentStock: z.number(),
    threshold: z.number(),
    urgency: z.enum(['low', 'medium', 'high']).optional(),
    message: z.string(),
  }),
})
  .then(checkInventoryStep)
  .then(createReorderAlertStep)
  .commit();
