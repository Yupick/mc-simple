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
                "source": "modrinth",
                "source_id": "resourcepackmanager",
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
            },
            {
                "id": "viaversion",
                "name": "ViaVersion",
                "description": "Permite que jugadores con versiones más nuevas se conecten a tu servidor",
                "source": "hangar",
                "source_id": "ViaVersion/ViaVersion",
                "jar_name": "ViaVersion.jar",
                "version": None,
                "installed": False,
                "has_web_integration": False,
                "web_route": None,
                "features": [
                    "Soporte multi-versión",
                    "Compatible desde 1.8 hasta última versión",
                    "Sin lag adicional",
                    "Actualización automática"
                ],
                "limitations": [
                    "Algunos bloques nuevos pueden no verse correctamente en versiones antiguas"
                ]
            },
            {
                "id": "viabackwards",
                "name": "ViaBackwards",
                "description": "Complemento de ViaVersion que permite jugadores con versiones antiguas conectarse",
                "source": "hangar",
                "source_id": "ViaVersion/ViaBackwards",
                "jar_name": "ViaBackwards.jar",
                "version": None,
                "installed": False,
                "has_web_integration": False,
                "web_route": None,
                "features": [
                    "Compatibilidad hacia atrás",
                    "Funciona con ViaVersion",
                    "Soporte de múltiples versiones"
                ],
                "limitations": [
                    "Requiere ViaVersion instalado"
                ]
            },
            {
                "id": "protocollib",
                "name": "ProtocolLib",
                "description": "Librería para manipular paquetes de red, requerida por muchos plugins",
                "source": "hangar_external",
                "source_id": "dmulloy2/ProtocolLib",
                "jar_name": "ProtocolLib.jar",
                "version": None,
                "installed": False,
                "has_web_integration": False,
                "web_route": None,
                "features": [
                    "Librería de paquetes",
                    "Base para muchos plugins",
                    "Alto rendimiento",
                    "API completa"
                ],
                "limitations": [
                    "Es una dependencia, no un plugin funcional por sí solo"
                ]
            },
            {
                "id": "vaultunlocked",
                "name": "VaultUnlocked",
                "description": "Fork moderno de Vault - API de economía y permisos para plugins",
                "source": "hangar",
                "source_id": "TNE/VaultUnlocked",
                "jar_name": "VaultUnlocked.jar",
                "version": None,
                "installed": False,
                "has_web_integration": False,
                "web_route": None,
                "features": [
                    "Compatible con Vault API",
                    "Sistema de economía",
                    "Gestión de permisos",
                    "Mantenido activamente"
                ],
                "limitations": [
                    "Requiere un plugin de permisos (como LuckPerms)"
                ]
            },
            {
                "id": "geyser",
                "name": "Geyser-Spigot",
                "description": "Permite que jugadores de Bedrock Edition se conecten al servidor Java",
                "source": "hangar_external",
                "source_id": "GeyserMC/Geyser",
                "jar_name": "Geyser-Spigot.jar",
                "version": None,
                "installed": False,
                "has_web_integration": False,
                "web_route": None,
                "features": [
                    "Cross-play Java-Bedrock",
                    "Sin mods en cliente",
                    "Traducción automática",
                    "Compatible con mayoría de plugins"
                ],
                "limitations": [
                    "Algunas mecánicas de Java no funcionan igual en Bedrock"
                ]
            },
            {
                "id": "floodgate",
                "name": "Floodgate",
                "description": "Complemento de Geyser que permite login sin cuenta Java para jugadores Bedrock",
                "source": "hangar_external",
                "source_id": "GeyserMC/Floodgate",
                "jar_name": "floodgate-spigot.jar",
                "version": None,
                "installed": False,
                "has_web_integration": False,
                "web_route": None,
                "features": [
                    "Login sin cuenta Microsoft",
                    "Integración con Geyser",
                    "Sistema de autenticación propio"
                ],
                "limitations": [
                    "Requiere Geyser instalado",
                    "Jugadores Bedrock tienen prefijo . en su nombre"
                ]
            },
            {
                "id": "worldedit",
                "name": "WorldEdit",
                "description": "Herramientas de edición masiva de mundos y regiones",
                "source": "modrinth",
                "source_id": "worldedit",
                "jar_name": "WorldEdit.jar",
                "version": None,
                "installed": False,
                "has_web_integration": True,
                "web_route": "/mmorpg/worldedit",
                "features": [
                    "Edición masiva",
                    "Selecciones avanzadas",
                    "Historial de cambios"
                ],
                "limitations": [
                    "Requiere permisos adecuados"
                ]
            },
            {
                "id": "luckperms",
                "name": "LuckPerms",
                "description": "Sistema de permisos avanzado y escalable",
                "source": "modrinth",
                "source_id": "luckperms",
                "jar_name": "LuckPerms.jar",
                "version": None,
                "installed": False,
                "has_web_integration": True,
                "web_route": "/mmorpg/luckperms",
                "features": [
                    "Permisos y grupos",
                    "Herencia flexible",
                    "Backend SQLite/SQL"
                ],
                "limitations": [
                    "Requiere configuración inicial"
                ]
            },
            {
                "id": "worldguard",
                "name": "WorldGuard",
                "description": "Protección de regiones y control de flags",
                "source": "modrinth",
                "source_id": "worldguard",
                "jar_name": "WorldGuard.jar",
                "version": None,
                "installed": False,
                "has_web_integration": True,
                "web_route": "/mmorpg/worldguard",
                "features": [
                    "Regiones protegidas",
                    "Flags avanzados",
                    "Integración con WorldEdit"
                ],
                "limitations": [
                    "Requiere WorldEdit"
                ]
            },
            {
                "id": "quests",
                "name": "Quests",
                "description": "Sistema de misiones con dialogos y recompensas",
                "source": "modrinth",
                "source_id": "quests",
                "jar_name": "Quests.jar",
                "version": None,
                "installed": False,
                "has_web_integration": True,
                "web_route": "/mmorpg/quests",
                "features": [
                    "Misiones configurables",
                    "NPCs y objetivos",
                    "Recompensas" 
                ],
                "limitations": [
                    "Requiere configuracion previa"
                ]
            },
            {
                "id": "jobs",
                "name": "Jobs Reborn",
                "description": "Sistema de trabajos con pagos y progresion",
                "source": "modrinth",
                "source_id": "jobs-reborn",
                "jar_name": "Jobs.jar",
                "data_folder": "Jobs",
                "version": None,
                "installed": False,
                "has_web_integration": True,
                "web_route": "/mmorpg/jobs",
                "features": [
                    "Trabajos y niveles",
                    "Economia integrada",
                    "Multiples acciones" 
                ],
                "limitations": [
                    "Requiere Vault/LuckPerms"
                ]
            },
            {
                "id": "shopkeepers",
                "name": "Shopkeepers",
                "description": "NPCs de tienda personalizables",
                "source": "modrinth",
                "source_id": "shopkeepers",
                "jar_name": "Shopkeepers.jar",
                "version": None,
                "installed": False,
                "has_web_integration": True,
                "web_route": "/mmorpg/shopkeepers",
                "features": [
                    "Tiendas con NPC",
                    "Soporte de economia",
                    "Configuracion flexible"
                ],
                "limitations": [
                    "Requiere plugin de economia"
                ]
            },
            {
                "id": "mythicmobs",
                "name": "MythicMobs",
                "description": "Mobs personalizados, habilidades y bosses",
                "source": "modrinth",
                "source_id": "mythicmobs",
                "jar_name": "MythicMobs.jar",
                "version": None,
                "installed": False,
                "has_web_integration": True,
                "web_route": "/mmorpg/mythicmobs",
                "features": [
                    "Mobs custom",
                    "Skills avanzadas",
                    "Soporte de drops" 
                ],
                "limitations": [
                    "Curva de configuracion alta"
                ]
            },
            {
                "id": "citizens",
                "name": "Citizens",
                "description": "NPCs avanzados para servidores RPG",
                "source": "modrinth",
                "source_id": "citizens",
                "jar_name": "Citizens.jar",
                "version": None,
                "installed": False,
                "has_web_integration": True,
                "web_route": "/mmorpg/citizens",
                "features": [
                    "NPCs configurables",
                    "Skins y rutas",
                    "Integracion con quests" 
                ],
                "limitations": [
                    "Requiere configuracion por comandos"
                ]
            }
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
        """Instalar plugin desde Modrinth o Hangar"""
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
            
            # Determinar fuente y descargar
            if plugin_info["source"] == "modrinth":
                return await self._download_from_modrinth(plugin_info)
            elif plugin_info["source"] == "hangar":
                return await self._download_from_hangar(plugin_info, use_external=False)
            elif plugin_info["source"] == "hangar_external":
                return await self._download_from_hangar(plugin_info, use_external=True)
            else:
                return {"success": False, "error": f"Fuente desconocida: {plugin_info['source']}"}
        
        except httpx.TimeoutException:
            return {"success": False, "error": "Timeout al conectar con el servidor de descarga"}
        except Exception as e:
            print(f"Error installing plugin {plugin_id}: {e}")
            return {"success": False, "error": str(e)}
    
    async def _download_from_modrinth(self, plugin_info: Dict) -> Dict:
        """Descargar plugin desde Modrinth"""
        api_url = f"https://api.modrinth.com/v2/project/{plugin_info['source_id']}/version"
        
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
    
    async def _download_from_hangar(self, plugin_info: Dict, use_external: bool = False) -> Dict:
        """Descargar plugin desde Hangar"""
        api_url = f"https://hangar.papermc.io/api/v1/projects/{plugin_info['source_id']}/versions"
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            # Obtener versiones
            response = await client.get(api_url)
            if response.status_code != 200:
                return {"success": False, "error": f"Error al consultar Hangar API: {response.status_code}"}
            
            data = response.json()
            
            if not data.get('result') or len(data['result']) == 0:
                return {"success": False, "error": "No hay versiones disponibles"}
            
            # Primera versión es la más reciente
            latest = data['result'][0]
            version_number = latest.get('name', 'unknown')
            
            # Obtener URL de descarga
            downloads = latest.get('downloads', {})
            paper_download = downloads.get('PAPER', {})
            
            if use_external:
                download_url = paper_download.get('externalUrl')
            else:
                download_url = paper_download.get('downloadUrl')
                if download_url and not download_url.startswith('http'):
                    download_url = f"https://hangar.papermc.io{download_url}"
            
            if not download_url:
                return {"success": False, "error": "No se encontró URL de descarga"}
            
            # Descargar
            download_response = await client.get(download_url)
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
                "message": f"{plugin_info['name']} v{version_number} instalado correctamente",
                "version": version_number,
                "filename": plugin_info["jar_name"]
            }
    
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
            folder_name = plugin_info.get("data_folder", plugin_info["name"])
            plugin_folder = self.plugins_path / folder_name
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
