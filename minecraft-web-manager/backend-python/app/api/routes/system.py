"""Router de información del sistema"""
from fastapi import APIRouter, Depends
from app.core.deps import require_any_role
from app.schemas.schemas import SystemInfo
from app.services.system_service import system_service

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/info", response_model=SystemInfo)
async def get_system_info(current_user = Depends(require_any_role)):
    """Obtener información del sistema"""
    info = await system_service.get_system_info()
    return info


@router.get("/health")
async def health_check():
    """Health check (sin autenticación)"""
    return {"status": "ok"}
