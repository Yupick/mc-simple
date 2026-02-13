"""Servicio para gestión de plugins"""
from pathlib import Path
from typing import Dict, Any, List
from app.core.config import settings


class PluginService:
    """Servicio para gestión de plugins"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.plugins_path = self.server_path / "plugins"
    
    async def list_plugins(self) -> List[Dict[str, Any]]:
        """
        Listar plugins instalados
        
        Returns:
            Lista de plugins con nombre, enabled, size
        """
        plugins = []
        
        if not self.plugins_path.exists():
            return plugins
        
        for file in self.plugins_path.iterdir():
            if file.is_file() and (file.suffix == ".jar" or file.name.endswith(".jar.disabled")):
                enabled = file.suffix == ".jar"
                name = file.stem if enabled else file.name.replace(".jar.disabled", "")
                
                plugins.append({
                    "name": name,
                    "filename": file.name,
                    "enabled": enabled,
                    "size_mb": file.stat().st_size / (1024 * 1024),
                })
        
        return plugins
    
    async def toggle_plugin(self, plugin_name: str) -> Dict[str, Any]:
        """
        Enable/disable plugin (renombrar .jar <-> .jar.disabled)
        
        Args:
            plugin_name: Nombre del plugin
        
        Returns:
            Dict con success y nuevo estado
        """
        jar_file = self.plugins_path / f"{plugin_name}.jar"
        disabled_file = self.plugins_path / f"{plugin_name}.jar.disabled"
        
        try:
            if jar_file.exists():
                # Deshabilitar
                jar_file.rename(disabled_file)
                return {
                    "success": True,
                    "enabled": False,
                    "message": f"Plugin '{plugin_name}' deshabilitado"
                }
            elif disabled_file.exists():
                # Habilitar
                disabled_file.rename(jar_file)
                return {
                    "success": True,
                    "enabled": True,
                    "message": f"Plugin '{plugin_name}' habilitado"
                }
            else:
                return {"success": False, "message": "Plugin no encontrado"}
                
        except Exception as e:
            return {"success": False, "message": f"Error: {str(e)}"}
    
    async def upload_plugin(self, filename: str, content: bytes) -> Dict[str, Any]:
        """
        Subir nuevo plugin
        
        Args:
            filename: Nombre del archivo .jar
            content: Contenido del archivo
        
        Returns:
            Dict con success y mensaje
        """
        try:
            # Asegurar que la carpeta plugins existe
            self.plugins_path.mkdir(parents=True, exist_ok=True)
            
            # Guardar archivo
            plugin_file = self.plugins_path / filename
            plugin_file.write_bytes(content)
            
            return {
                "success": True,
                "message": f"Plugin '{filename}' subido exitosamente"
            }
            
        except Exception as e:
            return {"success": False, "message": f"Error al subir plugin: {str(e)}"}
    
    async def delete_plugin(self, plugin_name: str) -> Dict[str, Any]:
        """
        Eliminar plugin
        
        Args:
            plugin_name: Nombre del plugin
        
        Returns:
            Dict con success y mensaje
        """
        jar_file = self.plugins_path / f"{plugin_name}.jar"
        disabled_file = self.plugins_path / f"{plugin_name}.jar.disabled"
        
        try:
            if jar_file.exists():
                jar_file.unlink()
                return {
                    "success": True,
                    "message": f"Plugin '{plugin_name}' eliminado"
                }
            elif disabled_file.exists():
                disabled_file.unlink()
                return {
                    "success": True,
                    "message": f"Plugin '{plugin_name}' eliminado"
                }
            else:
                return {"success": False, "message": "Plugin no encontrado"}
                
        except Exception as e:
            return {"success": False, "message": f"Error: {str(e)}"}


# Instancia global
plugin_service = PluginService()
