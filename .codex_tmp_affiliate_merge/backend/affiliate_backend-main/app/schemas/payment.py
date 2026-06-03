from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class PaymentBase(BaseModel):
    amount: float
    payment_method: str
    transaction_id: str
    status: Optional[str] = "processing"

class PaymentCreate(PaymentBase):
    affiliate_id: UUID

class PaymentUpdate(PaymentBase):
    pass

class PaymentInDBBase(PaymentBase):
    id: UUID
    affiliate_id: UUID
    paid_at: datetime

    class Config:
        from_attributes = True

class Payment(PaymentInDBBase):
    pass
