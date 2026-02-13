"""Configuración de la aplicación usando Pydantic Settings"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # Servidor
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Rutas Minecraft
    SERVER_PATH: str
    BACKUP_PATH: str = "../backups"
    
    # Seguridad
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # RCON
    RCON_PASSWORD: str = ""
    
    # Base de datos
    DATABASE_URL: str = "sqlite:///./data/minecraft-manager.db"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:8000"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convierte ALLOWED_ORIGINS en lista"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Instancia global de configuración
settings = Settings()
