import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-card">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-mono text-sm text-text-primary">{payload[0].value}</p>
    </div>
  );
}

export default function SentimentTrendChart({ data }) {
  const hasData = data && data.length > 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <h3 className="mb-4 text-sm font-medium text-text-primary">14-day sentiment trend</h3>

      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#262B3A" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#8B92A8"
              tick={{ fontSize: 11, fill: "#8B92A8" }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#8B92A8"
              tick={{ fontSize: 11, fill: "#8B92A8" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6C5CE7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#6C5CE7" }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[220px] flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm text-text-muted">No sentiment data yet</p>
          <p className="text-xs text-text-muted">Run an ingestion to start pulling mentions</p>
        </div>
      )}
    </div>
  );
}