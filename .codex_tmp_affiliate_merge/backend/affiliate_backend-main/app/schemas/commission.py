from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class CommissionBase(BaseModel):
    amount: float
    status: Optional[str] = "pending"
    payment_date: Optional[datetime] = None

class CommissionCreate(CommissionBase):
    referral_id: UUID
    affiliate_id: UUID

class CommissionUpdate(CommissionBase):
    pass

class CommissionInDBBase(CommissionBase):
    id: UUID
    referral_id: UUID
    affiliate_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class Commission(CommissionInDBBase):
    pass
