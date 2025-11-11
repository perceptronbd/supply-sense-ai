import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import {
  TABLE_DESCRIPTION_AGENT_DESCRIPTION,
  TABLE_DESCRIPTION_AGENT_INSTRUCTION,
  TABLE_DESCRIPTION_AGENT_NAME,
} from '../../constants/system-instructions/table-description';

export interface GenerateDescriptionInput {
  tableName: string;
  columnName: string;
  refTable: string;
  refColumn: string;
  businessContext?: string;
}

type TableDescriptionRuntimeContext = RuntimeContext<{ inputs: GenerateDescriptionInput[] }>;

const openrouter = new GetOpenRouter();

export const tableDescriptionAgent = new Agent({
  name: TABLE_DESCRIPTION_AGENT_NAME,
  description: TABLE_DESCRIPTION_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const context = runtimeContext as TableDescriptionRuntimeContext;
    const inputs = context.get('inputs');
    console.log('inputs', inputs);
    const relationshipsData = inputs
      .map((input, index) => {
        const businessContextPart = input.businessContext
          ? `\n   Business Context: ${input.businessContext}`
          : '';
        return `## Relationship ${index + 1}
   - Table: ${input.tableName}
   - Field: ${input.columnName}
   - Connected to: ${input.refTable}.${input.refColumn}${businessContextPart}`;
      })
      .join('\n\n');

    return `## Instructions
${TABLE_DESCRIPTION_AGENT_INSTRUCTION}

## Current Context
${relationshipsData}

## Response Format
Return a JSON array of descriptions in the same order as the relationships above.`;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.DEEPSEEK),
});
