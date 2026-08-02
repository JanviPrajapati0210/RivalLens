// The signature visual for RivalLens: a radar-style dial that reads the
// current sentiment score, with a live "pulse" ring to sell the idea of
// signal being picked up in real time from social chatter.

function scoreToColor(score) {
  if (score >= 60) return "#34D399"; // positive
  if (score >= 45) return "#FBBF24"; // neutral
  return "#F87171"; // negative
}

export default function SentimentGauge({ score = 50, label = "Sentiment Signal" }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = scoreToColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-36 w-36">
        {/* Pulse ring, colored to match current sentiment */}
        <span
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{ backgroundColor: color, opacity: 0.15 }}
        />
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#262B3A"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-medium text-text-primary">{score}</span>
          <span className="text-xs text-text-muted">/ 100</span>
        </div>
      </div>
      <span className="text-sm text-text-muted">{label}</span>
    </div>
  );
}