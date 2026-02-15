"""Controlador API para plugins MMORPG"""
from fastapi import APIRouter, HTTPException, Query, Body

from app.services.mmorpg_service import mmorpg_service

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
