# Mini Task Manager

A professional, minimalist Task Management application built with FastAPI (Python) and Vanilla JavaScript. This project features a modular backend architecture, persistent storage using SQLite, and a stunning, responsive frontend with real-time feedback.

---

## 🚀 Features

- Task Management: Create, list, update (toggle status), and delete tasks.
- Persistent Storage: Uses SQLAlchemy with SQLite to save tasks locally.
- Modular Backend: Clean separation of concerns between models, routes, and database logic.
- Modern UI:
  - Glassmorphism-inspired design.
  - Filtering (All, Pending, Completed).
  - Real-time toast notifications for user feedback.
  - Smooth micro-animations and transitions.
- API Documentation: Interactive documentation powered by Swagger UI.

---

## 🛠️ Tech Stack

- Backend: Python, FastAPI, SQLAlchemy, Pydantic, SQLite.
- Frontend: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- Testing: Pytest for backend logic validation.

---

## 📦 Project Structure

```text
Mini-TaskManager/
├── backend/            # FastAPI Python server
│   ├── database.py     # SQLAlchemy engine & session setup
│   ├── db_models.py    # Database table definitions
│   ├── main.py         # App initialization & entry point
│   ├── models.py       # Pydantic data schemas
│   ├── routes.py       # API endpoint definitions
│   ├── requirements.txt# Python dependencies
│   └── sql_app.db      # SQLite database file
├── frontend/           # Client-side files
│   ├── index.html      # Main UI structure
│   ├── style.css       # Custom premium styling
│   └── app.js          # Interactive frontend logic
└── README.md           # Project documentation
```

---

## ⚙️ Setup & Installation

### 1. Backend Setup
1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the server:
   ```powershell
   uvicorn main:app --reload
   ```
   The API will be available at http://127.0.0.1:8000

### 2. Frontend Setup
Simply open frontend/index.html in your web browser. Ensure the backend server is running for full functionality.

---

## 📋 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /tasks | List all tasks (supports ?status= filter) |
| POST | /tasks | Create a new task |
| PUT | /tasks/{id} | Update task status or title |
| DELETE | /tasks/{id} | Delete a specific task |
| DELETE | /tasks/completed/clear | Bulk delete all completed tasks |

Visit http://127.0.0.1:8000/docs for interactive documentation.

---

## 🧪 Running Tests
To run the automated backend tests:
```powershell
cd backend
python -m pytest
```

---

## 📝 License
MIT License. Created for demonstration and personal productivity.
