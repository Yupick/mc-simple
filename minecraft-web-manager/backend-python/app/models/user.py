"""Modelo de Usuario"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.session import Base


class User(Base):
    """Modelo de usuario del sistema"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="viewer")  # admin, moderator, viewer
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime, nullable=True)
