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
    
    async def create_world(
        self, 
        world_id: str, 
        metadata: Dict[str, Any],
        settings: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Crear nuevo mundo con metadata y server.properties
        
        Args:
            world_id: ID del nuevo mundo
            metadata: Metadata del mundo
            settings: Settings para server.properties
        
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
            
            # Crear server.properties con las configuraciones
            await self._create_server_properties(world_dir, settings or {})
            
            return {
                "success": True,
                "message": f"Mundo '{world_id}' creado exitosamente"
            }
            
        except Exception as e:
            return {"success": False, "message": f"Error al crear mundo: {str(e)}"}
    
    async def _create_server_properties(
        self, 
        world_dir: Path, 
        settings: Dict[str, Any]
    ) -> None:
        """
        Crear archivo server.properties para el mundo
        
        Args:
            world_dir: Directorio del mundo
            settings: Settings personalizados
        """
        # Propiedades por defecto
        default_props = {
            'level-name': 'world',
            'gamemode': 'survival',
            'difficulty': 'easy',
            'pvp': 'true',
            'max-players': '20',
            'allow-nether': 'true',
            'allow-flight': 'false',
            'spawn-protection': '16',
            'view-distance': '10',
            'motd': 'Un servidor de Minecraft',
            'online-mode': 'true',
            'enable-command-block': 'false',
            'spawn-monsters': 'true',
            'spawn-animals': 'true',
            'spawn-npcs': 'true'
        }
        
        # Si existe un mundo activo, copiar sus propiedades como template
        if self.active_symlink.exists():
            try:
                active_props_file = self.active_symlink / "server.properties"
                if active_props_file.exists():
                    default_props = self._read_properties(active_props_file)
            except Exception:
                pass
        
        # Aplicar settings personalizados
        for key, value in settings.items():
            # Convertir booleanos a strings
            if isinstance(value, bool):
                value = 'true' if value else 'false'
            default_props[key] = str(value)
        
        # Asegurar que level-name siempre sea 'world'
        default_props['level-name'] = 'world'
        
        # Escribir archivo
        props_file = world_dir / "server.properties"
        self._write_properties(props_file, default_props)
    
    def _read_properties(self, file_path: Path) -> Dict[str, str]:
        """Leer archivo properties"""
        props = {}
        try:
            for line in file_path.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    props[key.strip()] = value.strip()
        except Exception:
            pass
        return props
    
    def _write_properties(self, file_path: Path, props: Dict[str, str]) -> None:
        """Escribir archivo properties"""
        lines = [
            "# Minecraft server properties",
            f"# Generated by Minecraft Manager",
            ""
        ]
        for key, value in sorted(props.items()):
            lines.append(f"{key}={value}")
        
        file_path.write_text("\n".join(lines))
    
    async def update_world_config(
        self, 
        world_id: str, 
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Actualizar configuración de mundo (metadata y settings)
        No permite cambiar seed ni level-type
        
        Args:
            world_id: ID del mundo a actualizar
            config: Nueva configuración (name, description, icon, settings)
        
        Returns:
            Dict con success y mensaje
        """
        world_dir = self.worlds_path / world_id
        
        if not world_dir.exists():
            return {"success": False, "message": "El mundo no existe"}
        
        try:
            # Actualizar metadata
            metadata_file = world_dir / "metadata.json"
            if metadata_file.exists():
                current_metadata = json.loads(metadata_file.read_text())
            else:
                current_metadata = {}
            
            # Actualizar campos permitidos en metadata
            if 'name' in config:
                current_metadata['name'] = config['name']
            if 'description' in config:
                current_metadata['description'] = config['description']
            if 'icon' in config:
                current_metadata['icon'] = config['icon']
            
            metadata_file.write_text(json.dumps(current_metadata, indent=2))
            
            # Actualizar server.properties si hay settings
            if 'settings' in config:
                props_file = world_dir / "server.properties"
                current_props = self._read_properties(props_file) if props_file.exists() else {}
                
                # Actualizar solo campos editables (NO seed ni level-type)
                editable_fields = [
                    'gamemode', 'difficulty', 'pvp', 'motd', 'max-players',
                    'view-distance', 'spawn-protection', 'allow-flight',
                    'allow-nether', 'spawn-animals', 'spawn-monsters',
                    'generate-structures'
                ]
                
                for key, value in config['settings'].items():
                    if key in editable_fields:
                        # Convertir booleanos a strings
                        if isinstance(value, bool):
                            value = 'true' if value else 'false'
                        current_props[key] = str(value)
                
                self._write_properties(props_file, current_props)
            
            return {
                "success": True,
                "message": f"Mundo '{world_id}' actualizado exitosamente"
            }
            
        except Exception as e:
            return {"success": False, "message": f"Error al actualizar mundo: {str(e)}"}
    
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
