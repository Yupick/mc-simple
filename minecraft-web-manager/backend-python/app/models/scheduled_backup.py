"""Modelo de Backups Programados"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.session import Base


class ScheduledBackup(Base):
    """Modelo de backups programados (futuro)"""
    
    __tablename__ = "scheduled_backups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # full, world, plugins, config
    cron_expression = Column(String(50), nullable=False)  # 0 0 * * *
    enabled = Column(Boolean, default=True)
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
