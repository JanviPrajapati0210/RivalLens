from pydantic import BaseModel, ConfigDict


class MentionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source: str
    author: str | None = None
    text: str
    sentiment: str | None = None
    timestamp: str  # human-readable relative time, computed in brand_service.py

    @staticmethod
    def from_orm_mention(mention, timestamp: str) -> "MentionOut":
        return MentionOut(
            id=mention.id,
            source=mention.source,
            author=mention.author,
            text=mention.text,
            sentiment=mention.sentiment_label,
            timestamp=timestamp,
        )