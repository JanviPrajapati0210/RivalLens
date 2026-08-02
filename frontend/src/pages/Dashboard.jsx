import { useEffect, useState } from "react";
import { getBrandTrend, getBrandAspects, getBrandMentions } from "../lib/api";
import SentimentGauge from "../components/SentimentGauge";
import StatCard from "../components/StatCard";
import SentimentTrendChart from "../components/SentimentTrendChart";
import AspectBreakdown from "../components/AspectBreakdown";
import MentionCard from "../components/MentionCard";

export default function Dashboard({ activeBrand }) {
  const [trend, setTrend] = useState([]);
  const [aspects, setAspects] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBrand) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getBrandTrend(activeBrand.id),
      getBrandAspects(activeBrand.id),
      getBrandMentions(activeBrand.id),
    ]).then(([trendData, aspectData, mentionData]) => {
      if (cancelled) return;
      setTrend(trendData);
      setAspects(aspectData);
      setMentions(mentionData);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeBrand]);

  if (!activeBrand) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        No brand selected. Add one to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{activeBrand.name}</h1>
        <p className="text-sm text-text-muted">{activeBrand.category}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex items-center justify-center rounded-xl border border-border bg-surface p-6 shadow-card">
          <SentimentGauge score={activeBrand.sentimentScore} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total mentions" value={activeBrand.mentionCount.toLocaleString()} />
          <StatCard
            label="7-day trend"
            value={activeBrand.trend === "up" ? "Rising" : activeBrand.trend === "down" ? "Falling" : "Flat"}
            delta={Math.abs(activeBrand.trendDelta)}
            deltaDirection={activeBrand.trend}
          />
          <StatCard label="Competitors tracked" value={activeBrand.competitors.length} />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading signal data…</p>
      ) : (
        <>
          <SentimentTrendChart data={trend} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AspectBreakdown aspects={aspects} />
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-text-primary">Recent mentions</h3>
              {mentions.map((m) => (
                <MentionCard key={m.id} mention={m} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}