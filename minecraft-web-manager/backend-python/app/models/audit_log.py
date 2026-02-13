"""Modelo de Registro de Auditoría"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.session import Base


class AuditLog(Base):
    """Modelo de log de auditoría"""
    
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # login, server_start, world_change, etc.
    resource_type = Column(String(50), nullable=True)  # server, world, plugin, backup, config
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)  # JSON con detalles adicionales
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
