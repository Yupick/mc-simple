"""Controlador para gestión de jugadores"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.player_service import player_service


router = APIRouter()


class KickPlayerRequest(BaseModel):
    username: str
    reason: str = "Expulsado del servidor"


class UUIDLookupRequest(BaseModel):
    username: str


@router.get("/online")
async def get_online_players():
    """Obtener jugadores conectados actualmente"""
    try:
        data = await player_service.get_online_players()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_player_history():
    """Obtener historial completo de jugadores"""
    try:
        players = await player_service.get_player_history()
        return {"players": players, "total": len(players)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_players(q: str):
    """Buscar jugadores por nombre"""
    try:
        players = await player_service.search_player(q)
        return {"players": players, "total": len(players)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{uuid}")
async def get_player_by_uuid(uuid: str):
    """Obtener detalles de un jugador por UUID"""
    try:
        player = await player_service.get_player_by_uuid(uuid)
        if not player:
            raise HTTPException(status_code=404, detail="Jugador no encontrado")
        return player
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/kick")
async def kick_player(request: KickPlayerRequest):
    """Expulsar un jugador del servidor"""
    try:
        success = await player_service.kick_player(request.username, request.reason)
        if success:
            return {"success": True, "message": f"Jugador {request.username} expulsado"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo expulsar al jugador")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/uuid-lookup")
async def lookup_uuid(request: UUIDLookupRequest):
    """Obtener UUID de un jugador desde Mojang API"""
    try:
        # Primero buscar en el historial local
        player = await player_service.get_player_by_name(request.username)
        if player:
            return {
                "name": player.get('name'),
                "uuid": player.get('uuid'),
                "source": "local"
            }
        
        # Si no está en el historial, buscar en Mojang
        data = await player_service.fetch_uuid_from_mojang(request.username)
        if data:
            return {
                "name": data.get('name'),
                "uuid": data.get('uuid'),
                "source": "mojang"
            }
        
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
