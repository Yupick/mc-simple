"""Router de configuración"""
from fastapi import APIRouter, Depends
from typing import Dict
from app.core.deps import require_any_role, require_moderator, require_admin
from app.schemas.schemas import UpdatePropertiesRequest, UpdateWhitelistRequest, UpdateOpsRequest, MessageResponse
from app.services.config_service import config_service

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/server-properties")
async def get_server_properties(current_user = Depends(require_any_role)):
    """Obtener server.properties"""
    properties = await config_service.get_server_properties()
    return properties


@router.put("/server-properties", response_model=MessageResponse)
async def update_server_properties(
    update_req: UpdatePropertiesRequest,
    current_user = Depends(require_moderator)
):
    """Actualizar server.properties"""
    result = await config_service.update_server_properties(update_req.properties)
    return result


@router.get("/whitelist")
async def get_whitelist(current_user = Depends(require_any_role)):
    """Obtener whitelist"""
    whitelist = await config_service.get_whitelist()
    return whitelist


@router.put("/whitelist", response_model=MessageResponse)
async def update_whitelist(
    update_req: UpdateWhitelistRequest,
    current_user = Depends(require_moderator)
):
    """Actualizar whitelist"""
    result = await config_service.update_whitelist(update_req.whitelist)
    return result


@router.get("/ops")
async def get_ops(current_user = Depends(require_any_role)):
    """Obtener ops"""
    ops = await config_service.get_ops()
    return ops


@router.put("/ops", response_model=MessageResponse)
async def update_ops(
    update_req: UpdateOpsRequest,
    current_user = Depends(require_admin)
):
    """Actualizar ops"""
    result = await config_service.update_ops(update_req.ops)
    return result
