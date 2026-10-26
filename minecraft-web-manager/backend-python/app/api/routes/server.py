"""Router de control del servidor Minecraft"""
import json
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.deps import require_admin, require_any_role, require_moderator
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.schemas.schemas import (
    JavaMemoryRequest,
    MaintenanceUpdateRequest,
    ServerStatus,
    CommandRequest,
    MessageResponse,
)
from app.services.server_service import server_service
from app.services.maintenance_service import maintenance_service

router = APIRouter(prefix="/api/server", tags=["server"])


@router.get("/status", response_model=ServerStatus)
async def get_server_status(current_user = Depends(require_any_role)):
    """Obtener estado del servidor"""
    status = await server_service.get_status()
    return status


@router.get("/info")
async def get_server_info(current_user = Depends(require_any_role)):
    """Obtener información del servidor"""
    from app.core.config import settings
    from pathlib import Path
    
    server_path = Path(settings.SERVER_PATH)

    version = server_service.get_version()["full"]
    
    # Mundo activo
    from app.services.world_service import world_service
    active_world = await world_service.get_active_world()
    
    return {
        "version": version,
        "server_path": str(server_path),
        "active_world": active_world["name"] if active_world else "Ninguno"
    }


@router.get("/logs")
async def get_server_logs(
    lines: int = 100,
    current_user = Depends(require_any_role)
):
    """Obtener logs del servidor"""
    result = await server_service.get_logs(lines)
    return result


@router.post("/start", response_model=MessageResponse)
async def start_server(current_user = Depends(require_moderator)):
    """Iniciar servidor"""
    async with maintenance_service.lock:
        if maintenance_service.is_busy():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Hay una actualización en curso")
        result = await server_service.start_server()
    return result


@router.post("/stop", response_model=MessageResponse)
async def stop_server(current_user = Depends(require_moderator)):
    """Detener servidor"""
    result = await server_service.stop_server()
    return result


@router.post("/restart", response_model=MessageResponse)
async def restart_server(current_user = Depends(require_moderator)):
    """Reiniciar servidor"""
    async with maintenance_service.lock:
        if maintenance_service.is_busy():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Hay una actualización en curso")
        result = await server_service.restart_server()
    return result


@router.post("/command")
async def send_command(
    command_req: CommandRequest,
    current_user = Depends(require_moderator)
):
    """Enviar comando RCON al servidor"""
    result = await server_service.send_command(command_req.command)
    return result


@router.get("/java-memory")
async def get_java_memory(current_user = Depends(require_admin)):
    """Leer los límites Xms/Xmx configurados para Java"""
    try:
        memory = server_service.get_java_memory()
    except (OSError, ValueError) as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

    return {**memory, "running": server_service.is_running()}


@router.put("/java-memory")
async def update_java_memory(
    request: Request,
    update: JavaMemoryRequest,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Actualizar Xms/Xmx solo cuando el servidor está detenido"""
    async with maintenance_service.lock:
        if maintenance_service.is_busy():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Hay una actualización en curso")
        try:
            memory = server_service.set_java_memory(update.min_ram, update.max_ram)
        except RuntimeError as error:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
        except (OSError, ValueError) as error:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))

    db.add(AuditLog(
        user_id=current_user.id,
        action="update_java_memory",
        resource_type="server",
        resource_id="java-memory.conf",
        details=f"MIN_RAM={memory['min_ram']};MAX_RAM={memory['max_ram']}",
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()
    return {"success": True, "message": "Memoria Java actualizada", **memory}


@router.get("/maintenance/check")
async def check_maintenance_updates(current_user = Depends(require_admin)):
    """Consultar Paper y versiones estables disponibles para plugins soportados"""
    try:
        return await maintenance_service.check_updates()
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error))


@router.post("/maintenance")
async def start_maintenance_update(
    update: MaintenanceUpdateRequest,
    request: Request,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Iniciar un job de actualización sin bloquear la conexión web"""
    try:
        job = await maintenance_service.start_update(update.paper, update.plugins, update.version)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    db.add(AuditLog(
        user_id=current_user.id,
        action="server_maintenance_started",
        resource_type="server",
        resource_id=job["id"],
        details=json.dumps(update.model_dump(), ensure_ascii=True),
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()
    return job


@router.get("/maintenance/{job_id}")
async def get_maintenance_job(job_id: str, current_user = Depends(require_admin)):
    """Consultar el estado de un job de mantenimiento"""
    job = maintenance_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    return job
