"""Servicio para gestionar plugins recomendados"""
from pathlib import Path
from typing import List, Dict, Optional
import httpx
from app.core.config import settings


class RecommendedPluginsService:
    """Servicio para plugins recomendados que el sistema web puede gestionar"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.plugins_path = self.server_path / "plugins"
    
    def get_recommended_plugins(self) -> List[Dict]:
        """Obtener lista de plugins recomendados con su estado de instalación"""
        plugins = [
            {
                "id": "resourcepackmanager",
                "name": "ResourcePackManager",
                "description": "Fusiona múltiples resource packs en uno solo y lo aloja automáticamente",
                "modrinth_id": "resourcepackmanager",
                "jar_name": "ResourcePackManager.jar",
                "version": None,
                "installed": False,
                "has_web_integration": True,
                "web_route": "/resourcepacks",
                "features": [
                    "Fusión automática de packs",
                    "Hosting gratuito",
                    "Sistema de prioridades",
                    "Detección de colisiones"
                ],
                "limitations": [
                    "No soporta packs por mundo"
                ]
            }
            # Futuros plugins:
            # - ViaVersion (gestión de versiones)
            # - Geyser (gestión Bedrock)
            # - LuckPerms (gestión de permisos)
            # etc.
        ]
        
        # Verificar estado de instalación
        for plugin in plugins:
            jar_path = self.plugins_path / plugin["jar_name"]
            plugin["installed"] = jar_path.exists()
            
            # Si está instalado, detectar versión (simplificado)
            if plugin["installed"]:
                plugin["version"] = self._detect_version(plugin["jar_name"])
        
        return plugins
    
    def _detect_version(self, jar_name: str) -> Optional[str]:
        """Detectar versión del plugin instalado"""
        try:
            # Por ahora, retornar versión genérica
            # TODO: Parsear plugin.yml dentro del JAR
            return "Instalado"
        except Exception:
            return None
    
    def is_plugin_installed(self, plugin_id: str) -> bool:
        """Verificar si un plugin recomendado está instalado"""
        plugins = self.get_recommended_plugins()
        for plugin in plugins:
            if plugin["id"] == plugin_id:
                return plugin["installed"]
        return False
    
    async def install_plugin(self, plugin_id: str) -> Dict:
        """Instalar plugin desde Modrinth"""
        try:
            # Buscar plugin en la lista
            plugin_info = None
            for plugin in self.get_recommended_plugins():
                if plugin["id"] == plugin_id:
                    plugin_info = plugin
                    break
            
            if not plugin_info:
                return {"success": False, "error": "Plugin no encontrado en lista de recomendados"}
            
            if plugin_info["installed"]:
                return {"success": False, "error": "Plugin ya está instalado"}
            
            # Descargar desde Modrinth
            modrinth_id = plugin_info["modrinth_id"]
            api_url = f"https://api.modrinth.com/v2/project/{modrinth_id}/version"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Obtener versiones
                response = await client.get(api_url)
                if response.status_code != 200:
                    return {"success": False, "error": f"Error al consultar Modrinth API: {response.status_code}"}
                
                versions = response.json()
                if not versions:
                    return {"success": False, "error": "No hay versiones disponibles"}
                
                # Primera versión es la más reciente
                latest = versions[0]
                
                # Buscar archivo .jar
                jar_file = None
                for file in latest['files']:
                    if file['filename'].endswith('.jar'):
                        jar_file = file
                        break
                
                if not jar_file:
                    return {"success": False, "error": "No se encontró archivo JAR en la versión"}
                
                # Descargar
                download_response = await client.get(jar_file['url'])
                if download_response.status_code != 200:
                    return {"success": False, "error": f"Error al descargar: {download_response.status_code}"}
                
                # Crear carpeta plugins si no existe
                self.plugins_path.mkdir(parents=True, exist_ok=True)
                
                # Guardar archivo
                jar_path = self.plugins_path / plugin_info["jar_name"]
                with open(jar_path, 'wb') as f:
                    f.write(download_response.content)
                
                return {
                    "success": True,
                    "message": f"{plugin_info['name']} v{latest['version_number']} instalado correctamente",
                    "version": latest['version_number'],
                    "filename": plugin_info["jar_name"]
                }
        
        except httpx.TimeoutException:
            return {"success": False, "error": "Timeout al conectar con Modrinth"}
        except Exception as e:
            print(f"Error installing plugin {plugin_id}: {e}")
            return {"success": False, "error": str(e)}
    
    async def uninstall_plugin(self, plugin_id: str) -> Dict:
        """Desinstalar plugin recomendado"""
        try:
            # Buscar plugin
            plugin_info = None
            for plugin in self.get_recommended_plugins():
                if plugin["id"] == plugin_id:
                    plugin_info = plugin
                    break
            
            if not plugin_info:
                return {"success": False, "error": "Plugin no encontrado"}
            
            if not plugin_info["installed"]:
                return {"success": False, "error": "Plugin no está instalado"}
            
            # Eliminar JAR
            jar_path = self.plugins_path / plugin_info["jar_name"]
            jar_path.unlink()
            
            # Eliminar carpeta de datos si existe
            plugin_folder = self.plugins_path / plugin_info["name"]
            if plugin_folder.exists():
                import shutil
                shutil.rmtree(plugin_folder)
            
            return {
                "success": True,
                "message": f"{plugin_info['name']} desinstalado correctamente"
            }
        
        except Exception as e:
            print(f"Error uninstalling plugin {plugin_id}: {e}")
            return {"success": False, "error": str(e)}


# Instancia singleton
recommended_plugins_service = RecommendedPluginsService()
