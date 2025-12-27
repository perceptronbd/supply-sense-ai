'use client';

import { Text } from '@/components/ui/Text';

type ReasoningCardProps = {
  steps: Array<{
    id: string;
    name: string;
    status: 'running' | 'success' | 'error';
    sqlQuery?: string;
    summary?: string;
    visualizationType?: string;
    rows?: number;
  }>;
  status: 'running' | 'success' | 'error';
};

export function ReasoningCard({ steps, status }: Readonly<ReasoningCardProps>) {
  return (
    <div className="w-full border border-default-200 rounded-xl bg-content1 overflow-hidden">
      <div className="px-3 py-2 border-b border-default-200 flex items-center justify-between">
        <Text variant="bodySmall" weight="bold" as="div">
          Reasoning
        </Text>
        <Text
          variant="bodyXSmall"
          className={
            status === 'success'
              ? 'text-success'
              : status === 'error'
                ? 'text-danger'
                : 'text-warning'
          }
          as="span"
        >
          {status}
        </Text>
      </div>
      <div className="max-h-64 overflow-y-auto p-3 space-y-3">
        {steps.length === 0 ? (
          <Text variant="bodySmall" color="muted" as="p">
            Waiting for analysis...
          </Text>
        ) : (
          steps.map((s) => (
            <div key={s.id} className="p-2 rounded-lg border border-default-200 bg-content2">
              <div className="flex items-center justify-between">
                <Text variant="bodySmall" weight="bold" as="div">
                  {s.name}
                </Text>
                <Text
                  variant="bodyXSmall"
                  className={
                    s.status === 'success'
                      ? 'text-success'
                      : s.status === 'error'
                        ? 'text-danger'
                        : 'text-warning'
                  }
                  as="span"
                >
                  {s.status}
                </Text>
              </div>
              {s.summary && (
                <Text variant="bodyXSmall" color="muted" className="mt-1" as="p">
                  {s.summary}
                </Text>
              )}
              {s.sqlQuery && (
                <pre className="mt-2 text-xs bg-default-100 p-2 rounded-md overflow-x-auto">
                  {s.sqlQuery}
                </pre>
              )}
              {typeof s.rows === 'number' && (
                <Text variant="bodyXSmall" color="muted" className="mt-2" as="p">
                  Rows: {s.rows}
                </Text>
              )}
              {s.visualizationType && (
                <Text variant="bodyXSmall" color="muted" className="mt-1" as="p">
                  Visualization: {s.visualizationType}
                </Text>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
