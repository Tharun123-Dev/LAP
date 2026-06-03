from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..deps import get_current_affiliate, get_db
from ...models import Payment, Affiliate
from ...schemas import Payment as PaymentSchema

router = APIRouter()

@router.get("/", response_model=List[PaymentSchema])
def read_payments(
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve payments for current affiliate.
    """
    payments = db.query(Payment).filter(
        Payment.affiliate_id == current_affiliate.id
    ).order_by(Payment.paid_at.desc()).offset(skip).limit(limit).all()
    return payments
