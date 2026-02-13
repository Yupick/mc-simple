"""Servicio para gestión de comandos RCON en el servidor Minecraft"""
import asyncio
from typing import Optional, List, Dict
from mcrcon import MCRcon
from pathlib import Path
from app.core.config import settings


class RCONService:
    """Servicio para ejecutar comandos RCON en el servidor Minecraft"""
    
    def __init__(self):
        self.host = "127.0.0.1"
        self.port = 25575  # Puerto RCON por defecto
        self.password = self._get_rcon_password()
    
    def _get_rcon_password(self) -> str:
        """Obtener la contraseña RCON desde server.properties"""
        try:
            props_file = Path(settings.SERVER_PATH) / "server.properties"
            if props_file.exists():
                with open(props_file, 'r') as f:
                    for line in f:
                        if line.startswith('rcon.password='):
                            return line.split('=', 1)[1].strip()
            # Contraseña por defecto si no se encuentra
            return "admin123"
        except Exception:
            return "admin123"
    
    async def execute_command(self, command: str) -> str:
        """
        Ejecutar un comando RCON
        
        Args:
            command: Comando a ejecutar (ej: "list", "op player", etc.)
            
        Returns:
            Respuesta del servidor
        """
        try:
            with MCRcon(self.host, self.password, port=self.port) as mcr:
                response = mcr.command(command)
                return response
        except Exception as e:
            raise Exception(f"Error ejecutando comando RCON: {str(e)}")
    
    async def list_players(self) -> Dict[str, any]:
        """
        Listar jugadores conectados
        
        Returns:
            Dict con 'online' (int) y 'players' (list)
        """
        try:
            response = await self.execute_command("list")
            # Respuesta típica: "There are 2 of a max of 20 players online: Steve, Alex"
            
            if "There are" in response:
                parts = response.split(":")
                count_part = parts[0]
                online = int(count_part.split()[2])
                
                if len(parts) > 1 and parts[1].strip():
                    players = [p.strip() for p in parts[1].split(",")]
                else:
                    players = []
                
                return {
                    "online": online,
                    "players": players
                }
            
            return {"online": 0, "players": []}
        except Exception:
            return {"online": 0, "players": []}
    
    async def kick_player(self, username: str, reason: str = "") -> bool:
        """
        Expulsar un jugador del servidor
        
        Args:
            username: Nombre del jugador
            reason: Razón del kick (opcional)
            
        Returns:
            True si fue exitoso
        """
        try:
            cmd = f"kick {username}"
            if reason:
                cmd += f" {reason}"
            response = await self.execute_command(cmd)
            return "Kicked" in response or "fue expulsado" in response.lower()
        except Exception:
            return False
    
    async def op_player(self, username: str) -> bool:
        """Otorgar OP a un jugador"""
        try:
            response = await self.execute_command(f"op {username}")
            return "Made" in response or "operator" in response.lower()
        except Exception:
            return False
    
    async def deop_player(self, username: str) -> bool:
        """Remover OP de un jugador"""
        try:
            response = await self.execute_command(f"deop {username}")
            return "operator" in response.lower()
        except Exception:
            return False
    
    async def whitelist_add(self, username: str) -> bool:
        """Agregar jugador a la whitelist"""
        try:
            response = await self.execute_command(f"whitelist add {username}")
            return "Added" in response or "agregado" in response.lower()
        except Exception:
            return False
    
    async def whitelist_remove(self, username: str) -> bool:
        """Remover jugador de la whitelist"""
        try:
            response = await self.execute_command(f"whitelist remove {username}")
            return "Removed" in response or "eliminado" in response.lower()
        except Exception:
            return False
    
    async def whitelist_on(self) -> bool:
        """Activar la whitelist"""
        try:
            response = await self.execute_command("whitelist on")
            return "Turned on" in response or "activada" in response.lower()
        except Exception:
            return False
    
    async def whitelist_off(self) -> bool:
        """Desactivar la whitelist"""
        try:
            response = await self.execute_command("whitelist off")
            return "Turned off" in response or "desactivada" in response.lower()
        except Exception:
            return False
    
    async def whitelist_reload(self) -> bool:
        """Recargar la whitelist desde el archivo"""
        try:
            await self.execute_command("whitelist reload")
            return True
        except Exception:
            return False
    
    async def ban_player(self, username: str, reason: str = "") -> bool:
        """
        Banear un jugador
        
        Args:
            username: Nombre del jugador
            reason: Razón del ban (opcional)
            
        Returns:
            True si fue exitoso
        """
        try:
            cmd = f"ban {username}"
            if reason:
                cmd += f" {reason}"
            response = await self.execute_command(cmd)
            return "Banned" in response or "baneado" in response.lower()
        except Exception:
            return False
    
    async def pardon_player(self, username: str) -> bool:
        """Perdonar/desbanear un jugador"""
        try:
            response = await self.execute_command(f"pardon {username}")
            return "Unbanned" in response or "perdon" in response.lower()
        except Exception:
            return False
    
    async def ban_ip(self, ip: str, reason: str = "") -> bool:
        """
        Banear una dirección IP
        
        Args:
            ip: Dirección IP
            reason: Razón del ban (opcional)
            
        Returns:
            True si fue exitoso
        """
        try:
            cmd = f"ban-ip {ip}"
            if reason:
                cmd += f" {reason}"
            response = await self.execute_command(cmd)
            return "Banned" in response or "baneado" in response.lower()
        except Exception:
            return False
    
    async def pardon_ip(self, ip: str) -> bool:
        """Perdonar/desbanear una IP"""
        try:
            response = await self.execute_command(f"pardon-ip {ip}")
            return "Unbanned" in response or "perdon" in response.lower()
        except Exception:
            return False


# Instancia singleton
rcon_service = RCONService()
