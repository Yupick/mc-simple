from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.models.session import Session as UserSession
from app.models.audit_log import AuditLog
from app.schemas.auth import TokenResponse


class AuthController:
    @staticmethod
    async def login(
        username: str,
        password: str,
        response: Response,
        request: Request,
        db: Session
    ) -> TokenResponse:
        """Login de usuario y creación de sesión"""
        
        # Buscar usuario
        user = db.query(User).filter(User.username == username).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )
        
        # Crear tokens
        access_token = create_access_token({"sub": str(user.id), "role": user.role})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        # Crear sesión en DB
        expires_at = datetime.utcnow() + timedelta(days=7)
        session = UserSession(
            user_id=user.id,
            token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", "")
        )
        db.add(session)
        
        # Actualizar last_login
        user.last_login = datetime.utcnow()
        
        # Audit log
        audit = AuditLog(
            user_id=user.id,
            action="login",
            resource_type="auth",
            ip_address=request.client.host,
            details={"username": username}
        )
        db.add(audit)
        
        db.commit()
        
        # Establecer cookie HttpOnly
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=7200,  # 2 horas
            samesite="lax"
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user={"id": user.id, "username": user.username, "role": user.role}
        )
    
    @staticmethod
    async def logout(user_id: int, request: Request, response: Response, db: Session):
        """Logout y eliminación de sesión"""
        
        # Obtener token de la cookie
        token = request.cookies.get("access_token")
        
        if token:
            # Eliminar sesión de DB
            db.query(UserSession).filter(UserSession.token == token).delete()
            db.commit()
        
        # Audit log
        audit = AuditLog(
            user_id=user_id,
            action="logout",
            resource_type="auth",
            ip_address=request.client.host
        )
        db.add(audit)
        db.commit()
        
        # Eliminar cookie
        response.delete_cookie("access_token")
        
        return {"message": "Logout exitoso"}
    
    @staticmethod
    async def refresh_token(
        old_token: str,
        response: Response,
        db: Session
    ) -> TokenResponse:
        """Renovar access token usando refresh token"""
        
        # Buscar sesión
        session = db.query(UserSession).filter(
            UserSession.refresh_token == old_token
        ).first()
        
        if not session or session.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o expirado"
            )
        
        # Obtener usuario
        user = db.query(User).filter(User.id == session.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado"
            )
        
        # Crear nuevo access token
        new_access_token = create_access_token({"sub": str(user.id), "role": user.role})
        
        # Actualizar sesión
        session.token = new_access_token
        db.commit()
        
        # Actualizar cookie
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            max_age=7200,
            samesite="lax"
        )
        
        return TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            user={"id": user.id, "username": user.username, "role": user.role}
        )
    
    @staticmethod
    async def get_current_user(user_id: int, db: Session):
        """Obtener información del usuario actual"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
