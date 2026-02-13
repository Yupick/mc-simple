"""Base de datos - importa todos los modelos para migraciones"""
from app.db.session import Base

# Importar todos los modelos aquí
from app.models.user import User
from app.models.session import Session
from app.models.audit_log import AuditLog
from app.models.backup_history import BackupHistory
from app.models.scheduled_backup import ScheduledBackup
from app.models.app_settings import AppSettings
