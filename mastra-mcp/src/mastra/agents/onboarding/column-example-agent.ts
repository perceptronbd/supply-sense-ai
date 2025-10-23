import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import {
  COLUMN_EXAMPLE_AGENT_DESCRIPTION,
  COLUMN_EXAMPLE_AGENT_INSTRUCTION,
  COLUMN_EXAMPLE_AGENT_NAME,
} from '../../constants/system-instructions/column-example';

interface ColumnExampleInput {
  tableName: string;
  columnName: string;
  dataType: string;
  sampleData?: Array<Record<string, string | number | boolean | null>>;
  isEnum?: boolean;
  enumValues?: string[];
}

type IRuntimeContext = RuntimeContext<{ inputs: ColumnExampleInput[] }>;

const openrouter = new GetOpenRouter();

export const columnExampleAgent = new Agent({
  name: COLUMN_EXAMPLE_AGENT_NAME,
  description: COLUMN_EXAMPLE_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const context = runtimeContext as IRuntimeContext;
    const inputs = context.get('inputs');

    return `
    ##Instructions
    ${COLUMN_EXAMPLE_AGENT_INSTRUCTION}

    ##Current Context
    ${inputs.map((input) => {
      return `
      - Table: ${input.tableName}
      - Column Name: ${input.columnName}
      - Data Type: ${input.dataType}
      - Sample Data: ${JSON.stringify(input.sampleData)}
      - Is Enum: ${input.isEnum}`;
    })}
    `;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
});
