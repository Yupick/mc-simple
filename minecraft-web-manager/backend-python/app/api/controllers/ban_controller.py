"""Controlador para gestión de baneos"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.ban_service import ban_service


router = APIRouter()


class BanPlayerRequest(BaseModel):
    username: str
    uuid: str
    reason: str = "Violación de las reglas"
    moderator: str = "Admin"
    expires: Optional[str] = None


class BanIPRequest(BaseModel):
    ip: str
    reason: str = "Violación de las reglas"
    moderator: str = "Admin"
    expires: Optional[str] = None


@router.get("/players")
async def get_banned_players():
    """Obtener lista de jugadores baneados"""
    try:
        bans = await ban_service.get_banned_players()
        return {"bans": bans, "total": len(bans)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ips")
async def get_banned_ips():
    """Obtener lista de IPs baneadas"""
    try:
        bans = await ban_service.get_banned_ips()
        return {"bans": bans, "total": len(bans)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/player")
async def ban_player(request: BanPlayerRequest):
    """Banear un jugador"""
    try:
        success = await ban_service.ban_player(
            request.username,
            request.uuid,
            request.reason,
            request.moderator,
            request.expires
        )
        
        if success:
            return {
                "success": True,
                "message": f"{request.username} ha sido baneado"
            }
        else:
            raise HTTPException(status_code=400, detail="No se pudo banear al jugador")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ip")
async def ban_ip(request: BanIPRequest):
    """Banear una dirección IP"""
    try:
        success = await ban_service.ban_ip(
            request.ip,
            request.reason,
            request.moderator,
            request.expires
        )
        
        if success:
            return {
                "success": True,
                "message": f"IP {request.ip} ha sido baneada"
            }
        else:
            raise HTTPException(status_code=400, detail="No se pudo banear la IP")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/player/{uuid}")
async def pardon_player(uuid: str):
    """Perdonar/desbanear un jugador"""
    try:
        success = await ban_service.pardon_player(uuid)
        if success:
            return {"success": True, "message": "Jugador desbaneado"}
        else:
            raise HTTPException(status_code=404, detail="Ban no encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/ip/{ip}")
async def pardon_ip(ip: str):
    """Perdonar/desbanear una IP"""
    try:
        success = await ban_service.pardon_ip(ip)
        if success:
            return {"success": True, "message": "IP desbaneada"}
        else:
            raise HTTPException(status_code=404, detail="Ban no encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_ban_stats():
    """Obtener estadísticas de baneos"""
    try:
        stats = await ban_service.get_ban_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
