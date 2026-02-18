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
    response = client.post("/tasks", json={
        "title": "Buy milk",
        "description": "2 litres"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Buy milk"
    assert data["description"] == "2 litres"
    assert data["status"] == "pending"
    assert "id" in data
    assert "created_at" in data
    assert "T" in data["created_at"]

def test_get_tasks_with_filtering():
    client.post("/tasks", json={"title": "Pending Task"})
    resp = client.post("/tasks", json={"title": "In Progress Task"})
    task_id = resp.json()["id"]
    client.put(f"/tasks/{task_id}", json={"status": "in-progress"})
    
    # Test all
    assert len(client.get("/tasks").json()) == 2
    
    # Test pending filter
    pending = client.get("/tasks?status=pending").json()
    assert len(pending) == 1
    assert pending[0]["title"] == "Pending Task"
    
    # Test in-progress filter
    in_progress = client.get("/tasks?status=in-progress").json()
    assert len(in_progress) == 1
    assert in_progress[0]["title"] == "In Progress Task"

def test_update_task():
    create_resp = client.post("/tasks", json={"title": "Old Title"})
    task_id = create_resp.json()["id"]
    
    update_resp = client.put(f"/tasks/{task_id}", json={
        "title": "New Title",
        "status": "completed"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "New Title"
    assert update_resp.json()["status"] == "completed"

def test_delete_task():
    create_resp = client.post("/tasks", json={"title": "Delete Me"})
    task_id = create_resp.json()["id"]
    
    delete_resp = client.delete(f"/tasks/{task_id}")
    assert delete_resp.status_code == 200
    
    get_resp = client.get("/tasks")
    assert len(get_resp.json()) == 0
