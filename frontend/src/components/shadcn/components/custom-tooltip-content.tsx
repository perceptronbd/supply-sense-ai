interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: Record<string, unknown>;
    [key: string]: unknown;
  }>;
}

export const CustomTooltipContent = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0]?.payload;

  if (!data) {
    return null;
  }

  return (
    <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="grid gap-1">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground text-xs font-medium">{key}:</span>
            <span className="text-foreground font-mono font-medium tabular-nums text-xs">
              {String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
