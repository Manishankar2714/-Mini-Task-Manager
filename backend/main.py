from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from database import engine, Base
import db_models

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mini Task Manager API",
    description="A minimalist backend for managing your daily tasks.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
