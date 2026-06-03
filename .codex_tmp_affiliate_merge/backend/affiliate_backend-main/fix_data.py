from app.core.database import SessionLocal
from app.models.all_models import Affiliate

def fix_affiliate_data():
    db = SessionLocal()
    affiliates = db.query(Affiliate).all()
    updated = 0
    for aff in affiliates:
        if aff.total_clicks is None:
            aff.total_clicks = 0
        if aff.active_campaigns is None:
            aff.active_campaigns = 0
        updated += 1
    db.commit()
    print(f"Updated {updated} affiliates.")
    db.close()

if __name__ == "__main__":
    fix_affiliate_data()
