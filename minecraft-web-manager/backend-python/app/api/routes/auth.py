"""Router de autenticación"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.user import User
from app.models.session import Session as DBSession
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.deps import get_current_user_from_cookie
from app.schemas.schemas import LoginRequest, UserResponse, MessageResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(
    credentials: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login con usuario y contraseña"""
    # Buscar usuario
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    # Crear tokens
    token_data = {"user_id": user.id, "username": user.username, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Guardar sesión en BD
    session = DBSession(
        user_id=user.id,
        token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(hours=2)
    )
    db.add(session)
    
    # Actualizar last_login
    user.last_login = datetime.utcnow()
    
    db.commit()
    
    # Establecer cookies HttpOnly
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False  # Cambiar a True en producción con HTTPS
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False
    )
    
    return {
        "success": True,
        "message": "Login exitoso",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """Logout - eliminar cookies y sesión"""
    # Eliminar cookies
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    
    # Eliminar sesiones de BD
    db.query(DBSession).filter(DBSession.user_id == current_user.id).delete()
    db.commit()
    
    return {"success": True, "message": "Logout exitoso"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(get_current_user_from_cookie)
):
    """Obtener usuario actual"""
    return current_user
