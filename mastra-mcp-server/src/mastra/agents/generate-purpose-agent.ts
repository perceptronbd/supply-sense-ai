import type { ITableSchemaInput } from '@supplysense/types';

import { Agent } from '@mastra/core/agent';
import { GetOpenRouter } from '@supplysense/utils';
import {
  PURPOSE_GENERATION_AGENT_DESCRIPTION,
  PURPOSE_GENERATION_AGENT_NAME,
  PURPOSE_GENERATION_INSTRUCTION,
} from '../constants/system-instructions/purpose-generation';

const openrouter = new GetOpenRouter();

export const generatePurposeAgent = new Agent({
  name: PURPOSE_GENERATION_AGENT_NAME,
  description: PURPOSE_GENERATION_AGENT_DESCRIPTION,
  instructions: PURPOSE_GENERATION_INSTRUCTION,
  model: openrouter.getModel(),
});

// Custom function to use the agent for generating table purpose

export interface GeneratePurposeInput {
  tableName: string;
  tableSchema: ITableSchemaInput;
  businessContext?: string;
}

export async function generatePurpose({
  tableName,
  tableSchema,
  businessContext,
}: GeneratePurposeInput): Promise<string> {
  if (!tableName || !tableSchema) {
    throw new Error('Missing required tableName or tableSchema');
  }

  try {
    const prompt = `Table: ${tableName}\nSchema: ${JSON.stringify(tableSchema, null, 2)}\n${
      businessContext ? `Business Context: ${businessContext}` : ''
    }\nGenerate a business purpose for this table.`;

    const response = await generatePurposeAgent.generate([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let purpose = response.text.trim();
    // Remove leading and trailing '**' if present
    purpose = purpose.replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '');
    return purpose;
  } catch (error) {
    console.error(`❌ Error generating purpose for table ${tableName}:`, error);

    // Check for specific OpenRouter payment error
    if (
      error.message?.includes('Payment Required') ||
      error.message?.includes('Insufficient credits')
    ) {
      console.warn(`💳 OpenRouter payment required. Using fallback purpose for table ${tableName}`);
    }

    // Return a fallback purpose instead of throwing
    const fallbackPurpose = `This table stores ${tableName.toLowerCase()} related data for business operations and analysis.`;
    console.warn(`Using fallback purpose: ${fallbackPurpose}`);
    return fallbackPurpose;
  }
}
