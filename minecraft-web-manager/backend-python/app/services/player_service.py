"""Servicio para gestión de jugadores de Minecraft"""
import json
import httpx
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from app.core.config import settings
from app.services.rcon_service import rcon_service


class PlayerService:
    """Servicio para gestionar jugadores del servidor Minecraft"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.usercache_file = self.server_path / "usercache.json"
        self.mojang_api = "https://api.mojang.com"
    
    async def get_online_players(self) -> Dict:
        """
        Obtener lista de jugadores conectados
        
        Returns:
            Dict con 'online' (int), 'max' (int), 'players' (list)
        """
        try:
            result = await rcon_service.list_players()
            
            # Leer max-players desde server.properties
            max_players = 20  # por defecto
            props_file = self.server_path / "server.properties"
            if props_file.exists():
                with open(props_file, 'r') as f:
                    for line in f:
                        if line.startswith('max-players='):
                            max_players = int(line.split('=')[1].strip())
                            break
            
            return {
                "online": result.get("online", 0),
                "max": max_players,
                "players": result.get("players", [])
            }
        except Exception as e:
            return {"online": 0, "max": 20, "players": [], "error": str(e)}
    
    async def get_player_history(self) -> List[Dict]:
        """
        Obtener historial de jugadores desde usercache.json
        
        Returns:
            Lista de jugadores con name, uuid, expiresOn
        """
        try:
            if not self.usercache_file.exists():
                return []
            
            with open(self.usercache_file, 'r') as f:
                cache = json.load(f)
            
            # Ordenar por fecha más reciente
            cache_sorted = sorted(
                cache, 
                key=lambda x: x.get('expiresOn', ''), 
                reverse=True
            )
            
            return cache_sorted
        except Exception:
            return []
    
    async def search_player(self, query: str) -> List[Dict]:
        """
        Buscar jugadores en el historial por nombre parcial
        
        Args:
            query: Texto a buscar (nombre parcial)
            
        Returns:
            Lista de jugadores que coinciden
        """
        history = await self.get_player_history()
        query_lower = query.lower()
        
        return [
            player for player in history 
            if query_lower in player.get('name', '').lower()
        ]
    
    async def get_player_by_uuid(self, uuid: str) -> Optional[Dict]:
        """
        Buscar un jugador por UUID en el historial
        
        Args:
            uuid: UUID del jugador
            
        Returns:
            Datos del jugador o None
        """
        history = await self.get_player_history()
        
        for player in history:
            if player.get('uuid', '') == uuid:
                return player
        
        return None
    
    async def get_player_by_name(self, name: str) -> Optional[Dict]:
        """
        Buscar un jugador por nombre exacto en el historial
        
        Args:
            name: Nombre del jugador
            
        Returns:
            Datos del jugador o None
        """
        history = await self.get_player_history()
        
        for player in history:
            if player.get('name', '').lower() == name.lower():
                return player
        
        return None
    
    async def fetch_uuid_from_mojang(self, username: str) -> Optional[Dict]:
        """
        Obtener UUID de un jugador desde la API de Mojang
        
        Args:
            username: Nombre del jugador
            
        Returns:
            Dict con 'name' y 'id' (UUID sin guiones) o None
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.mojang_api}/users/profiles/minecraft/{username}",
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "name": data.get("name"),
                        "uuid": data.get("id")
                    }
                
                return None
        except Exception:
            return None
    
    async def fetch_player_profile(self, uuid: str) -> Optional[Dict]:
        """
        Obtener perfil completo de un jugador desde Mojang
        
        Args:
            uuid: UUID del jugador (con o sin guiones)
            
        Returns:
            Perfil del jugador con skin, capa, etc.
        """
        try:
            # Remover guiones del UUID si los tiene
            uuid_clean = uuid.replace("-", "")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.mojang_api}/session/minecraft/profile/{uuid_clean}",
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    return response.json()
                
                return None
        except Exception:
            return None
    
    async def kick_player(self, username: str, reason: str = "Expulsado del servidor") -> bool:
        """
        Expulsar un jugador del servidor
        
        Args:
            username: Nombre del jugador
            reason: Razón del kick
            
        Returns:
            True si fue exitoso
        """
        return await rcon_service.kick_player(username, reason)
    
    async def get_player_avatar_url(self, uuid: str) -> str:
        """
        Obtener URL del avatar del jugador
        
        Args:
            uuid: UUID del jugador
            
        Returns:
            URL del avatar (Crafatar)
        """
        uuid_clean = uuid.replace("-", "")
        return f"https://crafatar.com/avatars/{uuid_clean}?overlay=true"


# Instancia singleton
player_service = PlayerService()
