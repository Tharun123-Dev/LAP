from typing import Optional
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class ReferralBase(BaseModel):
    customer_name: str
    customer_email: EmailStr
    status: Optional[str] = "pending"
    purchase_amount: Optional[float] = 0.0

class ReferralCreate(ReferralBase):
    affiliate_id: UUID

class ReferralUpdate(BaseModel):
    status: Optional[str] = None
    purchase_amount: Optional[float] = None

class ReferralInDBBase(ReferralBase):
    id: UUID
    affiliate_id: UUID
    referred_at: datetime

    class Config:
        from_attributes = True

class Referral(ReferralInDBBase):
    pass
