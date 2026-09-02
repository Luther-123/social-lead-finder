# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from typing import List
from fastapi import WebSocket, WebSocketDisconnect

from database import engine, SessionLocal
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Social Lead Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class KeywordCreate(BaseModel):
    term: str

class LeadCreate(BaseModel):
    keyword_id: int
    content: str
    source_url: str

@app.post("/keywords/")
def create_keyword(keyword: KeywordCreate, db: Session = Depends(get_db)):
    db_kw = models.Keyword(term=keyword.term)
    db.add(db_kw)
    db.commit()
    db.refresh(db_kw)
    return db_kw

@app.get("/keywords/")
def get_keywords(db: Session = Depends(get_db)):
    return db.query(models.Keyword).all()

@app.post("/leads/")
async def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    db_lead = models.Lead(
        keyword_id=lead.keyword_id,
        content=lead.content,
        source_url=lead.source_url
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    # Broadcast the new lead to all active WebSocket clients
    await manager.broadcast({
        "id": db_lead.id,
        "keyword_id": db_lead.keyword_id,
        "content": db_lead.content,
        "source_url": db_lead.source_url
    })
    
    return db_lead

@app.get("/leads/")
def get_leads(keyword_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Lead)
    if keyword_id:
        query = query.filter(models.Lead.keyword_id == keyword_id)
    return query.all()

@app.delete("/keywords/{keyword_id}")
def delete_keyword(keyword_id: int, db: Session = Depends(get_db)):
    db_kw = db.query(models.Keyword).filter(models.Keyword.id == keyword_id).first()
    if not db_kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    db.delete(db_kw)
    db.commit()
    return {"message": "Keyword deleted successfully"}

@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(db_lead)
    db.commit()
    return {"message": "Lead deleted successfully"}
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/leads")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive waiting for client messages if needed
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)