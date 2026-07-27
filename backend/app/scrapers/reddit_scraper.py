"""
Pulls recent Reddit posts + comments mentioning a brand name.
Uses PRAW's read-only mode — no Reddit account posting/actions needed,
just client_id/client_secret from https://www.reddit.com/prefs/apps.
"""

from dataclasses import dataclass
from datetime import datetime, timezone

import praw

from app.config import settings


@dataclass
class ScrapedItem:
    source: str          # always "reddit"
    source_ref: str       # subreddit name, e.g. "india"
    author: str | None
    text: str
    url: str
    posted_at: datetime


def _get_client() -> praw.Reddit:
    if not settings.reddit_client_id or not settings.reddit_client_secret:
        raise RuntimeError(
            "Reddit credentials missing — set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env"
        )
    return praw.Reddit(
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret,
        user_agent=settings.reddit_user_agent,
    )


def search_brand_mentions(brand_name: str, limit: int = 50, subreddits: str = "all") -> list[ScrapedItem]:
    """Searches Reddit for posts mentioning `brand_name`, then pulls the
    top-level comments from each as additional mentions."""
    reddit = _get_client()
    items: list[ScrapedItem] = []

    submissions = reddit.subreddit(subreddits).search(brand_name, sort="new", limit=limit)

    for submission in submissions:
        posted_at = datetime.fromtimestamp(submission.created_utc, tz=timezone.utc)

        # The post itself, if it has a text body
        if submission.selftext:
            items.append(
                ScrapedItem(
                    source="reddit",
                    source_ref=str(submission.subreddit),
                    author=str(submission.author) if submission.author else None,
                    text=submission.selftext,
                    url=f"https://reddit.com{submission.permalink}",
                    posted_at=posted_at,
                )
            )

        # Top-level comments — these tend to carry more direct opinion/sentiment
        submission.comments.replace_more(limit=0)
        for comment in submission.comments[:10]:
            items.append(
                ScrapedItem(
                    source="reddit",
                    source_ref=str(submission.subreddit),
                    author=str(comment.author) if comment.author else None,
                    text=comment.body,
                    url=f"https://reddit.com{comment.permalink}",
                    posted_at=datetime.fromtimestamp(comment.created_utc, tz=timezone.utc),
                )
            )

    return items