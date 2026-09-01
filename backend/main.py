# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

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
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    db_lead = models.Lead(
        keyword_id=lead.keyword_id,
        content=lead.content,
        source_url=lead.source_url
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
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