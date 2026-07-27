"""
The full pipeline for one brand: scrape → analyze → store → recompute rollup.
Called from routes/ingestion.py as a background task, and can also be run
directly (`python -m app.services.ingestion_service <brand_id>`) for testing
or a scheduled cron job.
"""

import logging
import sys

from app.database import SessionLocal
from app.models.brand import Brand
from app.models.mention import Mention
from app.scrapers import reddit_scraper, youtube_scraper
from app.nlp import sentiment, aspects
from app.services.brand_service import recompute_brand_rollup

logger = logging.getLogger(__name__)


def run_ingestion_for_brand(brand_id: str) -> None:
    db = SessionLocal()
    try:
        brand = db.query(Brand).filter(Brand.id == brand_id).first()
        if not brand:
            logger.warning("Ingestion skipped — brand %s not found", brand_id)
            return

        scraped_items = []

        try:
            scraped_items += reddit_scraper.search_brand_mentions(brand.name)
        except Exception as exc:
            logger.warning("Reddit scrape failed for %s: %s", brand.name, exc)

        try:
            scraped_items += youtube_scraper.search_brand_mentions(brand.name)
        except Exception as exc:
            logger.warning("YouTube scrape failed for %s: %s", brand.name, exc)

        if not scraped_items:
            logger.info("No new mentions found for %s", brand.name)
            return

        # Batch sentiment analysis is much faster than one-at-a-time
        texts = [item.text for item in scraped_items]
        sentiment_results = sentiment.analyze_batch(texts)

        for item, (label, score) in zip(scraped_items, sentiment_results):
            mention = Mention(
                brand_id=brand.id,
                source=item.source,
                source_ref=item.source_ref,
                author=item.author,
                text=item.text,
                url=item.url,
                sentiment_label=label,
                sentiment_score=score,
                aspect=aspects.extract_aspect(item.text),
                posted_at=item.posted_at,
            )
            db.add(mention)

        db.commit()
        recompute_brand_rollup(db, brand_id)
        logger.info("Ingested %d mentions for %s", len(scraped_items), brand.name)

    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if len(sys.argv) < 2:
        print("Usage: python -m app.services.ingestion_service <brand_id>")
        sys.exit(1)
    run_ingestion_for_brand(sys.argv[1])