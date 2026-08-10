import { useEffect, useRef, useState } from "react";
import { getBrandTrend, getBrandAspects, getBrandMentions, triggerIngestion } from "../lib/api";
import SentimentGauge from "../components/SentimentGauge";
import StatCard from "../components/StatCard";
import SentimentTrendChart from "../components/SentimentTrendChart";
import AspectBreakdown from "../components/AspectBreakdown";
import MentionCard from "../components/MentionCard";

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 60000;

export default function Dashboard({ activeBrand, onRefreshBrands }) {
  const [trend, setTrend] = useState([]);
  const [aspects, setAspects] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);

  // "idle" | "starting" | "polling" | "done" | "timeout" | "error"
  const [ingestStatus, setIngestStatus] = useState("idle");
  const pollTimerRef = useRef(null);
  const pollDeadlineRef = useRef(null);
  const baselineCountRef = useRef(null);

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

  // Stop any in-flight polling if the user switches brands mid-poll
  useEffect(() => {
    return () => clearTimeout(pollTimerRef.current);
  }, [activeBrand?.id]);

  async function handleRunIngestion() {
    if (!activeBrand || ingestStatus === "starting" || ingestStatus === "polling") return;

    setIngestStatus("starting");
    baselineCountRef.current = activeBrand.mentionCount;
    pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;

    try {
      await triggerIngestion(activeBrand.id);
      setIngestStatus("polling");
      schedulePoll();
    } catch {
      setIngestStatus("error");
    }
  }

  function schedulePoll() {
    pollTimerRef.current = setTimeout(async () => {
      const freshBrands = await onRefreshBrands();
      const fresh = freshBrands.find((b) => b.id === activeBrand.id);

      if (fresh && fresh.mentionCount > baselineCountRef.current) {
        setIngestStatus("done");
        return;
      }
      if (Date.now() >= pollDeadlineRef.current) {
        setIngestStatus("timeout");
        return;
      }
      schedulePoll();
    }, POLL_INTERVAL_MS);
  }

  if (!activeBrand) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        No brand selected. Add one to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{activeBrand.name}</h1>
          <p className="text-sm text-text-muted">{activeBrand.category}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={handleRunIngestion}
            disabled={ingestStatus === "starting" || ingestStatus === "polling"}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {ingestStatus === "starting" || ingestStatus === "polling" ? "Running ingestion…" : "Run ingestion"}
          </button>
          <IngestStatusNote status={ingestStatus} />
        </div>
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
              {mentions.length > 0 ? (
                mentions.map((m) => <MentionCard key={m.id} mention={m} />)
              ) : (
                <div className="rounded-lg border border-border bg-surface p-6 text-center">
                  <p className="text-sm text-text-muted">No mentions yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function IngestStatusNote({ status }) {
  if (status === "polling") {
    return <span className="text-xs text-text-muted">Pulling from Reddit + YouTube, checking every few seconds…</span>;
  }
  if (status === "done") {
    return <span className="text-xs text-positive">New mentions found — dashboard updated.</span>;
  }
  if (status === "timeout") {
    return (
      <span className="text-xs text-neutral">
        Still running in the background — no new mentions after 60s. Try again shortly.
      </span>
    );
  }
  if (status === "error") {
    return <span className="text-xs text-negative">Couldn't start ingestion. Check the backend is running.</span>;
  }
  return null;
}