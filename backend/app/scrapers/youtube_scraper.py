
from dataclasses import dataclass
from datetime import datetime

from googleapiclient.discovery import build

from app.config import settings

from app.scrapers.reddit_scraper import ScrapedItem  # reuse the same shape


DEFAULT_QUERY_SUFFIXES = ("app", "delivery", "review")


def _get_client():
    if not settings.youtube_api_key:
        raise RuntimeError("YouTube credentials missing — set YOUTUBE_API_KEY in .env")
    return build("youtube", "v3", developerKey=settings.youtube_api_key)


def _search_videos(youtube, query: str, max_results: int) -> list[str]:
    response = (
        youtube.search()
        .list(q=query, part="id", type="video", maxResults=max_results, order="relevance")
        .execute()
    )
    return [item["id"]["videoId"] for item in response.get("items", [])]


def _find_candidate_videos(youtube, brand_name: str, max_videos: int, query_suffixes) -> list[str]:
    """Runs one search per query suffix and pools deduplicated video ids.
    Splits max_videos roughly evenly across suffixes so no single query
    dominates the results."""
    per_query = max(1, max_videos // max(1, len(query_suffixes)))
    seen: dict[str, None] = {}  # dict preserves insertion order, dedupes on key

    for suffix in query_suffixes:
        query = f"{brand_name} {suffix}".strip()
        for video_id in _search_videos(youtube, query, per_query):
            seen[video_id] = None

    return list(seen.keys())[:max_videos]


def _mentions_brand(text: str, brand_name: str) -> bool:
    """A video matching the search query doesn't mean every comment on it is
    actually about the brand — most top-level comments on a broad tech/consumer
    video won't mention Zepto at all. Only keep comments that actually say the
    brand name, so sentiment/aspect scores aren't diluted by unrelated chatter."""
    return brand_name.lower() in text.lower()


def _get_comments_for_video(youtube, video_id: str, brand_name: str, max_comments: int) -> list[ScrapedItem]:
    items: list[ScrapedItem] = []
    try:
        response = (
            youtube.commentThreads()
            .list(part="snippet", videoId=video_id, maxResults=max_comments, order="relevance", textFormat="plainText")
            .execute()
        )
    except Exception:
        
        return items

    for thread in response.get("items", []):
        snippet = thread["snippet"]["topLevelComment"]["snippet"]
        text = snippet.get("textDisplay", "")

        if not _mentions_brand(text, brand_name):
            continue

        items.append(
            ScrapedItem(
                source="youtube",
                source_ref=video_id,
                author=snippet.get("authorDisplayName"),
                text=text,
                url=f"https://youtube.com/watch?v={video_id}&lc={thread['id']}",
                posted_at=datetime.fromisoformat(snippet["publishedAt"].replace("Z", "+00:00")),
            )
        )
    return items


def search_brand_mentions(
    brand_name: str,
    max_videos: int = 24,
    max_comments_per_video: int = 20,
    query_suffixes: tuple[str, ...] = DEFAULT_QUERY_SUFFIXES,
) -> list[ScrapedItem]:
    youtube = _get_client()
    items: list[ScrapedItem] = []

    video_ids = _find_candidate_videos(youtube, brand_name, max_videos, query_suffixes)

    for video_id in video_ids:
        items.extend(_get_comments_for_video(youtube, video_id, brand_name, max_comments_per_video))

    return items