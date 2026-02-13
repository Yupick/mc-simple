"""Modelo de Historial de Backups"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Text
from sqlalchemy.sql import func
from app.db.session import Base


class BackupHistory(Base):
    """Modelo de historial de backups"""
    
    __tablename__ = "backup_history"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)  # full, world, plugins, config
    size_bytes = Column(BigInteger, nullable=True)
    path = Column(String(500), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), nullable=False, default="completed")  # completed, failed, in_progress
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
