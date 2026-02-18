from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    """Enumeration of possible task statuses."""
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None

class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    pass

class TaskUpdate(BaseModel):
    """Schema for updating an existing task."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None

class Task(TaskBase):
    """Full task schema returned by the API."""
    id: int
    status: TaskStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
