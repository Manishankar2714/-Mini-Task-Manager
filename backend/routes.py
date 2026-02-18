from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from models import Task, TaskCreate, TaskUpdate, TaskStatus
from database import get_db
from db_models import DBTask

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[Task])
async def get_tasks(
    status: Optional[TaskStatus] = Query(None), 
    db: Session = Depends(get_db)
):
    """Retrieve all tasks, optionally filtered by status."""
    query = db.query(DBTask)
    if status:
        query = query.filter(DBTask.status == status)
    
    return query.order_by(DBTask.created_at.desc()).all()

@router.post("", response_model=Task)
async def create_task(task_input: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task."""
    db_task = DBTask(
        title=task_input.title,
        description=task_input.description,
        status=TaskStatus.PENDING
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: int, 
    updated_task: TaskUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing task."""
    try:
        db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Update only provided fields
        update_data = updated_task.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_task, key, value)
        
        db.commit()
        db.refresh(db_task)
        return db_task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task by ID."""
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted"}

@router.delete("/completed/clear")
async def clear_completed(db: Session = Depends(get_db)):
    """Delete all completed tasks from the database."""
    db.query(DBTask).filter(DBTask.status == TaskStatus.COMPLETED).delete()
    db.commit()
    return {"message": "Completed tasks cleared"}
