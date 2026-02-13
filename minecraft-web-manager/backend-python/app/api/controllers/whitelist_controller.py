"""Controlador para gestión de whitelist"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.whitelist_service import whitelist_service


router = APIRouter()


class AddToWhitelistRequest(BaseModel):
    username: str
    uuid: str


class ToggleWhitelistRequest(BaseModel):
    enabled: bool


class SetEnforceRequest(BaseModel):
    enforce: bool


@router.get("")
async def get_whitelist():
    """Obtener lista de jugadores en la whitelist"""
    try:
        whitelist = await whitelist_service.get_whitelist()
        return {"whitelist": whitelist, "total": len(whitelist)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def add_to_whitelist(request: AddToWhitelistRequest):
    """Agregar un jugador a la whitelist"""
    try:
        success = await whitelist_service.add_to_whitelist(request.username, request.uuid)
        if success:
            return {"success": True, "message": f"{request.username} agregado a la whitelist"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo agregar a la whitelist")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{uuid}")
async def remove_from_whitelist(uuid: str):
    """Remover un jugador de la whitelist"""
    try:
        success = await whitelist_service.remove_from_whitelist(uuid)
        if success:
            return {"success": True, "message": "Jugador removido de la whitelist"}
        else:
            raise HTTPException(status_code=404, detail="Jugador no encontrado en la whitelist")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("")
async def clear_whitelist():
    """Limpiar toda la whitelist"""
    try:
        success = await whitelist_service.clear_whitelist()
        if success:
            return {"success": True, "message": "Whitelist limpiada"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo limpiar la whitelist")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_whitelist_status():
    """Obtener estado de la whitelist"""
    try:
        config = await whitelist_service.get_whitelist_config()
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/status")
async def toggle_whitelist(request: ToggleWhitelistRequest):
    """Activar o desactivar la whitelist"""
    try:
        success = await whitelist_service.toggle_whitelist(request.enabled)
        if success:
            status = "activada" if request.enabled else "desactivada"
            return {"success": True, "message": f"Whitelist {status}"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo cambiar el estado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/enforce")
async def set_enforce_whitelist(request: SetEnforceRequest):
    """Configurar enforce-whitelist"""
    try:
        success = await whitelist_service.set_enforce_whitelist(request.enforce)
        if success:
            status = "activado" if request.enforce else "desactivado"
            return {"success": True, "message": f"Enforce whitelist {status}"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo cambiar la configuración")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
