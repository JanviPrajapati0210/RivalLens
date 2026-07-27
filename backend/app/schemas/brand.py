from pydantic import BaseModel, ConfigDict


class BrandCreate(BaseModel):
    name: str
    category: str = ""
    competitorNames: list[str] = []


class BrandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str | None = None
    sentimentScore: float
    mentionCount: int
    trend: str
    trendDelta: float
    competitors: list[str] = []

    @staticmethod
    def from_orm_brand(brand) -> "BrandOut":
        """Maps snake_case DB fields to the camelCase shape the frontend expects."""
        return BrandOut(
            id=brand.id,
            name=brand.name,
            category=brand.category,
            sentimentScore=brand.sentiment_score,
            mentionCount=brand.mention_count,
            trend=brand.trend,
            trendDelta=brand.trend_delta,
            competitors=[c.id for c in brand.competitors],
        )


class TrendPoint(BaseModel):
    date: str
    score: float


class AspectBreakdown(BaseModel):
    aspect: str
    positive: float
    negative: float
    neutral: float