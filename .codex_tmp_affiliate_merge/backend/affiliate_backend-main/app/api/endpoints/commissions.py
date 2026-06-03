from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..deps import get_current_affiliate, get_db
from ...models import Commission, Affiliate
from ...schemas import Commission as CommissionSchema

router = APIRouter()

@router.get("/", response_model=List[CommissionSchema])
def read_commissions(
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status (pending, paid)"),
) -> Any:
    """
    Retrieve commissions for current affiliate.
    """
    query = db.query(Commission).filter(Commission.affiliate_id == current_affiliate.id)
    if status:
        query = query.filter(Commission.status == status)
    
    commissions = query.order_by(Commission.created_at.desc()).offset(skip).limit(limit).all()
    return commissions
