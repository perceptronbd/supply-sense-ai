import type { ReasoningStep } from '../ReasoningPanel';

export function handleWorkflowChunk(
  chunk: string,
  reasoningCollapsed: boolean,
  setReasoningCollapsed: (v: boolean) => void,
  setSteps: React.Dispatch<React.SetStateAction<Record<string, ReasoningStep>>>,
  setWorkflowStatus: (s: 'running' | 'success' | 'error') => void
): boolean {
  try {
    // Try to parse the chunk as JSON
    const parsedChunk = JSON.parse(chunk);
    console.log('Workflow event:', parsedChunk);

    // Open reasoning panel on first event
    if (reasoningCollapsed) setReasoningCollapsed(false);

    // Handle workflow event shapes
    if (parsedChunk?.type === 'workflow-step-start') {
      const p = parsedChunk.payload;
      const id: string = p?.id || p?.stepCallId || p?.stepName || String(Date.now());
      setSteps((prev) => ({
        ...prev,
        [id]: {
          id,
          name: p?.stepName || 'step',
          status: 'running',
          startedAt: p?.startedAt,
        },
      }));
      return true; // handled JSON
    }

    if (parsedChunk?.type === 'workflow-step-result') {
      const p = parsedChunk.payload;
      const id: string = p?.id || p?.stepCallId || p?.stepName || String(Date.now());
      const output = p?.output || {};
      setSteps((prev) => {
        const existing = prev[id];
        return {
          ...prev,
          [id]: {
            id,
            name: p?.stepName || existing?.name || 'step',
            status: (p?.status as ReasoningStep['status']) || 'success',
            startedAt: existing?.startedAt,
            endedAt: p?.endedAt,
            sqlQuery: output?.sqlQuery,
            rows: Array.isArray(output?.queryResults)
              ? output.queryResults.length
              : Array.isArray(output?.formattedData)
                ? output.formattedData.length
                : undefined,
            visualizationType: output?.visualizationType,
            summary: output?.summary,
          },
        };
      });
      return true; // handled JSON
    }

    if (parsedChunk?.type === 'workflow-finish') {
      setWorkflowStatus('success');
      return true; // handled JSON
    }
  } catch (error) {
    // If parsing fails, log the raw chunk for debugging
    console.log('Raw chunk (non-JSON):', chunk);
  }

  return false; // not a workflow JSON chunk
}
