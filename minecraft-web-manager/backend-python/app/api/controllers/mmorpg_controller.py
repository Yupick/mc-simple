"""Controlador API para plugins MMORPG"""
from fastapi import APIRouter, HTTPException, Query, Body, Depends

from app.services.mmorpg_service import mmorpg_service
from app.services.worldedit_service import worldedit_service
from app.services.luckperms_service import luckperms_service
from app.services.worldguard_service import worldguard_service
from app.core.deps import require_any_role, require_moderator

router = APIRouter()


@router.get("/status")
async def get_status():
    """Estado de plugins MMORPG"""
    status = mmorpg_service.get_status()
    any_enabled = any(item["enabled"] for item in status.values())
    return {"status": status, "any_enabled": any_enabled}


@router.get("/{plugin_id}/files")
async def list_files(plugin_id: str):
    """Listar archivos de configuración"""
    info = mmorpg_service.get_plugin(plugin_id)
    if not info:
        raise HTTPException(status_code=404, detail="Plugin no válido")

    files = mmorpg_service.list_config_files(plugin_id)
    return {"files": files}


@router.get("/{plugin_id}/file")
async def read_file(plugin_id: str, path: str = Query(...)):
    """Leer archivo de configuración"""
    try:
        content = mmorpg_service.read_config_file(plugin_id, path)
        return {"path": path, "content": content}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{plugin_id}/config")
async def get_plugin_config(plugin_id: str, current_user = Depends(require_any_role)):
    """Obtener configuración visual para un plugin MMORPG (si está soportado)"""
    # Soportar WorldEdit y LuckPerms
    if plugin_id == 'worldedit':
        try:
            config = worldedit_service.get_visual_config()
            return {"config": config}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'luckperms':
        try:
            config = luckperms_service.get_visual_config()
            return {"config": config}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'worldguard':
        try:
            config = worldguard_service.get_visual_config()
            return {"config": config}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'quests':
        try:
            from app.services.quests_service import quests_service
            config = quests_service.get_visual_config()
            return {"config": config}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'mythicmobs':
        try:
            from app.services.mythicmobs_service import mythicmobs_service
            config = mythicmobs_service.get_visual_config()
            return {"config": config}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'essentials':
        try:
            from app.services.essentials_service import essentials_service
            config = essentials_service.get_visual_config()
            return {"config": config}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Visual config no disponible para este plugin")


@router.put("/{plugin_id}/config")
async def save_plugin_config(
    plugin_id: str,
    config: dict = Body(...),
    current_user = Depends(require_moderator)
):
    """Guardar configuración visual para plugin MMORPG"""
    if plugin_id == 'worldedit':
        try:
            result = worldedit_service.save_visual_config(config)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'luckperms':
        try:
            result = luckperms_service.save_visual_config(config)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'worldguard':
        try:
            result = worldguard_service.save_visual_config(config)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'quests':
        try:
            from app.services.quests_service import quests_service
            result = quests_service.save_visual_config(config)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'mythicmobs':
        try:
            from app.services.mythicmobs_service import mythicmobs_service
            result = mythicmobs_service.save_visual_config(config)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    if plugin_id == 'essentials':
        try:
            from app.services.essentials_service import essentials_service
            result = essentials_service.save_visual_config(config)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Visual config no disponible para este plugin")


@router.put("/{plugin_id}/file")
async def save_file(
    plugin_id: str,
    path: str = Query(...),
    content: str = Body(..., embed=True)
):
    """Guardar archivo de configuración"""
    try:
        mmorpg_service.write_config_file(plugin_id, path, content)
        return {"success": True, "message": "Archivo guardado"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
