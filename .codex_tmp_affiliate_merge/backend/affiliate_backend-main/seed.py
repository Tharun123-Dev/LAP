import uuid
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.all_models import User, Affiliate, Referral, Commission, Payment, Notification
from app.core.security import get_password_hash

def seed_data():
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(User).filter(User.email == "affiliate@example.com").first():
        print("Data already seeded.")
        return

    print("Seeding data...")

    # Create User
    user = User(
        email="affiliate@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="John Doe",
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create Affiliate
    affiliate = Affiliate(
        user_id=user.id,
        referral_code="JD123",
        phone="+1234567890",
        address="123 Affiliate St, Success City",
        bank_account_details="Bank: Chase, Account: ****1234",
        upi_id="johndoe@upi",
        profile_image_url="https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
        total_earnings=2500.0,
        paid_earnings=1800.0,
        total_clicks=1250,
        active_campaigns=5
    )
    db.add(affiliate)
    db.flush()

    # Create Referrals
    statuses = ["pending", "converted", "rejected"]
    referrals = []
    for i in range(25):
        status = random.choice(statuses)
        purchase_amount = random.uniform(50.0, 500.0) if status == "converted" else 0.0
        ref_date = datetime.utcnow() - timedelta(days=random.randint(0, 60))
        
        referral = Referral(
            affiliate_id=affiliate.id,
            customer_name=f"Customer {i+1}",
            customer_email=f"customer{i+1}@example.com",
            status=status,
            purchase_amount=purchase_amount,
            referred_at=ref_date
        )
        db.add(referral)
        referrals.append(referral)
    
    db.flush()

    # Create Commissions
    for referral in referrals:
        if referral.status == "converted":
            commission_amount = referral.purchase_amount * 0.1 # 10% commission
            comm_status = random.choice(["pending", "paid"])
            payment_date = datetime.utcnow() if comm_status == "paid" else None
            
            commission = Commission(
                referral_id=referral.id,
                affiliate_id=affiliate.id,
                amount=commission_amount,
                status=comm_status,
                payment_date=payment_date,
                created_at=referral.referred_at + timedelta(hours=1)
            )
            db.add(commission)

    # Create Payments
    for i in range(3):
        payment = Payment(
            affiliate_id=affiliate.id,
            amount=600.0,
            payment_method="Bank Transfer",
            transaction_id=f"TXN{random.randint(10000, 99999)}",
            status="completed",
            paid_at=datetime.utcnow() - timedelta(days=i*20)
        )
        db.add(payment)

    # Create Notifications
    notif_types = ["commission", "referral", "payment"]
    for i in range(10):
        notif = Notification(
            affiliate_id=affiliate.id,
            type=random.choice(notif_types),
            message=f"New activity detected in your account (Event {i+1})",
            is_read=random.choice([True, False]),
            created_at=datetime.utcnow() - timedelta(hours=i*5)
        )
        db.add(notif)

    db.commit()
    print("Seeding completed successfully.")

if __name__ == "__main__":
    seed_data()
