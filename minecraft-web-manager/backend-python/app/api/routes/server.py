"""Router de control del servidor Minecraft"""
from fastapi import APIRouter, Depends
from app.core.deps import require_any_role, require_moderator
from app.schemas.schemas import ServerStatus, CommandRequest, MessageResponse
from app.services.server_service import server_service

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
    
    # Obtener versión de Paper
    version = "Desconocida"
    version_file = server_path / "version_history.json"
    if version_file.exists():
        import json
        try:
            version_data = json.loads(version_file.read_text())
            if version_data:
                version = version_data[0].get("id", "Desconocida")
        except:
            pass
    
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
    result = await server_service.start_server()
    return result


@router.post("/stop", response_model=MessageResponse)
async def stop_server(current_user = Depends(require_moderator)):
    """Detener servidor"""
    result = await server_service.stop_server()


@router.post("/restart", response_model=MessageResponse)
async def restart_server(current_user = Depends(require_moderator)):
    """Reiniciar servidor"""
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
