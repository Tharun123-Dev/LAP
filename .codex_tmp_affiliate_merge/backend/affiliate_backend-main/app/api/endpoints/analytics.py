from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from ..deps import get_current_affiliate, get_db
from ...models import Referral, Commission, Affiliate

router = APIRouter()

@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
) -> Any:
    """
    Get summary stats for dashboard cards.
    """
    total_referrals = db.query(Referral).filter(Referral.affiliate_id == current_affiliate.id).count()
    total_earnings = current_affiliate.total_earnings
    paid_earnings = current_affiliate.paid_earnings
    pending_earnings = total_earnings - paid_earnings
    total_clicks = current_affiliate.total_clicks
    active_campaigns = current_affiliate.active_campaigns
    
    # This Month earnings (current calendar month)
    today = datetime.utcnow()
    first_day_of_month = datetime(today.year, today.month, 1)
    monthly_earnings = db.query(func.sum(Commission.amount)).filter(
        Commission.affiliate_id == current_affiliate.id,
        Commission.created_at >= first_day_of_month
    ).scalar() or 0.0
    
    # Conversion rate
    converted_referrals = db.query(Referral).filter(
        Referral.affiliate_id == current_affiliate.id,
        Referral.status == "converted"
    ).count()
    conversion_rate = (converted_referrals / total_referrals * 100) if total_referrals > 0 else 0.0
    
    return {
        "total_earnings": total_earnings,
        "pending_earnings": pending_earnings,
        "paid_earnings": paid_earnings,
        "total_clicks": total_clicks,
        "total_referrals": total_referrals,
        "conversion_rate": round(conversion_rate, 2),
        "active_campaigns": active_campaigns,
        "this_month_earnings": monthly_earnings,
    }

@router.get("/referral-growth")
def get_referral_growth(
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
) -> Any:
    """
    Get referral growth over the last 7 days.
    """
    stats = []
    for i in range(6, -1, -1):
        date = (datetime.utcnow() - timedelta(days=i)).date()
        count = db.query(Referral).filter(
            Referral.affiliate_id == current_affiliate.id,
            func.date(Referral.referred_at) == date
        ).count()
        stats.append({"date": date.strftime("%b %d"), "referrals": count})
    return stats

@router.get("/earnings-performance")
def get_earnings_performance(
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
) -> Any:
    """
    Get earnings performance over the last 6 months.
    """
    stats = []
    # Mocking monthly data for now or we can aggregate by month
    # For a real app, you'd aggregate commissions by month
    for i in range(5, -1, -1):
        # Rough month start
        month_date = datetime.utcnow() - timedelta(days=i*30)
        month_name = month_date.strftime("%b")
        
        # This is a simplification
        amount = db.query(func.sum(Commission.amount)).filter(
            Commission.affiliate_id == current_affiliate.id,
            func.extract('month', Commission.created_at) == month_date.month
        ).scalar() or 0.0
        
        stats.append({"month": month_name, "earnings": amount})
    return stats
