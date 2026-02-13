"""Servicio para gestión de baneos del servidor"""
import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from app.core.config import settings
from app.services.rcon_service import rcon_service


class BanService:
    """Servicio para gestionar baneos del servidor Minecraft"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.banned_players_file = self.server_path / "banned-players.json"
        self.banned_ips_file = self.server_path / "banned-ips.json"
    
    # ========== Baneos de Jugadores ==========
    
    async def get_banned_players(self) -> List[Dict]:
        """
        Obtener lista de jugadores baneados
        
        Returns:
            Lista con uuid, name, created, source, expires, reason
        """
        try:
            if not self.banned_players_file.exists():
                return []
            
            with open(self.banned_players_file, 'r') as f:
                bans = json.load(f)
            
            return bans
        except Exception:
            return []
    
    async def ban_player(
        self, 
        username: str, 
        uuid: str,
        reason: str = "Violación de las reglas",
        moderator: str = "Server",
        expires: Optional[str] = None
    ) -> bool:
        """
        Banear un jugador
        
        Args:
            username: Nombre del jugador
            uuid: UUID del jugador
            reason: Razón del ban
            moderator: Quien ejecuta el ban
            expires: Fecha de expiración (formato: "2026-12-31 23:59:59 +0000") o None para permanente
            
        Returns:
            True si fue exitoso
        """
        try:
            bans = await self.get_banned_players()
            
            # Verificar si ya está baneado
            existing = next((b for b in bans if b.get('uuid') == uuid), None)
            if existing:
                # Actualizar ban existente
                existing['reason'] = reason
                existing['source'] = moderator
                existing['created'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S +0000')
                if expires:
                    existing['expires'] = expires
            else:
                # Crear nuevo ban
                ban_entry = {
                    "uuid": uuid,
                    "name": username,
                    "created": datetime.now().strftime('%Y-%m-%d %H:%M:%S +0000'),
                    "source": moderator,
                    "reason": reason
                }
                
                if expires:
                    ban_entry["expires"] = expires
                else:
                    ban_entry["expires"] = "forever"
                
                bans.append(ban_entry)
            
            # Guardar archivo
            with open(self.banned_players_file, 'w') as f:
                json.dump(bans, f, indent=2)
            
            # Ejecutar comando RCON
            await rcon_service.ban_player(username, reason)
            
            return True
        except Exception as e:
            print(f"Error baneando jugador: {e}")
            return False
    
    async def pardon_player(self, uuid: str) -> bool:
        """
        Perdonar/desbanear un jugador
        
        Args:
            uuid: UUID del jugador
            
        Returns:
            True si fue exitoso
        """
        try:
            bans = await self.get_banned_players()
            
            # Buscar jugador para obtener nombre
            player = next((b for b in bans if b.get('uuid') == uuid), None)
            if not player:
                return False
            
            # Remover del listado
            bans = [b for b in bans if b.get('uuid') != uuid]
            
            # Guardar archivo
            with open(self.banned_players_file, 'w') as f:
                json.dump(bans, f, indent=2)
            
            # Ejecutar comando RCON
            await rcon_service.pardon_player(player.get('name'))
            
            return True
        except Exception:
            return False
    
    async def is_player_banned(self, uuid: str) -> bool:
        """
        Verificar si un jugador está baneado
        
        Args:
            uuid: UUID del jugador
            
        Returns:
            True si está baneado
        """
        bans = await self.get_banned_players()
        return any(ban.get('uuid') == uuid for ban in bans)
    
    # ========== Baneos de IP ==========
    
    async def get_banned_ips(self) -> List[Dict]:
        """
        Obtener lista de IPs baneadas
        
        Returns:
            Lista con ip, created, source, expires, reason
        """
        try:
            if not self.banned_ips_file.exists():
                return []
            
            with open(self.banned_ips_file, 'r') as f:
                bans = json.load(f)
            
            return bans
        except Exception:
            return []
    
    async def ban_ip(
        self, 
        ip: str,
        reason: str = "Violación de las reglas",
        moderator: str = "Server",
        expires: Optional[str] = None
    ) -> bool:
        """
        Banear una dirección IP
        
        Args:
            ip: Dirección IP
            reason: Razón del ban
            moderator: Quien ejecuta el ban
            expires: Fecha de expiración o None para permanente
            
        Returns:
            True si fue exitoso
        """
        try:
            bans = await self.get_banned_ips()
            
            # Verificar si ya está baneada
            existing = next((b for b in bans if b.get('ip') == ip), None)
            if existing:
                # Actualizar ban existente
                existing['reason'] = reason
                existing['source'] = moderator
                existing['created'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S +0000')
                if expires:
                    existing['expires'] = expires
            else:
                # Crear nuevo ban
                ban_entry = {
                    "ip": ip,
                    "created": datetime.now().strftime('%Y-%m-%d %H:%M:%S +0000'),
                    "source": moderator,
                    "reason": reason
                }
                
                if expires:
                    ban_entry["expires"] = expires
                else:
                    ban_entry["expires"] = "forever"
                
                bans.append(ban_entry)
            
            # Guardar archivo
            with open(self.banned_ips_file, 'w') as f:
                json.dump(bans, f, indent=2)
            
            # Ejecutar comando RCON
            await rcon_service.ban_ip(ip, reason)
            
            return True
        except Exception:
            return False
    
    async def pardon_ip(self, ip: str) -> bool:
        """
        Perdonar/desbanear una IP
        
        Args:
            ip: Dirección IP
            
        Returns:
            True si fue exitoso
        """
        try:
            bans = await self.get_banned_ips()
            
            # Verificar que existe
            if not any(b.get('ip') == ip for b in bans):
                return False
            
            # Remover del listado
            bans = [b for b in bans if b.get('ip') != ip]
            
            # Guardar archivo
            with open(self.banned_ips_file, 'w') as f:
                json.dump(bans, f, indent=2)
            
            # Ejecutar comando RCON
            await rcon_service.pardon_ip(ip)
            
            return True
        except Exception:
            return False
    
    async def is_ip_banned(self, ip: str) -> bool:
        """
        Verificar si una IP está baneada
        
        Args:
            ip: Dirección IP
            
        Returns:
            True si está baneada
        """
        bans = await self.get_banned_ips()
        return any(ban.get('ip') == ip for ban in bans)
    
    # ========== Estadísticas ==========
    
    async def get_ban_stats(self) -> Dict:
        """
        Obtener estadísticas de baneos
        
        Returns:
            Dict con total_players, total_ips, recent_players, recent_ips
        """
        try:
            players = await self.get_banned_players()
            ips = await self.get_banned_ips()
            
            # Calcular baneos recientes (última semana)
            now = datetime.now()
            week_ago = now.timestamp() - (7 * 24 * 60 * 60)
            
            recent_players = 0
            recent_ips = 0
            
            for ban in players:
                try:
                    created = ban.get('created', '')
                    ban_date = datetime.strptime(created.split('+')[0].strip(), '%Y-%m-%d %H:%M:%S')
                    if ban_date.timestamp() >= week_ago:
                        recent_players += 1
                except:
                    pass
            
            for ban in ips:
                try:
                    created = ban.get('created', '')
                    ban_date = datetime.strptime(created.split('+')[0].strip(), '%Y-%m-%d %H:%M:%S')
                    if ban_date.timestamp() >= week_ago:
                        recent_ips += 1
                except:
                    pass
            
            return {
                "total_players": len(players),
                "total_ips": len(ips),
                "recent_players": recent_players,
                "recent_ips": recent_ips
            }
        except Exception:
            return {
                "total_players": 0,
                "total_ips": 0,
                "recent_players": 0,
                "recent_ips": 0
            }


# Instancia singleton
ban_service = BanService()
