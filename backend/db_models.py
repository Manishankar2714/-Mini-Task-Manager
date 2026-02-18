from sqlalchemy import Column, Integer, String, DateTime
from database import Base
import datetime

class DBTask(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
