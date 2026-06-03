from datetime import timedelta
from typing import Any
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ...core import security
from ...core.config import settings
from ...core.database import get_db
from ...models import User, Affiliate
from ...schemas import Token, User as UserSchema, AffiliateRegister, AffiliatePublic

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/forgot-password")
def forgot_password(email: str, db: Session = Depends(get_db)) -> Any:
    """
    Password recovery
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    # In a real app, send email here
    return {"msg": "Password recovery email sent"}

@router.post("/register", response_model=AffiliatePublic)
def register_affiliate(
    *,
    db: Session = Depends(get_db),
    register_in: AffiliateRegister,
) -> Any:
    """
    Register a new user as an affiliate.
    """
    # Check if user already exists
    user_exists = db.query(User).filter(User.email == register_in.email).first()
    if user_exists:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Create User
    new_user = User(
        email=register_in.email,
        hashed_password=security.get_password_hash(register_in.password),
        full_name=register_in.full_name,
        is_active=True
    )
    db.add(new_user)
    db.flush() # get the user ID
    
    # Generate unique referral code
    base_code = "".join(register_in.full_name.split())[:5].upper()
    random_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    referral_code = f"{base_code}{random_suffix}"
    
    # Ensure referral code uniqueness
    while db.query(Affiliate).filter(Affiliate.referral_code == referral_code).first():
        random_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        referral_code = f"{base_code}{random_suffix}"
        
    # Create Affiliate Profile
    new_affiliate = Affiliate(
        user_id=new_user.id,
        referral_code=referral_code,
        phone=register_in.phone,
        address=register_in.address,
        bank_account_details=register_in.bank_account_details,
        bank_name=register_in.bank_name,
        account_number=register_in.account_number,
        payout_method=register_in.payout_method or "ACH/Direct Deposit",
        upi_id=register_in.upi_id,
        profile_image_url=f"https://ui-avatars.com/api/?name={new_user.full_name.replace(' ', '+')}&background=random",
        total_earnings=0.0,
        paid_earnings=0.0,
        total_clicks=0,
        active_campaigns=0
    )
    db.add(new_affiliate)
    db.commit()
    db.refresh(new_affiliate)

    return {
        "id": new_affiliate.id,
        "full_name": new_affiliate.user.full_name,
        "email": new_affiliate.user.email,
        "referral_code": new_affiliate.referral_code,
        "phone": new_affiliate.phone,
        "address": new_affiliate.address,
        "bank_account_details": new_affiliate.bank_account_details,
        "bank_name": new_affiliate.bank_name,
        "account_number": new_affiliate.account_number,
        "payout_method": new_affiliate.payout_method,
        "upi_id": new_affiliate.upi_id,
        "profile_image_url": new_affiliate.profile_image_url,
        "total_earnings": new_affiliate.total_earnings,
        "paid_earnings": new_affiliate.paid_earnings,
        "total_clicks": new_affiliate.total_clicks,
        "active_campaigns": new_affiliate.active_campaigns,
    }

