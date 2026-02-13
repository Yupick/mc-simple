"""Controlador para gestión de administradores del panel web"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.core.security import get_password_hash


router = APIRouter()


class AdminRequest(BaseModel):
    username: str
    password: Optional[str] = None  # Solo requerido al crear
    role: str = "admin"  # admin, moderator, viewer


@router.get("")
async def get_admins(db: Session = Depends(get_db)):
    """Obtener lista de usuarios administradores del panel web"""
    try:
        users = db.query(User).all()
        
        admins = []
        for user in users:
            admin = {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
            admins.append(admin)
        
        return {"admins": admins, "total": len(admins)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def add_admin(request: AdminRequest, db: Session = Depends(get_db)):
    """Agregar un nuevo administrador del panel web"""
    try:
        # Validar que se proporcione contraseña al crear
        if not request.password:
            raise HTTPException(status_code=400, detail="La contraseña es requerida al crear un usuario")
        
        # Validar rol
        if request.role not in ["admin", "moderator", "viewer"]:
            raise HTTPException(status_code=400, detail="Rol inválido. Debe ser: admin, moderator o viewer")
        
        # Verificar si el usuario ya existe
        existing_user = db.query(User).filter(User.username == request.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
        
        # Crear nuevo usuario
        new_user = User(
            username=request.username,
            password_hash=get_password_hash(request.password),
            role=request.role,
            created_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "message": f"Usuario {request.username} creado exitosamente",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "role": new_user.role
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}")
async def update_admin(user_id: int, request: AdminRequest, db: Session = Depends(get_db)):
    """Actualizar un administrador del panel web"""
    try:
        # Validar rol
        if request.role not in ["admin", "moderator", "viewer"]:
            raise HTTPException(status_code=400, detail="Rol inválido. Debe ser: admin, moderator o viewer")
        
        # Buscar usuario
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Actualizar campos
        user.role = request.role
        
        # Si se proporciona nueva contraseña
        if request.password:
            user.password_hash = get_password_hash(request.password)
        
        db.commit()
        db.refresh(user)
        
        return {
            "success": True,
            "message": f"Usuario {user.username} actualizado exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}")
async def delete_admin(user_id: int, db: Session = Depends(get_db)):
    """Eliminar un administrador del panel web"""
    try:
        # Buscar usuario
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar que no sea el último admin
        admin_count = db.query(User).filter(User.role == "admin").count()
        if user.role == "admin" and admin_count <= 1:
            raise HTTPException(
                status_code=400, 
                detail="No se puede eliminar el último administrador del sistema"
            )
        
        username = user.username
        db.delete(user)
        db.commit()
        
        return {
            "success": True,
            "message": f"Usuario {username} eliminado exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
