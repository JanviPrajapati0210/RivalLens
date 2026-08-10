export default function AspectBreakdown({ aspects }) {
  const hasData = aspects && aspects.length > 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <h3 className="mb-4 text-sm font-medium text-text-primary">Sentiment by aspect</h3>

      {hasData ? (
        <div className="flex flex-col gap-4">
          {aspects.map((a) => (
            <div key={a.aspect}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm text-text-primary">{a.aspect}</span>
                <span className="font-mono text-xs text-text-muted">{a.positive}% positive</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-ink">
                <div className="bg-positive" style={{ width: `${a.positive}%` }} />
                <div className="bg-neutral" style={{ width: `${a.neutral}%` }} />
                <div className="bg-negative" style={{ width: `${a.negative}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-text-muted">No aspect data yet</p>
      )}
    </div>
  );
}