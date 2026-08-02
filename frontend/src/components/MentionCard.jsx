const sentimentStyles = {
  positive: "border-l-positive",
  negative: "border-l-negative",
  neutral: "border-l-neutral",
};

export default function MentionCard({ mention }) {
  return (
    <div className={`rounded-lg border border-border border-l-4 ${sentimentStyles[mention.sentiment]} bg-surface p-4`}>
      <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
        <span>
          {mention.source} · {mention.author}
        </span>
        <span>{mention.timestamp}</span>
      </div>
      <p className="text-sm text-text-primary">{mention.text}</p>
    </div>
  );
}