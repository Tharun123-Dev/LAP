from fastapi import APIRouter
from .endpoints import auth, affiliate, referrals, commissions, payments, analytics, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(affiliate.router, prefix="/affiliate", tags=["affiliate"])
api_router.include_router(referrals.router, prefix="/affiliate/referrals", tags=["referrals"])
api_router.include_router(commissions.router, prefix="/affiliate/commissions", tags=["commissions"])
api_router.include_router(payments.router, prefix="/affiliate/payments", tags=["payments"])
api_router.include_router(analytics.router, prefix="/affiliate/analytics", tags=["analytics"])
api_router.include_router(notifications.router, prefix="/affiliate/notifications", tags=["notifications"])
