"""Controlador para gestión de administradores (alias amigable de operadores)"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.op_service import op_service


router = APIRouter()


class AdminRequest(BaseModel):
    name: str
    uuid: Optional[str] = ""
    level: int = 4
    bypassesPlayerLimit: bool = False


@router.get("")
async def get_admins():
    """Obtener lista de administradores (operadores)"""
    try:
        ops = await op_service.get_operators()
        
        # Agregar campo banned consultando desde ban service si está disponible
        # Por ahora solo retornamos los ops con banned=False por defecto
        admins = []
        for op in ops:
            admin = {
                "name": op.get("name"),
                "uuid": op.get("uuid", ""),
                "level": op.get("level", 4),
                "bypassesPlayerLimit": op.get("bypassesPlayerLimit", False),
                "banned": False  # TODO: Integrar con ban service
            }
            admins.append(admin)
        
        return {"admins": admins, "total": len(admins)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def add_admin(request: AdminRequest):
    """Agregar un administrador"""
    try:
        if request.level < 1 or request.level > 4:
            raise HTTPException(status_code=400, detail="El nivel debe estar entre 1 y 4")
        
        # Si no se proporciona UUID, usar el nombre como identificador temporal
        # En producción, se debería obtener el UUID real del jugador via API de Mojang
        uuid = request.uuid if request.uuid else f"offline-{request.name}"
        
        success = await op_service.add_operator(
            request.name,
            uuid,
            request.level,
            request.bypassesPlayerLimit
        )
        
        if success:
            return {
                "success": True,
                "message": f"{request.name} agregado como administrador nivel {request.level}"
            }
        else:
            raise HTTPException(status_code=400, detail="No se pudo agregar el administrador")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{name}")
async def update_admin(name: str, request: AdminRequest):
    """Actualizar un administrador"""
    try:
        if request.level < 1 or request.level > 4:
            raise HTTPException(status_code=400, detail="El nivel debe estar entre 1 y 4")
        
        # Obtener operadores actuales
        ops = await op_service.get_operators()
        operator = next((op for op in ops if op.get('name') == name), None)
        
        if not operator:
            raise HTTPException(status_code=404, detail="Administrador no encontrado")
        
        # Usar el UUID existente
        uuid = operator.get('uuid')
        
        # Actualizar (add_operator actualiza si ya existe)
        success = await op_service.add_operator(
            request.name,
            uuid,
            request.level,
            request.bypassesPlayerLimit
        )
        
        if success:
            return {
                "success": True,
                "message": f"Administrador {name} actualizado"
            }
        else:
            raise HTTPException(status_code=400, detail="No se pudo actualizar el administrador")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{name}")
async def delete_admin(name: str):
    """Eliminar un administrador"""
    try:
        # Buscar el operador por nombre para obtener UUID
        ops = await op_service.get_operators()
        operator = next((op for op in ops if op.get('name') == name), None)
        
        if not operator:
            raise HTTPException(status_code=404, detail="Administrador no encontrado")
        
        uuid = operator.get('uuid')
        success = await op_service.remove_operator(uuid)
        
        if success:
            return {"success": True, "message": f"Administrador {name} eliminado"}
        else:
            raise HTTPException(status_code=404, detail="No se pudo eliminar el administrador")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
