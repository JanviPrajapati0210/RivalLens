"""
Pulls comments from YouTube videos mentioning a brand name.
Uses the YouTube Data API v3 (needs a Google Cloud API key with
YouTube Data API v3 enabled — no OAuth needed for read-only public data).
"""

from dataclasses import dataclass
from datetime import datetime

from googleapiclient.discovery import build

from app.config import settings

from app.scrapers.reddit_scraper import ScrapedItem  # reuse the same shape


def _get_client():
    if not settings.youtube_api_key:
        raise RuntimeError("YouTube credentials missing — set YOUTUBE_API_KEY in .env")
    return build("youtube", "v3", developerKey=settings.youtube_api_key)


def _search_videos(youtube, brand_name: str, max_videos: int) -> list[str]:
    response = (
        youtube.search()
        .list(q=brand_name, part="id", type="video", maxResults=max_videos, order="date")
        .execute()
    )
    return [item["id"]["videoId"] for item in response.get("items", [])]


def _get_comments_for_video(youtube, video_id: str, max_comments: int) -> list[ScrapedItem]:
    items: list[ScrapedItem] = []
    try:
        response = (
            youtube.commentThreads()
            .list(part="snippet", videoId=video_id, maxResults=max_comments, order="relevance", textFormat="plainText")
            .execute()
        )
    except Exception:
        # Comments can be disabled on a video — skip it rather than failing the whole run.
        return items

    for thread in response.get("items", []):
        snippet = thread["snippet"]["topLevelComment"]["snippet"]
        items.append(
            ScrapedItem(
                source="youtube",
                source_ref=video_id,
                author=snippet.get("authorDisplayName"),
                text=snippet.get("textDisplay", ""),
                url=f"https://youtube.com/watch?v={video_id}&lc={thread['id']}",
                posted_at=datetime.fromisoformat(snippet["publishedAt"].replace("Z", "+00:00")),
            )
        )
    return items


def search_brand_mentions(brand_name: str, max_videos: int = 10, max_comments_per_video: int = 20) -> list[ScrapedItem]:
    youtube = _get_client()
    items: list[ScrapedItem] = []

    for video_id in _search_videos(youtube, brand_name, max_videos):
        items.extend(_get_comments_for_video(youtube, video_id, max_comments_per_video))

    return items