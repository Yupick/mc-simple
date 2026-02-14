"""Router de gestión de plugins"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from app.core.deps import require_any_role, require_moderator, require_admin, get_current_user, get_db
from app.schemas.schemas import PluginInfo, MessageResponse
from app.services.plugin_service import plugin_service
from app.api.controllers.plugins_controller import PluginsController
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/plugins", tags=["plugins"])
plugins_controller = PluginsController()


@router.get("/", response_model=List[PluginInfo])
async def list_plugins(current_user = Depends(require_any_role)):
    """Listar plugins instalados"""
    plugins = await plugin_service.list_plugins()
    return plugins


@router.put("/{plugin_name}/toggle", response_model=MessageResponse)
async def toggle_plugin(plugin_name: str, current_user = Depends(require_moderator)):
    """Enable/disable plugin"""
    result = await plugin_service.toggle_plugin(plugin_name)
    return result


@router.post("/upload", response_model=MessageResponse)
async def upload_plugin(
    file: UploadFile = File(...),
    current_user = Depends(require_moderator)
):
    """Subir nuevo plugin (.jar)"""
    # Validar extensión
    if not file.filename.endswith('.jar'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos .jar")
    
    # Validar tamaño (máx 100MB)
    max_size = 100 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="El archivo es demasiado grande (máximo 100MB)")
    
    result = await plugin_service.upload_plugin(file.filename, content)
    return result


@router.delete("/{plugin_name}", response_model=MessageResponse)
async def delete_plugin(plugin_name: str, current_user = Depends(require_admin)):
    """Eliminar plugin"""
    result = await plugin_service.delete_plugin(plugin_name)
    return result


# Rutas para plugins recomendados
@router.get("/recommended")
async def get_recommended_plugins(current_user = Depends(require_any_role)):
    """Obtener lista de plugins recomendados con estado de instalación"""
    return await plugins_controller.get_recommended()


@router.post("/recommended/{plugin_id}/install")
async def install_recommended_plugin(
    plugin_id: str,
    current_user = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    """Instalar plugin recomendado desde Modrinth"""
    return await plugins_controller.install_recommended(plugin_id, current_user.id, db)


@router.delete("/recommended/{plugin_id}")
async def uninstall_recommended_plugin(
    plugin_id: str,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Desinstalar plugin recomendado"""
    return await plugins_controller.uninstall_recommended(plugin_id, current_user.id, db)

