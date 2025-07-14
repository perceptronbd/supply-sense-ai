import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { AI_MODEL_NAME } from '../constants';
import {
  PURPOSE_GENERATION_AGENT_DESCRIPTION,
  PURPOSE_GENERATION_AGENT_NAME,
  PURPOSE_GENERATION_INSTRUCTION,
} from '../constants/system-instructions/purpose-generation';
import { analyzeTableMetadataTool } from '../tools/metadata-tool';

// Define the agent configuration type
type AgentConfig = {
  name: string;
  description: string;
  instructions: string;
  model: any; // You might want to replace 'any' with a more specific type
  tools: { [key: string]: any }; // You might want to replace 'any' with a more specific type
};

const agentConfig = {
  name: PURPOSE_GENERATION_AGENT_NAME,
  description: PURPOSE_GENERATION_AGENT_DESCRIPTION,
  instructions: PURPOSE_GENERATION_INSTRUCTION,
  model: google(AI_MODEL_NAME),
  tools: { analyzeTableMetadataTool },
} as AgentConfig;

export const generatePurposeAgent = new Agent(agentConfig);

// Custom function to use the agent for generating table purpose
export interface GeneratePurposeInput {
  tableName: string;
  tableSchema: any;
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
    throw new Error('Failed to generate table purpose');
  }
}
