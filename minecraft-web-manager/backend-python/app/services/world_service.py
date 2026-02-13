"""Servicio para gestión de mundos con symlinks"""
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.bash_service import bash_service


class WorldService:
    """Servicio para gestión multi-mundo"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.worlds_path = self.server_path / "worlds"
        self.active_symlink = self.worlds_path / "active"
    
    async def list_worlds(self) -> List[Dict[str, Any]]:
        """
        Listar todos los mundos disponibles
        
        Returns:
            Lista de mundos con metadata
        """
        worlds = []
        
        if not self.worlds_path.exists():
            return worlds
        
        for world_dir in self.worlds_path.iterdir():
            if world_dir.is_dir() and world_dir.name != "active":
                world_info = await self.get_world_info(world_dir.name)
                if world_info:
                    worlds.append(world_info)
        
        return worlds
    
    async def get_world_info(self, world_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtener información de un mundo
        
        Args:
            world_id: Nombre del directorio del mundo
        
        Returns:
            Dict con info del mundo
        """
        world_dir = self.worlds_path / world_id
        
        if not world_dir.exists():
            return None
        
        metadata_file = world_dir / "metadata.json"
        metadata = {}
        
        if metadata_file.exists():
            try:
                metadata = json.loads(metadata_file.read_text())
            except Exception:
                pass
        
        # Calcular tamaño
        size = await self._get_world_size(world_dir)
        
        # Verificar si es el mundo activo
        is_active = False
        if self.active_symlink.exists() and self.active_symlink.is_symlink():
            is_active = self.active_symlink.resolve() == world_dir.resolve()
        
        return {
            "id": world_id,
            "name": metadata.get("name", world_id),
            "description": metadata.get("description", ""),
            "type": metadata.get("type", "survival"),
            "icon": metadata.get("icon", "🌍"),
            "tags": metadata.get("tags", []),
            "size_mb": size,
            "is_active": is_active,
            "created_at": metadata.get("created_at", "")
        }
    
    async def _get_world_size(self, world_dir: Path) -> int:
        """Obtener tamaño del mundo en MB"""
        try:
            result = await bash_service.exec_command(
                f"du -sb {world_dir}",
                cwd=self.server_path
            )
            if result["success"]:
                size_bytes = int(result["stdout"].split()[0])
                return size_bytes // (1024 * 1024)
        except Exception:
            pass
        return 0
    
    async def get_active_world(self) -> Optional[Dict[str, Any]]:
        """Obtener mundo activo"""
        if self.active_symlink.exists() and self.active_symlink.is_symlink():
            world_id = self.active_symlink.resolve().name
            return await self.get_world_info(world_id)
        return None
    
    async def activate_world(self, world_id: str) -> Dict[str, Any]:
        """
        Activar un mundo (requiere servidor detenido)
        
        Args:
            world_id: ID del mundo a activar
        
        Returns:
            Dict con success y mensaje
        """
        from app.services.server_service import server_service
        
        # Verificar que el servidor esté detenido
        if server_service.is_running():
            return {
                "success": False,
                "message": "El servidor debe estar detenido para cambiar de mundo"
            }
        
        world_dir = self.worlds_path / world_id
        
        if not world_dir.exists():
            return {"success": False, "message": "El mundo no existe"}
        
        try:
            # Eliminar symlink anterior
            if self.active_symlink.exists():
                self.active_symlink.unlink()
            
            # Crear nuevo symlink
            self.active_symlink.symlink_to(world_dir)
            
            # Actualizar symlinks de mundos principales
            world_symlinks = [
                (self.server_path / "world", world_dir / "world"),
                (self.server_path / "world_nether", world_dir / "world_nether"),
                (self.server_path / "world_the_end", world_dir / "world_the_end")
            ]
            
            for symlink, target in world_symlinks:
                if symlink.exists() or symlink.is_symlink():
                    symlink.unlink()
                if target.exists():
                    symlink.symlink_to(target)
            
            return {
                "success": True,
                "message": f"Mundo '{world_id}' activado exitosamente"
            }
            
        except Exception as e:
            return {"success": False, "message": f"Error al activar mundo: {str(e)}"}
    
    async def create_world(self, world_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crear nuevo mundo
        
        Args:
            world_id: ID del nuevo mundo
            metadata: Metadata del mundo
        
        Returns:
            Dict con success y mensaje
        """
        world_dir = self.worlds_path / world_id
        
        if world_dir.exists():
            return {"success": False, "message": "El mundo ya existe"}
        
        try:
            # Crear directorio
            world_dir.mkdir(parents=True)
            
            # Crear subdirectorios de mundos
            (world_dir / "world").mkdir()
            (world_dir / "world_nether").mkdir()
            (world_dir / "world_the_end").mkdir()
            
            # Guardar metadata
            metadata_file = world_dir / "metadata.json"
            metadata_file.write_text(json.dumps(metadata, indent=2))
            
            return {
                "success": True,
                "message": f"Mundo '{world_id}' creado exitosamente"
            }
            
        except Exception as e:
            return {"success": False, "message": f"Error al crear mundo: {str(e)}"}
    
    async def delete_world(self, world_id: str) -> Dict[str, Any]:
        """
        Eliminar mundo (no permite eliminar el activo)
        
        Args:
            world_id: ID del mundo a eliminar
        
        Returns:
            Dict con success y mensaje
        """
        world_info = await self.get_world_info(world_id)
        
        if not world_info:
            return {"success": False, "message": "El mundo no existe"}
        
        if world_info["is_active"]:
            return {
                "success": False,
                "message": "No se puede eliminar el mundo activo"
            }
        
        try:
            world_dir = self.worlds_path / world_id
            result = await bash_service.exec_command(
                f"rm -rf {world_dir}",
                cwd=self.server_path
            )
            
            if result["success"]:
                return {
                    "success": True,
                    "message": f"Mundo '{world_id}' eliminado exitosamente"
                }
            else:
                return {"success": False, "message": result["stderr"]}
                
        except Exception as e:
            return {"success": False, "message": f"Error al eliminar mundo: {str(e)}"}


# Instancia global
world_service = WorldService()
