from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..deps import get_current_affiliate, get_db
from ...models import Affiliate, User
from ...schemas import AffiliatePublic, AffiliateUpdate

router = APIRouter()

@router.get("/profile", response_model=AffiliatePublic)
def read_affiliate_profile(
    current_affiliate: Affiliate = Depends(get_current_affiliate),
) -> Any:
    """
    Get current affiliate profile.
    """
    return {
        "id": current_affiliate.id,
        "full_name": current_affiliate.user.full_name,
        "email": current_affiliate.user.email,
        "referral_code": current_affiliate.referral_code,
        "phone": current_affiliate.phone,
        "address": current_affiliate.address,
        "bank_account_details": current_affiliate.bank_account_details,
        "bank_name": current_affiliate.bank_name,
        "account_number": current_affiliate.account_number,
        "payout_method": current_affiliate.payout_method,
        "upi_id": current_affiliate.upi_id,
        "profile_image_url": current_affiliate.profile_image_url,
        "total_earnings": current_affiliate.total_earnings,
        "paid_earnings": current_affiliate.paid_earnings,
        "total_clicks": current_affiliate.total_clicks,
        "active_campaigns": current_affiliate.active_campaigns,
    }

@router.put("/profile", response_model=AffiliatePublic)
def update_affiliate_profile(
    *,
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
    affiliate_in: AffiliateUpdate,
) -> Any:
    """
    Update affiliate profile.
    """
    update_data = affiliate_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_affiliate, field, value)
    
    db.add(current_affiliate)
    db.commit()
    db.refresh(current_affiliate)
    
    return {
        "id": current_affiliate.id,
        "full_name": current_affiliate.user.full_name,
        "email": current_affiliate.user.email,
        "referral_code": current_affiliate.referral_code,
        "phone": current_affiliate.phone,
        "address": current_affiliate.address,
        "bank_account_details": current_affiliate.bank_account_details,
        "bank_name": current_affiliate.bank_name,
        "account_number": current_affiliate.account_number,
        "payout_method": current_affiliate.payout_method,
        "upi_id": current_affiliate.upi_id,
        "profile_image_url": current_affiliate.profile_image_url,
        "total_earnings": current_affiliate.total_earnings,
        "paid_earnings": current_affiliate.paid_earnings,
        "total_clicks": current_affiliate.total_clicks,
        "active_campaigns": current_affiliate.active_campaigns,
    }
