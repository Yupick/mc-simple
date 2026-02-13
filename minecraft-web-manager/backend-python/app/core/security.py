"""Funciones de seguridad: JWT, bcrypt, etc."""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar password contra hash"""
    # Asegurar que todo sea bytes
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    
    # Truncar password a 72 bytes (límite de bcrypt)
    plain_password = plain_password[:72]
    
    return bcrypt.checkpw(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generar hash bcrypt de password (12 rounds)"""
    # Convertir a bytes y truncar a 72 bytes (límite de bcrypt)
    if isinstance(password, str):
        password = password.encode('utf-8')
    password = password[:72]
    
    # Generar hash con bcrypt (12 rounds)
    hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
    
    # Retornar como string
    return hashed.decode('utf-8')


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crear JWT access token
    
    Args:
        data: Datos a codificar en el token
        expires_delta: Tiempo de expiración personalizado
    
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Crear JWT refresh token
    
    Args:
        data: Datos a codificar en el token
    
    Returns:
        Refresh token JWT codificado
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodificar y validar JWT token
    
    Args:
        token: Token JWT a decodificar
    
    Returns:
        Payload del token o None si es inválido
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
