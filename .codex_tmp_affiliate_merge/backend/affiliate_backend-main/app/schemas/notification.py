from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class NotificationBase(BaseModel):
    type: str
    message: str
    is_read: Optional[bool] = False

class NotificationCreate(NotificationBase):
    affiliate_id: UUID

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationInDBBase(NotificationBase):
    id: UUID
    affiliate_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class Notification(NotificationInDBBase):
    pass
