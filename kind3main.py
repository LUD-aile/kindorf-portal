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

# МЫ УБРАЛИ os.remove(DB_FILE) - ТЕПЕРЬ ПОЛЬЗОВАТЕЛИ НЕ ИСЧЕЗАЮТ!

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

class TaskAction(BaseModel):
    user_id: int
    task_id: int

class TaskSubmit(BaseModel):
    user_id: int
    task_id: int
    report_link: str

@app.on_event("startup")
def startup_populate():
    db = SessionLocal()
    # Дефолтные аккаунты создаются ТОЛЬКО если база вообще пустая
    if db.query(User).count() == 0:
        db.add_all([
            User(id=1, username="victoria", password="admin123", name="Виктория Вальздорф", role="admin", stream="All", joined_at=datetime(2026, 1, 1)),
            User(id=2, username="dev_user", password="user123", name="Эдуард Айтишник", role="volunteer", stream="IT", points=120, tasks_count=5, joined_at=datetime(2026, 7, 1)),
            User(id=3, username="manager_test", password="manager123", name="Алексей HR", role="manager", stream="HR", joined_at=datetime(2026, 3, 1))
        ])
        db.add_all([
            Task(title="Разработать модуль мультиязычности", description="Интегрировать переводы интерфейса на бэкенд и фронтенд", stream="IT", points=50, status="available"),
            Task(title="Создать контент-план на месяц", description="Разработать сетку публикаций для всех стримов", stream="SMM", points=30, status="available"),
            Task(title="Провести онбординг новичков", description="Организовать созвон для новых волонтеров команды", stream="HR", points=25, status="available")
        ])
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
    new_task = Task(title=req.title, description=req.description, stream=req.stream, points=req.points, status="available")
    db.add(new_task)
    db.commit()
    return {"status": "success"}

@app.post("/api/tasks/claim")
def claim_task(req: TaskAction, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == req.task_id, Task.status == "available").first()
    if not task: raise HTTPException(status_code=400, detail="Task already taken")
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

app.mount("/static", StaticFiles(directory="static"), name="static")
@app.get("/")
def read_index(): return FileResponse("static/index.html")
