"""Configuración de la base de datos SQLAlchemy"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Motor de base de datos
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# SessionLocal para crear sesiones de BD
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


def get_db():
    """
    Dependency para obtener sesión de base de datos
    
    Yields:
        Session: Sesión de base de datos
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Inicializar base de datos: crear todas las tablas
    """
    # Importar todos los modelos para que SQLAlchemy los registre
    from app.models.user import User
    from app.models.session import Session
    from app.models.audit_log import AuditLog
    from app.models.backup_history import BackupHistory
    from app.models.scheduled_backup import ScheduledBackup
    from app.models.app_settings import AppSettings
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas de base de datos creadas/verificadas")
