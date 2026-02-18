from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from db_models import DBTask
from models import TaskStatus

client = TestClient(app)

def setup_function():
    """Clear tasks database before each test"""
    db = SessionLocal()
    try:
        db.query(DBTask).delete()
        db.commit()
    finally:
        db.close()

def test_create_task():
    """Test creating a new task."""
    response = client.post("/tasks", json={
        "title": "Buy milk",
        "description": "2 litres"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Buy milk"
    assert data["status"] == "pending"
    assert "id" in data
    assert "created_at" in data

def test_list_tasks():
    """Test listing all tasks."""
    client.post("/tasks", json={"title": "Task 1"})
    client.post("/tasks", json={"title": "Task 2"})
    response = client.get("/tasks")
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_validate_missing_title():
    """Test that creating a task without a title returns 422 (Unprocessable Entity)."""
    response = client.post("/tasks", json={"description": "Missing title"})
    # FastAPI returns 422 for pydantic validation errors by default
    assert response.status_code == 422

def test_update_status():
    """Test updating a task's status."""
    create_resp = client.post("/tasks", json={"title": "Status Update"})
    task_id = create_resp.json()["id"]
    
    response = client.put(f"/tasks/{task_id}", json={"status": "in-progress"})
    assert response.status_code == 200
    assert response.json()["status"] == "in-progress"

def test_filter_by_status():
    """Test filtering tasks by their status."""
    client.post("/tasks", json={"title": "Pending Task"})
    resp = client.post("/tasks", json={"title": "Completed Task"})
    task_id = resp.json()["id"]
    client.put(f"/tasks/{task_id}", json={"status": "completed"})
    
    # Filter for completed
    response = client.get("/tasks?status=completed")
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Completed Task"

def test_delete_task():
    """Test deleting a task."""
    create_resp = client.post("/tasks", json={"title": "Delete Me"})
    task_id = create_resp.json()["id"]
    
    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 200
    
    get_resp = client.get("/tasks")
    assert len(get_resp.json()) == 0

def test_invalid_status():
    """Test that an invalid status returns an error (422 in FastAPI/Pydantic)."""
    create_resp = client.post("/tasks", json={"title": "Bad Status"})
    task_id = create_resp.json()["id"]
    
    response = client.put(f"/tasks/{task_id}", json={"status": "invalid-status-value"})
    # Validation error for Enum
    assert response.status_code == 422

def test_non_existent_id():
    """Test that performing an action on a non-existent ID returns 404."""
    response = client.put("/tasks/99999", json={"status": "completed"})
    assert response.status_code == 404
