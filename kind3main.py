import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship

DB_FILE = "./dobro.db"

DATABASE_URL = f"sqlite:///{DB_FILE}"
Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="KINDORF Engine Pro")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="volunteer") 
    stream = Column(String, default="Pending")
    points = Column(Integer, default=0)
    tasks_count = Column(Integer, default=0)
    joined_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    stream = Column(String, nullable=False)
    points = Column(Integer, default=0)
    deadline = Column(String, nullable=True)
    status = Column(String, default="available") 
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    report_link = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str

class TaskCreate(BaseModel):
    title: str
    description: str
    stream: str
    points: int
    deadline: Optional[str] = "No deadline"

class TaskAction(BaseModel):
    user_id: int
    task_id: int

class TaskSubmit(BaseModel):
    user_id: int
    task_id: int
    report_link: str

INITIAL_TASKS = [
    {"title": "Task 1: Research 5 international studies", "description": "Find 5 international studies that could be useful for KINDORF’s content.", "stream": "Research", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 2: Find 5 potential hackathon sponsors", "description": "Find 5 potential sponsors for an international hackathon in Kazakhstan.", "stream": "Partnerships", "points": 20, "deadline": "23.09.2026"},
    {"title": "Task 3: Create international promo campaign", "description": "Create and carry out a comprehensive international information campaign to promote one of KINDORF’s projects.", "stream": "SMM", "points": 30, "deadline": "05.10.2026"},
    {"title": "Task 4: Research 5 international organizations", "description": "Research 5 international organizations similar to KINDORF and study their main areas of work.", "stream": "Research", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 5: Find 5 youth organizations for exchange", "description": "Find 5 international youth organizations for potential participant exchange and cooperation.", "stream": "HR", "points": 7, "deadline": "18.09.2026"},
    {"title": "Task 6: Create new social media content series", "description": "Create a new regular content series for KINDORF’s international social media platforms and prepare the first 5 publications.", "stream": "SMM", "points": 25, "deadline": "30.09.2026"},
    {"title": "Task 7: Research third-party material usage rules", "description": "Research requirements for using third-party images, materials, and logos on KINDORF’s social media.", "stream": "Legal", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 8: Find 5 international communities", "description": "Find 5 international communities for attracting new participants to KINDORF.", "stream": "HR", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 9: Find 5 international grant programs", "description": "Find 5 international grant programs suitable for KINDORF.", "stream": "Finance", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 10: Submit application to international grant", "description": "Prepare and submit a KINDORF application to a suitable international grant program.", "stream": "Finance", "points": 30, "deadline": "Program dependent"},
    {"title": "Task 11: Create visual for 'About KINDORF'", "description": "Create a visual for an 'About KINDORF' post for an international audience.", "stream": "Design", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 12: Find 5 young leaders programs", "description": "Find 5 international programs for young leaders that KINDORF participants can apply to.", "stream": "HR", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 13: Comprehensive youth development report", "description": "Conduct a comprehensive study of an issue related to international youth development and prepare a completed analytical report.", "stream": "Research", "points": 40, "deadline": "10.10.2026"},
    {"title": "Task 14: Find 5 international foundations", "description": "Find 5 international foundations supporting youth and social projects.", "stream": "Finance", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 15: Find 10 platforms for free promotion", "description": "Find 10 international communities and platforms where KINDORF can be promoted for free.", "stream": "SMM", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 16: Attract major international partner", "description": "Find and attract a significant international partner for KINDORF, conduct negotiations, and agree on cooperation.", "stream": "Partnerships", "points": 40, "deadline": "10.10.2026"},
    {"title": "Task 17: Research youth org rules in 5 countries", "description": "Research the requirements for the activities of international youth organizations in 5 selected countries.", "stream": "Legal", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 18: Attract media partner & secure publication", "description": "Find and attract a major international media partner for KINDORF and arrange the first publication.", "stream": "Partnerships", "points": 40, "deadline": "10.10.2026"},
    {"title": "Task 19: Find 5 international media outlets", "description": "Find 5 international media outlets and information platforms for potential media partnerships.", "stream": "Partnerships", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 20: Prepare post ideas for KINDORF projects", "description": "Prepare ideas for a series of posts about KINDORF and its projects.", "stream": "SMM", "points": 5, "deadline": "18.09.2026"},
    {"title": "Task 21: Find 5 resource support programs", "description": "Find 5 international programs through which KINDORF can receive financial or resource support.", "stream": "Finance", "points": 5, "deadline": "20.09.2026"},
    {"title": "Task 22: Create informational presentation", "description": "Create an informational presentation about KINDORF.", "stream": "Design", "points": 7, "deadline": "20.09.2026"},
    {"title": "Task 23: Launch participant recruitment campaign", "description": "Develop and launch an independent campaign to attract new participants through international communities.", "stream": "HR", "points": 30, "deadline": "05.10.2026"},
    {"title": "Task 24: Visual concept for international direction", "description": "Develop a comprehensive visual concept for KINDORF’s international direction (visual identity, color system, guidelines).", "stream": "Design", "points": 50, "deadline": "15.10.2026"},
    {"title": "Task 25: Find 5 international conferences", "description": "Find 5 international conferences suitable for participation or cooperation with KINDORF.", "stream": "Partnerships", "points": 5, "deadline": "20.09.2026"}
]

@app.on_event("startup")
def startup_populate():
    db = SessionLocal()
    if db.query(User).count() == 0:
        db.add_all([
            User(id=1, username="victoria", password="admin123", name="Виктория Вальздорф", role="admin", stream="All", joined_at=datetime(2026, 1, 1)),
            User(id=2, username="dev_user", password="user123", name="Эдуард Айтишник", role="volunteer", stream="IT", points=120, tasks_count=5, joined_at=datetime(2026, 7, 1)),
            User(id=3, username="manager_test", password="manager123", name="Алексей HR", role="manager", stream="HR", joined_at=datetime(2026, 3, 1))
        ])
        db.commit()

    if db.query(Task).count() == 0:
        for t in INITIAL_TASKS:
            db.add(Task(
                title=t["title"],
                description=t["description"],
                stream=t["stream"],
                points=t["points"],
                deadline=t["deadline"],
                status="available"
            ))
        db.commit()
    db.close()

@app.post("/api/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or user.password != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    months = (datetime.utcnow() - user.joined_at).days // 30
    return {
        "id": user.id, "name": user.name, "role": user.role, "stream": user.stream,
        "points": user.points, "tasks": user.tasks_count, "months": months, "eligible": (months >= 2 and user.points >= 200)
    }

@app.post("/api/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = User(username=req.username, password=req.password, name=req.name, role="volunteer", stream="Pending")
    db.add(new_user)
    db.commit()
    return {"status": "success"}

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.post("/api/users/{user_id}/promote")
def promote_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.role = "manager"
        db.commit()
    return {"status": "success"}

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db.query(User).filter(User.id == user_id).delete()
    db.commit()
    return {"status": "success"}

@app.get("/api/tasks")
def get_tasks(stream: Optional[str] = "All", user_id: Optional[int] = None, db: Session = Depends(get_db)):
    if user_id:
        return db.query(Task).filter(Task.worker_id == user_id, Task.status != "completed").all()
    query = db.query(Task).filter(Task.status == "available")
    if stream and stream != "All":
        query = query.filter(Task.stream == stream)
    return query.all()

@app.post("/api/tasks/create")
def create_task(req: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        title=req.title, 
        description=req.description, 
        stream=req.stream, 
        points=req.points, 
        deadline=req.deadline,
        status="available"
    )
    db.add(new_task)
    db.commit()
    return {"status": "success"}

@app.post("/api/tasks/claim")
def claim_task(req: TaskAction, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == req.task_id, Task.status == "available").first()
    if not task: raise HTTPException(status_code=400, detail="Task already taken")
    
    active_tasks = db.query(Task).filter(Task.worker_id == req.user_id, Task.status.in_(["in_progress", "on_review"])).count()
    if active_tasks >= 2:
        raise HTTPException(status_code=400, detail="You cannot take more than 2 active tasks simultaneously.")
        
    task.worker_id = req.user_id
    task.status = "in_progress"
    db.commit()
    return {"status": "success"}

@app.post("/api/tasks/cancel")
def cancel_task(req: TaskAction, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == req.task_id, Task.worker_id == req.user_id, Task.status == "in_progress").first()
    if task:
        task.status = "available"
        task.worker_id = None
        db.commit()
    return {"status": "success"}

@app.post("/api/tasks/submit")
def submit_task(req: TaskSubmit, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == req.task_id, Task.worker_id == req.user_id).first()
    if not task: raise HTTPException(status_code=404)
    task.status = "on_review"
    task.report_link = req.report_link
    db.commit()
    return {"status": "success"}

@app.get("/api/manager/review")
def get_review_tasks(stream: Optional[str] = "All", db: Session = Depends(get_db)):
    query = db.query(Task).filter(Task.status == "on_review")
    if stream and stream != "All":
        query = query.filter(Task.stream == stream)
    return query.all()

@app.post("/api/tasks/approve")
def approve_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.status == "on_review").first()
    if task:
        worker = db.query(User).filter(User.id == task.worker_id).first()
        if worker:
            worker.points += task.points
            worker.tasks_count += 1
        task.status = "completed"
        db.commit()
    return {"status": "success"}

current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")

if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_index(): return FileResponse("static/index.html")
