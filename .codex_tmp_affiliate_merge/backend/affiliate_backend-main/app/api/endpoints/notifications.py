from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..deps import get_current_affiliate, get_db
from ...models import Notification, Affiliate
from ...schemas import Notification as NotificationSchema

router = APIRouter()

@router.get("/", response_model=List[NotificationSchema])
def read_notifications(
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """
    Retrieve notifications for current affiliate.
    """
    notifications = db.query(Notification).filter(
        Notification.affiliate_id == current_affiliate.id
    ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.put("/{id}/read")
def mark_notification_read(
    id: str,
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
) -> Any:
    notification = db.query(Notification).filter(
        Notification.id == id,
        Notification.affiliate_id == current_affiliate.id
    ).first()
    if notification:
        notification.is_read = True
        db.commit()
    return {"msg": "Marked as read"}

@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_affiliate: Affiliate = Depends(get_current_affiliate),
) -> Any:
    db.query(Notification).filter(
        Notification.affiliate_id == current_affiliate.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"msg": "All marked as read"}
