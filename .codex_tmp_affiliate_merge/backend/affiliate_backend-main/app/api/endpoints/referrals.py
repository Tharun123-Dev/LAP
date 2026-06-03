from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime

from ..deps import get_current_affiliate, get_db
from ...models import Referral, Affiliate, Commission, Notification
from ...schemas import Referral as ReferralSchema

router = APIRouter()

class ReferralRegisterRequest(BaseModel):
    customer_name: str
    customer_email: EmailStr
    referral_code: str
    product_name: str
    purchase_amount: float

@router.post("/register-customer")
def register_customer(
    payload: ReferralRegisterRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Public endpoint to register a new referred customer signup.
    Calculates affiliate commission and generates active notifications.
    """
    # 1. Lookup affiliate by referral code
    affiliate = db.query(Affiliate).filter(Affiliate.referral_code == payload.referral_code).first()
    if not affiliate:
        raise HTTPException(status_code=404, detail="Invalid referral code")
        
    # 2. Check if customer already registered
    existing_ref = db.query(Referral).filter(
        Referral.customer_email == payload.customer_email
    ).first()
    if existing_ref:
        raise HTTPException(status_code=400, detail="Customer email already registered")
        
    # 3. Create referral record
    db_referral = Referral(
        affiliate_id=affiliate.id,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        status="converted" if payload.purchase_amount > 0.0 else "pending",
        purchase_amount=payload.purchase_amount
    )
    db.add(db_referral)
    db.flush()
    
    if payload.purchase_amount > 0.0:
        # 4. Calculate commission (10%)
        commission_amount = round(payload.purchase_amount * 0.10, 2)
        db_commission = Commission(
            referral_id=db_referral.id,
            affiliate_id=affiliate.id,
            amount=commission_amount,
            status="pending",
            created_at=datetime.utcnow()
        )
        db.add(db_commission)
        
        # 5. Update affiliate's total earnings
        affiliate.total_earnings += commission_amount
        
        # 6. Push real-time conversion notification
        db_notification = Notification(
            affiliate_id=affiliate.id,
            type="referral",
            message=f"New Conversion! {payload.customer_name} subscribed to {payload.product_name}. Commission of ₹{commission_amount:.2f} credited.",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(db_notification)
    else:
        # Push lead registration notification
        db_notification = Notification(
            affiliate_id=affiliate.id,
            type="referral",
            message=f"New Lead! {payload.customer_name} registered using your referral link.",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(db_notification)
    
    db.commit()
    return {"status": "success", "message": "Customer registered and referred successfully"}

@router.get("/", response_model=List[ReferralSchema])
def read_referrals(
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status (pending, converted, rejected)"),
) -> Any:
    """
    Retrieve referrals for current affiliate.
    """
    query = db.query(Referral).filter(Referral.affiliate_id == current_affiliate.id)
    if status:
        query = query.filter(Referral.status == status)
    
    referrals = query.order_by(Referral.referred_at.desc()).offset(skip).limit(limit).all()
    return referrals

@router.get("/{id}", response_model=ReferralSchema)
def read_referral(
    id: str,
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
) -> Any:
    """
    Get referral by ID.
    """
    referral = db.query(Referral).filter(
        Referral.id == id, Referral.affiliate_id == current_affiliate.id
    ).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral
