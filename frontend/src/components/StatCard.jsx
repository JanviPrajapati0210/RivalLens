export default function StatCard({ label, value, delta, deltaDirection }) {
  const deltaColor =
    deltaDirection === "up" ? "text-positive" : deltaDirection === "down" ? "text-negative" : "text-text-muted";
  const deltaSign = deltaDirection === "up" ? "+" : deltaDirection === "down" ? "" : "";

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <p className="text-sm text-text-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-medium text-text-primary">{value}</span>
        {delta !== undefined && (
          <span className={`text-sm font-mono ${deltaColor}`}>
            {deltaSign}
            {delta}%
          </span>
        )}
      </div>
    </div>
  );
}