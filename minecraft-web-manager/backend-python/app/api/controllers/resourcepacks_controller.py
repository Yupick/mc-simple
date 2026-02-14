"""Controlador para gestión de Resource Packs"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from app.services.resourcepack_service import resourcepack_service


router = APIRouter()


class ConfigUpdate(BaseModel):
    autoHost: Optional[bool] = None
    forceResourcePack: Optional[bool] = None
    resourcePackPrompt: Optional[str] = None


class PriorityUpdate(BaseModel):
    priorityOrder: List[str]


class PluginToggle(BaseModel):
    enabled: bool


@router.get("/status")
async def get_status():
    """Obtener estado del plugin ResourcePackManager"""
    try:
        status = resourcepack_service.get_plugin_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_config():
    """Obtener configuración actual de config.yml"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        config = resourcepack_service.parse_config()
        if config is None:
            raise HTTPException(status_code=404, detail="Archivo config.yml no encontrado")
        
        return {"config": config}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/config")
async def update_config(data: ConfigUpdate):
    """Actualizar configuración de config.yml"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        # Convertir a dict solo con valores no None
        update_data = {}
        if data.autoHost is not None:
            update_data['autoHost'] = data.autoHost
        if data.forceResourcePack is not None:
            update_data['forceResourcePack'] = data.forceResourcePack
        if data.resourcePackPrompt is not None:
            update_data['resourcePackPrompt'] = data.resourcePackPrompt
        
        success = resourcepack_service.update_config(update_data)
        
        if success:
            return {"success": True, "message": "Configuración actualizada"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo actualizar la configuración")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/priority")
async def update_priority(data: PriorityUpdate):
    """Actualizar orden de prioridad"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        success = resourcepack_service.update_priority_order(data.priorityOrder)
        
        if success:
            return {"success": True, "message": "Orden de prioridad actualizado"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo actualizar el orden")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/packs")
async def list_packs():
    """Listar resource packs en mixer/"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        packs = resourcepack_service.list_mixer_packs()
        return {"packs": packs, "total": len(packs)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/packs")
async def upload_pack(file: UploadFile = File(...)):
    """Subir nuevo resource pack a mixer/"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        # Validar extensión
        if not file.filename.endswith('.zip'):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos .zip")
        
        # Validar tamaño (100MB max)
        content = await file.read()
        if len(content) > 100 * 1024 * 1024:  # 100MB
            raise HTTPException(status_code=400, detail="Archivo demasiado grande (máx 100MB)")
        
        # Guardar
        success = resourcepack_service.upload_pack(content, file.filename)
        
        if success:
            return {
                "success": True,
                "message": f"Pack {file.filename} subido exitosamente",
                "filename": file.filename
            }
        else:
            raise HTTPException(status_code=400, detail="No se pudo subir el pack")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/packs/{filename}")
async def delete_pack(filename: str):
    """Eliminar resource pack de mixer/"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        success = resourcepack_service.delete_pack(filename)
        
        if success:
            return {"success": True, "message": f"Pack {filename} eliminado"}
        else:
            raise HTTPException(status_code=404, detail="Pack no encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plugins")
async def list_compatible_plugins():
    """Listar plugins compatibles detectados"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        plugins = resourcepack_service.list_compatible_plugins()
        return {"plugins": plugins, "total": len(plugins)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/plugins/{plugin_name}")
async def toggle_plugin(plugin_name: str, data: PluginToggle):
    """Habilitar/deshabilitar plugin compatible"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        success = resourcepack_service.toggle_plugin(plugin_name, data.enabled)
        
        if success:
            status = "habilitado" if data.enabled else "deshabilitado"
            return {"success": True, "message": f"Plugin {plugin_name} {status}"}
        else:
            raise HTTPException(status_code=404, detail="Plugin no encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collisions")
async def get_collisions():
    """Obtener log de colisiones"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        log_content = resourcepack_service.read_collision_log()
        return {"log": log_content, "lines": len(log_content.splitlines()) if log_content else 0}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/output")
async def get_output_info():
    """Obtener información del pack final generado"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        output_info = resourcepack_service.get_output_info()
        return output_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reload")
async def reload_plugin():
    """Recargar plugin vía comando RCON"""
    try:
        if not resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=404, detail="Plugin no instalado")
        
        success = await resourcepack_service.reload_plugin()
        
        if success:
            return {"success": True, "message": "Plugin recargado exitosamente"}
        else:
            raise HTTPException(status_code=500, detail="Error al recargar plugin. Verifica RCON.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/install")
async def install_plugin():
    """Descargar e instalar plugin desde Modrinth"""
    try:
        if resourcepack_service.is_plugin_installed():
            raise HTTPException(status_code=400, detail="Plugin ya está instalado")
        
        success = await resourcepack_service.install_plugin()
        
        if success:
            return {
                "success": True,
                "message": "Plugin instalado. Reinicia el servidor para aplicar cambios."
            }
        else:
            raise HTTPException(status_code=500, detail="Error al descargar el plugin")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
