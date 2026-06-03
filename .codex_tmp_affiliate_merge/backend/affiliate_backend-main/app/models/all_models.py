from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    affiliate_profile = relationship("Affiliate", back_populates="user", uselist=False)

class Affiliate(Base):
    __tablename__ = "affiliates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    referral_code = Column(String, unique=True, index=True)
    phone = Column(String)
    address = Column(String)
    bank_account_details = Column(String)
    bank_name = Column(String)
    account_number = Column(String)
    payout_method = Column(String, default="ACH/Direct Deposit")
    upi_id = Column(String)
    profile_image_url = Column(String)
    total_earnings = Column(Float, default=0.0)
    paid_earnings = Column(Float, default=0.0)
    total_clicks = Column(Integer, default=0)
    active_campaigns = Column(Integer, default=0)
    
    user = relationship("User", back_populates="affiliate_profile")
    referrals = relationship("Referral", back_populates="affiliate")
    commissions = relationship("Commission", back_populates="affiliate")
    payments = relationship("Payment", back_populates="affiliate")
    notifications = relationship("Notification", back_populates="affiliate")

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    affiliate_id = Column(UUID(as_uuid=True), ForeignKey("affiliates.id"))
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, converted, rejected
    purchase_amount = Column(Float, default=0.0)
    referred_at = Column(DateTime, default=datetime.utcnow)
    
    affiliate = relationship("Affiliate", back_populates="referrals")
    commission = relationship("Commission", back_populates="referral", uselist=False)

class Commission(Base):
    __tablename__ = "commissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referral_id = Column(UUID(as_uuid=True), ForeignKey("referrals.id"), unique=True)
    affiliate_id = Column(UUID(as_uuid=True), ForeignKey("affiliates.id"))
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, paid
    payment_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    referral = relationship("Referral", back_populates="commission")
    affiliate = relationship("Affiliate", back_populates="commissions")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    affiliate_id = Column(UUID(as_uuid=True), ForeignKey("affiliates.id"))
    amount = Column(Float, nullable=False)
    payment_method = Column(String)
    transaction_id = Column(String, unique=True)
    status = Column(String, default="processing")  # processing, completed, failed
    paid_at = Column(DateTime, default=datetime.utcnow)
    
    affiliate = relationship("Affiliate", back_populates="payments")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    affiliate_id = Column(UUID(as_uuid=True), ForeignKey("affiliates.id"))
    type = Column(String)  # commission, referral, payment, system
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    affiliate = relationship("Affiliate", back_populates="notifications")
