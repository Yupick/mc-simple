"""Router de sistema de backups"""
from fastapi import APIRouter, Depends
from typing import List
from app.core.deps import require_any_role, require_moderator, require_admin
from app.schemas.schemas import BackupInfo, CreateBackupRequest, MessageResponse
from app.services.backup_service import backup_service

router = APIRouter(prefix="/api/backups", tags=["backups"])


@router.get("/", response_model=List[BackupInfo])
async def list_backups(current_user = Depends(require_any_role)):
    """Listar backups disponibles"""
    backups = await backup_service.list_backups()
    return backups


@router.post("/", response_model=MessageResponse)
async def create_backup(
    backup_req: CreateBackupRequest,
    current_user = Depends(require_moderator)
):
    """Crear backup"""
    result = await backup_service.create_backup(
        backup_req.type,
        backup_req.description
    )
    return result


@router.delete("/{filename}", response_model=MessageResponse)
async def delete_backup(filename: str, current_user = Depends(require_admin)):
    """Eliminar backup"""
    result = await backup_service.delete_backup(filename)
    return result
