from typing import Optional
from pydantic import BaseModel, EmailStr
from uuid import UUID
from .user import User

class AffiliateRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    bank_account_details: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    payout_method: Optional[str] = None
    upi_id: Optional[str] = None


class AffiliateBase(BaseModel):
    referral_code: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bank_account_details: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    payout_method: Optional[str] = None
    upi_id: Optional[str] = None
    profile_image_url: Optional[str] = None

class AffiliateCreate(AffiliateBase):
    user_id: UUID
    referral_code: str

class AffiliateUpdate(AffiliateBase):
    pass

class AffiliateInDBBase(AffiliateBase):
    id: UUID
    user_id: UUID
    total_earnings: float
    paid_earnings: float
    total_clicks: int
    active_campaigns: int

    class Config:
        from_attributes = True

class Affiliate(AffiliateInDBBase):
    user: Optional[User] = None

class AffiliatePublic(BaseModel):
    id: UUID
    full_name: str
    email: str
    referral_code: str
    phone: Optional[str]
    address: Optional[str]
    bank_account_details: Optional[str]
    bank_name: Optional[str]
    account_number: Optional[str]
    payout_method: Optional[str]
    upi_id: Optional[str]
    profile_image_url: Optional[str]
    total_earnings: float
    paid_earnings: float
    total_clicks: int
    active_campaigns: int

    class Config:
        from_attributes = True
