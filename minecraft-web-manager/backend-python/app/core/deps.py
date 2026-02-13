"""Dependencies para FastAPI (inyección de dependencias)"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Cookie, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.session import Session as DBSession
from app.core.security import decode_token
from datetime import datetime


async def get_current_user_from_cookie(
    token: Optional[str] = Cookie(None, alias="access_token"),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtener usuario actual desde cookie HttpOnly
    
    Args:
        token: Token JWT desde cookie
        db: Sesión de base de datos
    
    Returns:
        Usuario autenticado
    
    Raises:
        HTTPException: Si token es inválido o usuario no existe
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    # Decodificar token
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    # Verificar tipo de token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de token inválido"
        )
    
    # Obtener usuario
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    return user


async def get_current_user_optional(
    token: Optional[str] = Cookie(None, alias="access_token"),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Obtener usuario actual (opcional, no lanza error si no hay)"""
    try:
        return await get_current_user_from_cookie(token, db)
    except HTTPException:
        return None


def require_role(allowed_roles: list):
    """
    Dependency factory para requerir roles específicos
    
    Args:
        allowed_roles: Lista de roles permitidos (admin, moderator, viewer)
    
    Returns:
        Dependency function
    """
    async def role_checker(
        current_user: User = Depends(get_current_user_from_cookie)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requiere rol: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


# Aliases para roles comunes
require_admin = require_role(["admin"])
require_moderator = require_role(["admin", "moderator"])
require_any_role = require_role(["admin", "moderator", "viewer"])
