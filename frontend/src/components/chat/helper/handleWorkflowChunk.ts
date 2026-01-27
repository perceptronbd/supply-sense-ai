import type { ReasoningStep } from '../ReasoningCard';

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

    // If it's valid JSON, we consider it handled (so it doesn't show up in the text UI)
    // Even if it doesn't match a specific workflow type below.

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
    } else if (parsedChunk?.type === 'workflow-step-result') {
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
    } else if (parsedChunk?.type === 'workflow-finish') {
      setWorkflowStatus('success');
    }

    return true; // Any valid JSON is handled and should not be appended to text
  } catch (_error) {
    // If parsing fails, it's regular text content
    return false;
  }
}
