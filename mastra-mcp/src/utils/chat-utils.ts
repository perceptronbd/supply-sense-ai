import type { MastraModelOutput } from '@mastra/core/stream';
import type { IChatFormattedResult } from '@supplysense/types';

type AgentGenerateResult = Awaited<ReturnType<MastraModelOutput['getFullOutput']>>;
type AgentToolResultPayload = AgentGenerateResult['toolResults'][number]['payload'];

const VALID_VISUALIZATION_TYPES = new Set<IChatFormattedResult['visualizationType']>([
  'table',
  'bar',
  'line',
  'area',
  'radar',
  'text',
]);

export function extractWorkflowResult(aiResponse: AgentGenerateResult): IChatFormattedResult {
  const defaultResult: IChatFormattedResult = {
    visualizationType: 'text',
    formattedData: null,
    summary: aiResponse.text,
  };

  const workflowToolPayload = getWorkflowToolPayload(aiResponse);
  const nestedResults = getWorkflowNestedResults(workflowToolPayload);

  if (!nestedResults) {
    return defaultResult;
  }

  const conversational = (nestedResults as Record<string, unknown>)['conversational-response'];
  if (isChatFormattedResult(conversational)) {
    return conversational;
  }

  const analytical = (nestedResults as Record<string, unknown>)['analytical-sub-workflow'];
  if (isChatFormattedResult(analytical)) {
    return analytical;
  }

  const reversedEntries = [...Object.entries(nestedResults as Record<string, unknown>)].reverse();
  for (const [, value] of reversedEntries) {
    if (isChatFormattedResult(value)) {
      return value;
    }
  }

  return defaultResult;
}

function getWorkflowToolPayload(
  aiResponse: AgentGenerateResult
): AgentToolResultPayload | undefined {
  return aiResponse.toolResults.find((toolResult) => toolResult.payload.toolName === 'chatWorkflow')
    ?.payload;
}

function getWorkflowNestedResults(
  payload: AgentToolResultPayload | undefined
): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  const { result } = payload;
  if (!result || typeof result !== 'object' || Array.isArray(result)) return undefined;

  if ('result' in result) {
    const nestedResult = (result as { result?: unknown }).result;
    if (nestedResult && typeof nestedResult === 'object' && !Array.isArray(nestedResult)) {
      return nestedResult as Record<string, unknown>;
    }
  }
  return undefined;
}

function isChatFormattedResult(value: unknown): value is IChatFormattedResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const candidate = value as Partial<IChatFormattedResult>;
  const { visualizationType, formattedData, summary } = candidate;

  if (!visualizationType || !VALID_VISUALIZATION_TYPES.has(visualizationType)) {
    return false;
  }

  if (formattedData !== null && !Array.isArray(formattedData)) {
    return false;
  }

  return typeof summary === 'string';
}

export const chatUtils = {
  extractWorkflowResult,
};
