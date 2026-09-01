from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()

class Keyword(Base):
    __tablename__ = "keywords"
    id = Column(Integer, primary_key=True, index=True)
    term = Column(String, unique=True, index=True)
    leads = relationship("Lead", back_populates="keyword")

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    keyword_id = Column(Integer, ForeignKey("keywords.id"))
    content = Column(Text)
    source_url = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    keyword = relationship("Keyword", back_populates="leads")