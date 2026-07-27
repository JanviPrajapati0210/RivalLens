"""
Sits between routes/ and models/. Routes stay thin (just HTTP concerns);
this file does the actual aggregation — trend buckets, aspect rollups, etc.
"""

from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.models.mention import Mention
from app.schemas.brand import TrendPoint, AspectBreakdown
from app.schemas.mention import MentionOut
from app.utils.time_format import relative_time


def get_all_brands(db: Session) -> list[Brand]:
    return db.query(Brand).all()


def get_brand(db: Session, brand_id: str) -> Brand | None:
    return db.query(Brand).filter(Brand.id == brand_id).first()


def get_trend(db: Session, brand_id: str, days: int = 14) -> list[TrendPoint]:
    """Daily average sentiment score for the last N days."""
    since = datetime.utcnow() - timedelta(days=days)

    rows = (
        db.query(
            func.date(Mention.posted_at).label("day"),
            func.avg(Mention.sentiment_score).label("avg_score"),
        )
        .filter(Mention.brand_id == brand_id, Mention.posted_at >= since, Mention.sentiment_score.isnot(None))
        .group_by("day")
        .order_by("day")
        .all()
    )

    return [TrendPoint(date=_format_day(row.day), score=round(row.avg_score, 1)) for row in rows]


def _format_day(day) -> str:
    """func.date() returns a python date on Postgres but a plain 'YYYY-MM-DD'
    string on SQLite — normalize both to 'Jul 14' for the frontend chart."""
    if hasattr(day, "strftime"):
        return day.strftime("%b %d")
    try:
        return datetime.strptime(str(day), "%Y-%m-%d").strftime("%b %d")
    except ValueError:
        return str(day)


def get_aspects(db: Session, brand_id: str) -> list[AspectBreakdown]:
    """Percentage breakdown of positive/negative/neutral mentions per aspect."""
    rows = (
        db.query(Mention.aspect, Mention.sentiment_label, func.count(Mention.id))
        .filter(Mention.brand_id == brand_id, Mention.aspect.isnot(None))
        .group_by(Mention.aspect, Mention.sentiment_label)
        .all()
    )

    counts: dict[str, dict[str, int]] = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0})
    for aspect, label, count in rows:
        if label in counts[aspect]:
            counts[aspect][label] = count

    result = []
    for aspect, breakdown in counts.items():
        total = sum(breakdown.values()) or 1
        result.append(
            AspectBreakdown(
                aspect=aspect,
                positive=round(100 * breakdown["positive"] / total, 1),
                negative=round(100 * breakdown["negative"] / total, 1),
                neutral=round(100 * breakdown["neutral"] / total, 1),
            )
        )
    return result


def get_recent_mentions(db: Session, brand_id: str, limit: int = 10) -> list[MentionOut]:
    rows = (
        db.query(Mention)
        .filter(Mention.brand_id == brand_id)
        .order_by(Mention.posted_at.desc())
        .limit(limit)
        .all()
    )
    return [MentionOut.from_orm_mention(m, relative_time(m.posted_at)) for m in rows]


def recompute_brand_rollup(db: Session, brand_id: str) -> None:
    """Recalculates a brand's cached sentiment_score/mention_count/trend fields.
    Call this after any ingestion run so dashboard reads stay cheap (no
    on-the-fly aggregation over every mention on every page load)."""
    brand = get_brand(db, brand_id)
    if not brand:
        return

    mentions = db.query(Mention).filter(Mention.brand_id == brand_id).all()
    scored = [m.sentiment_score for m in mentions if m.sentiment_score is not None]

    brand.mention_count = len(mentions)
    if scored:
        brand.sentiment_score = round(sum(scored) / len(scored), 1)

    # Compare last 7 days average vs the 7 days before that, for trend direction
    now = datetime.utcnow()
    recent = [m.sentiment_score for m in mentions if m.posted_at and m.posted_at >= now - timedelta(days=7) and m.sentiment_score is not None]
    prior = [m.sentiment_score for m in mentions if m.posted_at and now - timedelta(days=14) <= m.posted_at < now - timedelta(days=7) and m.sentiment_score is not None]

    if recent and prior:
        recent_avg = sum(recent) / len(recent)
        prior_avg = sum(prior) / len(prior)
        delta = round(recent_avg - prior_avg, 1)
        brand.trend_delta = abs(delta)
        brand.trend = "up" if delta > 0.5 else "down" if delta < -0.5 else "flat"

    db.commit()