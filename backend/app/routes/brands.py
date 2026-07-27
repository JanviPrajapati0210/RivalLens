from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandOut, TrendPoint, AspectBreakdown
from app.schemas.mention import MentionOut
from app.services import brand_service

router = APIRouter(prefix="/api/brands", tags=["brands"])


@router.get("", response_model=list[BrandOut])
def list_brands(db: Session = Depends(get_db)):
    brands = brand_service.get_all_brands(db)
    return [BrandOut.from_orm_brand(b) for b in brands]


@router.post("", response_model=BrandOut, status_code=201)
def create_brand(payload: BrandCreate, db: Session = Depends(get_db)):
    existing = db.query(Brand).filter(Brand.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Brand already tracked")

    brand = Brand(name=payload.name, category=payload.category)
    db.add(brand)
    db.commit()
    db.refresh(brand)

    # Link named competitors if they already exist in the DB; unknown names
    # are silently skipped here — the frontend can surface a "not found" note.
    if payload.competitorNames:
        competitors = db.query(Brand).filter(Brand.name.in_(payload.competitorNames)).all()
        brand.competitors.extend(competitors)
        db.commit()
        db.refresh(brand)

    return BrandOut.from_orm_brand(brand)


@router.get("/{brand_id}/trend", response_model=list[TrendPoint])
def brand_trend(brand_id: str, db: Session = Depends(get_db)):
    _require_brand(db, brand_id)
    return brand_service.get_trend(db, brand_id)


@router.get("/{brand_id}/aspects", response_model=list[AspectBreakdown])
def brand_aspects(brand_id: str, db: Session = Depends(get_db)):
    _require_brand(db, brand_id)
    return brand_service.get_aspects(db, brand_id)


@router.get("/{brand_id}/mentions", response_model=list[MentionOut])
def brand_mentions(brand_id: str, db: Session = Depends(get_db)):
    _require_brand(db, brand_id)
    return brand_service.get_recent_mentions(db, brand_id)


def _require_brand(db: Session, brand_id: str) -> Brand:
    brand = brand_service.get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand