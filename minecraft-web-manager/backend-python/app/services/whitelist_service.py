"""Servicio para gestión de whitelist del servidor"""
import json
from pathlib import Path
from typing import List, Dict, Optional
from app.core.config import settings
from app.services.rcon_service import rcon_service


class WhitelistService:
    """Servicio para gestionar la whitelist del servidor Minecraft"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.whitelist_file = self.server_path / "whitelist.json"
        self.properties_file = self.server_path / "server.properties"
    
    async def get_whitelist(self) -> List[Dict]:
        """
        Obtener lista de jugadores en la whitelist
        
        Returns:
            Lista de jugadores con uuid y name
        """
        try:
            if not self.whitelist_file.exists():
                return []
            
            with open(self.whitelist_file, 'r') as f:
                whitelist = json.load(f)
            
            return whitelist
        except Exception:
            return []
    
    async def add_to_whitelist(self, username: str, uuid: str) -> bool:
        """
        Agregar un jugador a la whitelist
        
        Args:
            username: Nombre del jugador
            uuid: UUID del jugador
            
        Returns:
            True si fue exitoso
        """
        try:
            whitelist = await self.get_whitelist()
            
            # Verificar si ya está en la whitelist
            if any(player.get('uuid') == uuid for player in whitelist):
                return True
            
            # Agregar jugador
            whitelist.append({
                "uuid": uuid,
                "name": username
            })
            
            # Guardar archivo
            with open(self.whitelist_file, 'w') as f:
                json.dump(whitelist, f, indent=2)
            
            # Ejecutar comando RCON
            await rcon_service.whitelist_add(username)
            
            return True
        except Exception:
            return False
    
    async def remove_from_whitelist(self, uuid: str) -> bool:
        """
        Remover un jugador de la whitelist
        
        Args:
            uuid: UUID del jugador
            
        Returns:
            True si fue exitoso
        """
        try:
            whitelist = await self.get_whitelist()
            
            # Buscar jugador para obtener su nombre
            player = next((p for p in whitelist if p.get('uuid') == uuid), None)
            if not player:
                return False
            
            # Remover jugador
            whitelist = [p for p in whitelist if p.get('uuid') != uuid]
            
            # Guardar archivo
            with open(self.whitelist_file, 'w') as f:
                json.dump(whitelist, f, indent=2)
            
            # Ejecutar comando RCON
            await rcon_service.whitelist_remove(player.get('name'))
            
            return True
        except Exception:
            return False
    
    async def clear_whitelist(self) -> bool:
        """
        Limpiar toda la whitelist
        
        Returns:
            True si fue exitoso
        """
        try:
            # Guardar whitelist vacía
            with open(self.whitelist_file, 'w') as f:
                json.dump([], f, indent=2)
            
            # Recargar whitelist en el servidor
            await rcon_service.whitelist_reload()
            
            return True
        except Exception:
            return False
    
    async def is_whitelist_enabled(self) -> bool:
        """
        Verificar si la whitelist está activada en server.properties
        
        Returns:
            True si está activada
        """
        try:
            if not self.properties_file.exists():
                return False
            
            with open(self.properties_file, 'r') as f:
                for line in f:
                    if line.startswith('white-list='):
                        value = line.split('=')[1].strip().lower()
                        return value == 'true'
            
            return False
        except Exception:
            return False
    
    async def get_whitelist_config(self) -> Dict:
        """
        Obtener configuración completa de whitelist
        
        Returns:
            Dict con enabled, enforce-whitelist
        """
        try:
            config = {
                "enabled": False,
                "enforce-whitelist": False
            }
            
            if self.properties_file.exists():
                with open(self.properties_file, 'r') as f:
                    for line in f:
                        if line.startswith('white-list='):
                            value = line.split('=')[1].strip().lower()
                            config['enabled'] = value == 'true'
                        elif line.startswith('enforce-whitelist='):
                            value = line.split('=')[1].strip().lower()
                            config['enforce-whitelist'] = value == 'true'
            
            return config
        except Exception:
            return {"enabled": False, "enforce-whitelist": False}
    
    async def toggle_whitelist(self, enabled: bool) -> bool:
        """
        Activar o desactivar la whitelist
        
        Args:
            enabled: True para activar, False para desactivar
            
        Returns:
            True si fue exitoso
        """
        try:
            # Actualizar server.properties
            if not self.properties_file.exists():
                return False
            
            with open(self.properties_file, 'r') as f:
                lines = f.readlines()
            
            with open(self.properties_file, 'w') as f:
                for line in lines:
                    if line.startswith('white-list='):
                        f.write(f'white-list={str(enabled).lower()}\n')
                    else:
                        f.write(line)
            
            # Ejecutar comando RCON
            if enabled:
                await rcon_service.whitelist_on()
            else:
                await rcon_service.whitelist_off()
            
            return True
        except Exception:
            return False
    
    async def set_enforce_whitelist(self, enforce: bool) -> bool:
        """
        Activar o desactivar enforce-whitelist
        
        Args:
            enforce: True para activar, False para desactivar
            
        Returns:
            True si fue exitoso
        """
        try:
            if not self.properties_file.exists():
                return False
            
            with open(self.properties_file, 'r') as f:
                lines = f.readlines()
            
            with open(self.properties_file, 'w') as f:
                for line in lines:
                    if line.startswith('enforce-whitelist='):
                        f.write(f'enforce-whitelist={str(enforce).lower()}\n')
                    else:
                        f.write(line)
            
            return True
        except Exception:
            return False
    
    async def is_player_whitelisted(self, uuid: str) -> bool:
        """
        Verificar si un jugador está en la whitelist
        
        Args:
            uuid: UUID del jugador
            
        Returns:
            True si está en la whitelist
        """
        whitelist = await self.get_whitelist()
        return any(player.get('uuid') == uuid for player in whitelist)


# Instancia singleton
whitelist_service = WhitelistService()
