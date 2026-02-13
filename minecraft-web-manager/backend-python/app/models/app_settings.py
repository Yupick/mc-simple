"""Modelo de Configuración de la Aplicación"""
from sqlalchemy import Column, Integer, String, Text
from app.db.session import Base


class AppSettings(Base):
    """Modelo de configuración de la aplicación (key-value)"""
    
    __tablename__ = "app_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
