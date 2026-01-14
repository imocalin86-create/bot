from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters
import asyncio
import threading

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Telegram Bot
TELEGRAM_TOKEN = os.environ.get('TELEGRAM_TOKEN')
bot = Bot(token=TELEGRAM_TOKEN) if TELEGRAM_TOKEN else None

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class AdminCreate(BaseModel):
    email: str
    password: str
    name: str

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    admin: AdminResponse

class MFOCreate(BaseModel):
    name: str
    description: str
    logo_url: Optional[str] = ""
    website_url: str
    min_amount: int
    max_amount: int
    min_term: int
    max_term: int
    interest_rate: float
    approval_rate: int
    is_active: bool = True

class MFOUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    min_amount: Optional[int] = None
    max_amount: Optional[int] = None
    min_term: Optional[int] = None
    max_term: Optional[int] = None
    interest_rate: Optional[float] = None
    approval_rate: Optional[int] = None
    is_active: Optional[bool] = None

class MFOResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    logo_url: str
    website_url: str
    min_amount: int
    max_amount: int
    min_term: int
    max_term: int
    interest_rate: float
    approval_rate: int
    is_active: bool
    clicks: int
    created_at: str

class LoanApplicationCreate(BaseModel):
    mfo_id: str
    user_telegram_id: int
    user_name: str
    amount: int
    term: int
    phone: Optional[str] = ""

class LoanApplicationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    mfo_id: str
    mfo_name: str
    user_telegram_id: int
    user_name: str
    amount: int
    term: int
    phone: str
    status: str
    created_at: str

class BotUserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    telegram_id: int
    username: str
    first_name: str
    last_name: str
    created_at: str
    last_activity: str

class ContentCreate(BaseModel):
    key: str
    value: str
    description: str

class ContentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    key: str
    value: str
    description: str
    updated_at: str

class AnalyticsResponse(BaseModel):
    total_users: int
    total_applications: int
    total_clicks: int
    applications_by_status: dict
    clicks_by_mfo: List[dict]
    users_by_day: List[dict]
    applications_by_day: List[dict]

class StatsResponse(BaseModel):
    total_users: int
    total_mfos: int
    total_applications: int
    total_clicks: int
    pending_applications: int
    conversion_rate: float

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(admin_id: str) -> str:
    payload = {
        "admin_id": admin_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin_id = payload.get("admin_id")
        admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register_admin(data: AdminCreate):
    existing = await db.admins.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    admin_id = str(uuid.uuid4())
    admin_doc = {
        "id": admin_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    
    token = create_token(admin_id)
    return TokenResponse(
        token=token,
        admin=AdminResponse(id=admin_id, email=data.email, name=data.name, created_at=admin_doc["created_at"])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login_admin(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin or not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(admin["id"])
    return TokenResponse(
        token=token,
        admin=AdminResponse(id=admin["id"], email=admin["email"], name=admin["name"], created_at=admin["created_at"])
    )

@api_router.get("/auth/me", response_model=AdminResponse)
async def get_me(admin: dict = Depends(get_current_admin)):
    return AdminResponse(id=admin["id"], email=admin["email"], name=admin["name"], created_at=admin["created_at"])

# ==================== MFO ROUTES ====================

@api_router.get("/mfos", response_model=List[MFOResponse])
async def get_mfos(admin: dict = Depends(get_current_admin)):
    mfos = await db.mfos.find({}, {"_id": 0}).to_list(1000)
    return mfos

@api_router.get("/mfos/public", response_model=List[MFOResponse])
async def get_public_mfos():
    mfos = await db.mfos.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return mfos

@api_router.post("/mfos", response_model=MFOResponse)
async def create_mfo(data: MFOCreate, admin: dict = Depends(get_current_admin)):
    mfo_id = str(uuid.uuid4())
    mfo_doc = {
        "id": mfo_id,
        **data.model_dump(),
        "clicks": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.mfos.insert_one(mfo_doc)
    del mfo_doc["_id"] if "_id" in mfo_doc else None
    return mfo_doc

@api_router.put("/mfos/{mfo_id}", response_model=MFOResponse)
async def update_mfo(mfo_id: str, data: MFOUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.mfos.update_one({"id": mfo_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="MFO not found")
    
    mfo = await db.mfos.find_one({"id": mfo_id}, {"_id": 0})
    return mfo

@api_router.delete("/mfos/{mfo_id}")
async def delete_mfo(mfo_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.mfos.delete_one({"id": mfo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="MFO not found")
    return {"message": "MFO deleted"}

@api_router.post("/mfos/{mfo_id}/click")
async def track_mfo_click(mfo_id: str, telegram_id: Optional[int] = None):
    await db.mfos.update_one({"id": mfo_id}, {"$inc": {"clicks": 1}})
    click_doc = {
        "id": str(uuid.uuid4()),
        "mfo_id": mfo_id,
        "telegram_id": telegram_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.clicks.insert_one(click_doc)
    return {"message": "Click tracked"}

# ==================== APPLICATIONS ROUTES ====================

@api_router.get("/applications", response_model=List[LoanApplicationResponse])
async def get_applications(admin: dict = Depends(get_current_admin)):
    apps = await db.applications.find({}, {"_id": 0}).to_list(1000)
    return apps

@api_router.post("/applications", response_model=LoanApplicationResponse)
async def create_application(data: LoanApplicationCreate):
    mfo = await db.mfos.find_one({"id": data.mfo_id}, {"_id": 0})
    if not mfo:
        raise HTTPException(status_code=404, detail="MFO not found")
    
    app_id = str(uuid.uuid4())
    app_doc = {
        "id": app_id,
        **data.model_dump(),
        "mfo_name": mfo["name"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.insert_one(app_doc)
    del app_doc["_id"] if "_id" in app_doc else None
    return app_doc

@api_router.put("/applications/{app_id}/status")
async def update_application_status(app_id: str, status: str, admin: dict = Depends(get_current_admin)):
    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.applications.update_one({"id": app_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Status updated"}

# ==================== USERS ROUTES ====================

@api_router.get("/users", response_model=List[BotUserResponse])
async def get_users(admin: dict = Depends(get_current_admin)):
    users = await db.bot_users.find({}, {"_id": 0}).to_list(1000)
    return users

# ==================== CONTENT ROUTES ====================

@api_router.get("/content", response_model=List[ContentResponse])
async def get_content(admin: dict = Depends(get_current_admin)):
    content = await db.content.find({}, {"_id": 0}).to_list(1000)
    return content

@api_router.post("/content", response_model=ContentResponse)
async def create_content(data: ContentCreate, admin: dict = Depends(get_current_admin)):
    existing = await db.content.find_one({"key": data.key})
    if existing:
        raise HTTPException(status_code=400, detail="Content key already exists")
    
    content_id = str(uuid.uuid4())
    content_doc = {
        "id": content_id,
        **data.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.content.insert_one(content_doc)
    del content_doc["_id"] if "_id" in content_doc else None
    return content_doc

@api_router.put("/content/{content_id}", response_model=ContentResponse)
async def update_content(content_id: str, data: ContentCreate, admin: dict = Depends(get_current_admin)):
    content_doc = {
        **data.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.content.update_one({"id": content_id}, {"$set": content_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content = await db.content.find_one({"id": content_id}, {"_id": 0})
    return content

@api_router.delete("/content/{content_id}")
async def delete_content(content_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.content.delete_one({"id": content_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    return {"message": "Content deleted"}

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/stats", response_model=StatsResponse)
async def get_stats(admin: dict = Depends(get_current_admin)):
    total_users = await db.bot_users.count_documents({})
    total_mfos = await db.mfos.count_documents({})
    total_applications = await db.applications.count_documents({})
    total_clicks = await db.clicks.count_documents({})
    pending_applications = await db.applications.count_documents({"status": "pending"})
    
    conversion_rate = 0
    if total_clicks > 0:
        conversion_rate = round((total_applications / total_clicks) * 100, 2)
    
    return StatsResponse(
        total_users=total_users,
        total_mfos=total_mfos,
        total_applications=total_applications,
        total_clicks=total_clicks,
        pending_applications=pending_applications,
        conversion_rate=conversion_rate
    )

@api_router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(admin: dict = Depends(get_current_admin)):
    total_users = await db.bot_users.count_documents({})
    total_applications = await db.applications.count_documents({})
    total_clicks = await db.clicks.count_documents({})
    
    # Applications by status
    pipeline_status = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_result = await db.applications.aggregate(pipeline_status).to_list(100)
    applications_by_status = {item["_id"]: item["count"] for item in status_result}
    
    # Clicks by MFO
    pipeline_clicks = [
        {"$group": {"_id": "$mfo_id", "clicks": {"$sum": 1}}},
        {"$sort": {"clicks": -1}},
        {"$limit": 10}
    ]
    clicks_result = await db.clicks.aggregate(pipeline_clicks).to_list(10)
    clicks_by_mfo = []
    for item in clicks_result:
        mfo = await db.mfos.find_one({"id": item["_id"]}, {"_id": 0})
        if mfo:
            clicks_by_mfo.append({"name": mfo["name"], "clicks": item["clicks"]})
    
    # Users by day (last 7 days)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    pipeline_users = [
        {"$match": {"created_at": {"$gte": seven_days_ago}}},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    users_result = await db.bot_users.aggregate(pipeline_users).to_list(7)
    users_by_day = [{"date": item["_id"], "count": item["count"]} for item in users_result]
    
    # Applications by day
    pipeline_apps = [
        {"$match": {"created_at": {"$gte": seven_days_ago}}},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    apps_result = await db.applications.aggregate(pipeline_apps).to_list(7)
    applications_by_day = [{"date": item["_id"], "count": item["count"]} for item in apps_result]
    
    return AnalyticsResponse(
        total_users=total_users,
        total_applications=total_applications,
        total_clicks=total_clicks,
        applications_by_status=applications_by_status,
        clicks_by_mfo=clicks_by_mfo,
        users_by_day=users_by_day,
        applications_by_day=applications_by_day
    )

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "Microloan Bot API"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
