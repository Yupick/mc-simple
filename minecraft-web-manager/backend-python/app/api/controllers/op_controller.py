"""Controlador para gestión de operadores"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.op_service import op_service


router = APIRouter()


class AddOperatorRequest(BaseModel):
    username: str
    uuid: str
    level: int = 4
    bypass_limit: bool = False


class ChangeOpLevelRequest(BaseModel):
    new_level: int


class UpdateOpConfigRequest(BaseModel):
    op_permission_level: Optional[int] = None
    function_permission_level: Optional[int] = None


@router.get("")
async def get_operators():
    """Obtener lista de operadores"""
    try:
        ops = await op_service.get_operators()
        return {"operators": ops, "total": len(ops)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def add_operator(request: AddOperatorRequest):
    """Agregar un operador"""
    try:
        if request.level < 1 or request.level > 4:
            raise HTTPException(status_code=400, detail="El nivel debe estar entre 1 y 4")
        
        success = await op_service.add_operator(
            request.username,
            request.uuid,
            request.level,
            request.bypass_limit
        )
        
        if success:
            return {
                "success": True,
                "message": f"{request.username} agregado como operador nivel {request.level}"
            }
        else:
            raise HTTPException(status_code=400, detail="No se pudo agregar el operador")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{uuid}")
async def remove_operator(uuid: str):
    """Remover un operador"""
    try:
        success = await op_service.remove_operator(uuid)
        if success:
            return {"success": True, "message": "Operador removido"}
        else:
            raise HTTPException(status_code=404, detail="Operador no encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{uuid}")
async def change_op_level(uuid: str, request: ChangeOpLevelRequest):
    """Cambiar el nivel de OP de un operador"""
    try:
        if request.new_level < 1 or request.new_level > 4:
            raise HTTPException(status_code=400, detail="El nivel debe estar entre 1 y 4")
        
        success = await op_service.change_op_level(uuid, request.new_level)
        if success:
            return {"success": True, "message": f"Nivel actualizado a {request.new_level}"}
        else:
            raise HTTPException(status_code=404, detail="Operador no encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_op_config():
    """Obtener configuración de operadores"""
    try:
        config = await op_service.get_op_config()
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/config")
async def update_op_config(request: UpdateOpConfigRequest):
    """Actualizar configuración de operadores"""
    try:
        success = await op_service.update_op_config(
            request.op_permission_level,
            request.function_permission_level
        )
        
        if success:
            return {"success": True, "message": "Configuración actualizada"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo actualizar la configuración")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
