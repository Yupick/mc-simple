"""Router de gestión de mundos"""
from fastapi import APIRouter, Depends
from typing import List
from app.core.deps import require_any_role, require_moderator, require_admin
from app.schemas.schemas import WorldInfo, CreateWorldRequest, MessageResponse
from app.services.world_service import world_service

router = APIRouter(prefix="/api/worlds", tags=["worlds"])


@router.get("/", response_model=List[WorldInfo])
async def list_worlds(current_user = Depends(require_any_role)):
    """Listar todos los mundos"""
    worlds = await world_service.list_worlds()
    return worlds


@router.get("/active")
async def get_active_world(current_user = Depends(require_any_role)):
    """Obtener mundo activo"""
    world = await world_service.get_active_world()
    return world


@router.get("/{world_id}", response_model=WorldInfo)
async def get_world(world_id: str, current_user = Depends(require_any_role)):
    """Obtener mundo por ID"""
    world = await world_service.get_world_info(world_id)
    if not world:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Mundo no encontrado")
    return world


@router.post("/", response_model=MessageResponse)
async def create_world(
    world_req: CreateWorldRequest,
    current_user = Depends(require_moderator)
):
    """Crear nuevo mundo"""
    from datetime import datetime
    
    metadata = {
        "name": world_req.name,
        "description": world_req.description,
        "type": world_req.type,
        "icon": world_req.icon,
        "tags": world_req.tags,
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await world_service.create_world(
        world_req.id, 
        metadata, 
        world_req.settings
    )
    return result


@router.post("/{world_id}/activate", response_model=MessageResponse)
async def activate_world(world_id: str, current_user = Depends(require_moderator)):
    """Activar mundo (requiere servidor detenido)"""
    result = await world_service.activate_world(world_id)
    return result


@router.put("/{world_id}", response_model=MessageResponse)
async def update_world(world_id: str, update_data: dict, current_user = Depends(require_moderator)):
    """Actualizar configuración de mundo"""
    result = await world_service.update_world_config(world_id, update_data)
    return result


@router.delete("/{world_id}", response_model=MessageResponse)
async def delete_world(world_id: str, current_user = Depends(require_admin)):
    """Eliminar mundo"""
    result = await world_service.delete_world(world_id)
    return result
