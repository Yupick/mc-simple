"""Servicio para gestión de ResourcePackManager"""
import yaml
import shutil
import httpx
import hashlib
import time
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from app.core.config import settings
from app.services.rcon_service import rcon_service


class ResourcePackService:
    """Servicio para gestionar el plugin ResourcePackManager"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.plugin_jar = self.server_path / "plugins" / "ResourcePackManager.jar"
        self.plugin_path = self.server_path / "plugins" / "ResourcePackManager"
        self.config_file = self.plugin_path / "config.yml"
        self.mixer_path = self.plugin_path / "mixer"
        self.output_path = self.plugin_path / "output"
        self.compatible_plugins_path = self.plugin_path / "compatible_plugins"
        self.collision_log = self.plugin_path / "collision_log.txt"
        # Carpeta pública dentro del panel para servir resourcepacks
        # Debe apuntar a backend-python/static/resourcepacks (dos niveles arriba: backend-python/static)
        self.public_resourcepacks = Path(__file__).resolve().parents[2] / "static" / "resourcepacks"
        # Asegurarse de que exista
        try:
            self.public_resourcepacks.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass
    
    def is_plugin_installed(self) -> bool:
        """Verificar si el plugin está instalado"""
        return self.plugin_jar.exists()
    
    def get_plugin_status(self) -> Dict:
        """Obtener estado completo del plugin"""
        status = {
            "installed": self.is_plugin_installed(),
            "config_exists": self.config_file.exists() if self.is_plugin_installed() else False,
            "folders_exist": self.plugin_path.exists() if self.is_plugin_installed() else False,
            "pack_generated": False
        }
        
        if status["folders_exist"]:
            # Verificar si hay pack generado
            output_zip = self.output_path / "ResourcePackManager_RSP.zip"
            status["pack_generated"] = output_zip.exists()
        
        return status
    
    def parse_config(self) -> Optional[Dict]:
        """Leer y parsear config.yml"""
        try:
            if not self.config_file.exists():
                return None
            
            with open(self.config_file, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            return config
        except Exception as e:
            print(f"Error parsing config: {e}")
            return None
    
    def update_config(self, data: Dict) -> bool:
        """Actualizar config.yml con nuevos valores"""
        try:
            # Leer config actual
            config = self.parse_config()
            if config is None:
                return False
            
            # Actualizar valores permitidos
            if 'autoHost' in data:
                config['autoHost'] = data['autoHost']
            if 'forceResourcePack' in data:
                config['forceResourcePack'] = data['forceResourcePack']
            if 'resourcePackPrompt' in data:
                config['resourcePackPrompt'] = data['resourcePackPrompt']
            
            # Guardar
            with open(self.config_file, 'w', encoding='utf-8') as f:
                yaml.safe_dump(config, f, default_flow_style=False, allow_unicode=True)
            
            return True
        except Exception as e:
            print(f"Error updating config: {e}")
            return False
    
    def update_priority_order(self, order: List[str]) -> bool:
        """Actualizar priorityOrder en config.yml"""
        try:
            config = self.parse_config()
            if config is None:
                return False
            
            config['priorityOrder'] = order
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                yaml.safe_dump(config, f, default_flow_style=False, allow_unicode=True)
            
            return True
        except Exception as e:
            print(f"Error updating priority order: {e}")
            return False
    
    def list_mixer_packs(self) -> List[Dict]:
        """Listar packs en carpeta mixer/"""
        try:
            if not self.mixer_path.exists():
                return []
            
            packs = []
            config = self.parse_config()
            priority_order = config.get('priorityOrder', []) if config else []
            
            for pack_file in self.mixer_path.glob("*.zip"):
                stat = pack_file.stat()
                packs.append({
                    "name": pack_file.name,  # Cambiado de "filename" a "name"
                    "size": stat.st_size,
                    "modified": int(stat.st_mtime),  # Cambiado a timestamp en segundos
                    "in_priority": pack_file.stem in priority_order
                })
            
            return packs
        except Exception as e:
            print(f"Error listing mixer packs: {e}")
            return []
    
    def upload_pack(self, file_content: bytes, filename: str) -> bool:
        """Guardar pack en mixer/ y agregarlo a priorityOrder"""
        try:
            # Crear carpeta si no existe
            self.mixer_path.mkdir(parents=True, exist_ok=True)
            
            # Guardar archivo
            pack_path = self.mixer_path / filename
            with open(pack_path, 'wb') as f:
                f.write(file_content)
            
            # Agregar a priorityOrder si no está
            config = self.parse_config()
            if config:
                priority_order = config.get('priorityOrder', [])
                pack_name = Path(filename).stem
                
                if pack_name not in priority_order:
                    priority_order.append(pack_name)
                    config['priorityOrder'] = priority_order
                    
                    with open(self.config_file, 'w', encoding='utf-8') as f:
                        yaml.safe_dump(config, f, default_flow_style=False, allow_unicode=True)
            
            return True
        except Exception as e:
            print(f"Error uploading pack: {e}")
            return False
    
    def delete_pack(self, filename: str) -> bool:
        """Eliminar pack de mixer/ y remover de priorityOrder"""
        try:
            pack_path = self.mixer_path / filename
            if not pack_path.exists():
                return False
            
            # Eliminar archivo
            pack_path.unlink()
            
            # Remover de priorityOrder
            config = self.parse_config()
            if config:
                priority_order = config.get('priorityOrder', [])
                pack_name = Path(filename).stem
                
                if pack_name in priority_order:
                    priority_order.remove(pack_name)
                    config['priorityOrder'] = priority_order
                    
                    with open(self.config_file, 'w', encoding='utf-8') as f:
                        yaml.safe_dump(config, f, default_flow_style=False, allow_unicode=True)
            
            return True
        except Exception as e:
            print(f"Error deleting pack: {e}")
            return False
    
    def list_compatible_plugins(self) -> List[Dict]:
        """Listar plugins compatibles detectados"""
        try:
            if not self.compatible_plugins_path.exists():
                return []
            
            plugins = []
            for plugin_file in self.compatible_plugins_path.glob("*.yml"):
                with open(plugin_file, 'r', encoding='utf-8') as f:
                    plugin_config = yaml.safe_load(f)
                
                plugins.append({
                    "name": plugin_config.get('pluginName', plugin_file.stem),
                    "enabled": plugin_config.get('isEnabled', True),
                    "local_path": plugin_config.get('localPath', ''),
                    "encrypts": plugin_config.get('encrypts', False),
                    "distributes": plugin_config.get('distributes', False)
                })
            
            return plugins
        except Exception as e:
            print(f"Error listing compatible plugins: {e}")
            return []
    
    def toggle_plugin(self, plugin_name: str, enabled: bool) -> bool:
        """Habilitar/deshabilitar plugin compatible"""
        try:
            plugin_file = self.compatible_plugins_path / f"{plugin_name}.yml"
            if not plugin_file.exists():
                return False
            
            with open(plugin_file, 'r', encoding='utf-8') as f:
                plugin_config = yaml.safe_load(f)
            
            plugin_config['isEnabled'] = enabled
            
            with open(plugin_file, 'w', encoding='utf-8') as f:
                yaml.safe_dump(plugin_config, f, default_flow_style=False, allow_unicode=True)
            
            return True
        except Exception as e:
            print(f"Error toggling plugin: {e}")
            return False
    
    def read_collision_log(self) -> str:
        """Leer archivo collision_log.txt"""
        try:
            if not self.collision_log.exists():
                return ""
            
            with open(self.collision_log, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading collision log: {e}")
            return ""
    
    def get_output_info(self) -> Dict:
        """Obtener información del pack final generado"""
        try:
            output_zip = self.output_path / "ResourcePackManager_RSP.zip"
            
            if not output_zip.exists():
                return {
                    "exists": False,
                    "size": 0,
                    "modified": None,
                    "sha1": None
                }
            
            stat = output_zip.stat()
            
            # Leer SHA1 si existe
            sha1_file = self.output_path / "ResourcePackManager_RSP.zip.sha1"
            sha1 = None
            if sha1_file.exists():
                with open(sha1_file, 'r') as f:
                    sha1 = f.read().strip()
            
            return {
                "exists": True,
                "size": stat.st_size,
                "modified": int(stat.st_mtime),  # Timestamp en segundos
                "sha1": sha1,
                "path": str(output_zip)
            }
        except Exception as e:
            print(f"Error getting output info: {e}")
            return {"exists": False, "size": 0, "modified": None, "sha1": None}
    
    async def reload_plugin(self) -> bool:
        """Recargar plugin vía comando RCON"""
        try:
            result = await rcon_service.execute_command("rspm reload")
            return result is not None
        except Exception as e:
            print(f"Error reloading plugin: {e}")
            return False

    # --- Nuevas funciones para hosting y manejo de resourcepack ---
    def compute_sha1(self, path: Path) -> Optional[str]:
        """Calcular SHA1 de un archivo"""
        try:
            h = hashlib.sha1()
            with open(path, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b''):
                    h.update(chunk)
            return h.hexdigest()
        except Exception as e:
            print(f"Error computing sha1: {e}")
            return None

    def host_output_pack(self) -> Optional[Dict]:
        """Si existe el pack generado por ResourcePackManager, copiarlo a carpeta pública y devolver metadata"""
        try:
            output_zip = self.output_path / "ResourcePackManager_RSP.zip"
            if not output_zip.exists():
                return None

            dest = self.public_resourcepacks / "ResourcePackManager_RSP.zip"
            # Copiar y sobrescribir
            shutil.copy2(output_zip, dest)

            sha1 = self.compute_sha1(dest)

            return {
                "filename": dest.name,
                "relative_path": f"/static/resourcepacks/{dest.name}",
                "size": dest.stat().st_size,
                "modified": int(dest.stat().st_mtime),
                "sha1": sha1
            }
        except Exception as e:
            print(f"Error hosting output pack: {e}")
            return None

    def upload_and_host_pack(self, file_bytes: bytes, filename: str = "ResourcePackManager_RSP.zip") -> Optional[Dict]:
        """Guardar archivo subido en la carpeta pública con nombre fijo y devolver metadata"""
        try:
            dest = self.public_resourcepacks / filename
            with open(dest, 'wb') as f:
                f.write(file_bytes)

            sha1 = self.compute_sha1(dest)

            return {
                "filename": dest.name,
                "relative_path": f"/static/resourcepacks/{dest.name}",
                "size": dest.stat().st_size,
                "modified": int(dest.stat().st_mtime),
                "sha1": sha1
            }
        except Exception as e:
            print(f"Error uploading and hosting pack: {e}")
            return None

    def backup_server_properties(self) -> Optional[Path]:
        """Crear backup de server.properties y devolver path del backup"""
        try:
            props = self.server_path / "server.properties"
            if not props.exists():
                return None
            ts = int(time.time())
            backup = self.server_path / f"server.properties.bak.{ts}"
            shutil.copy2(props, backup)
            return backup
        except Exception as e:
            print(f"Error creating backup: {e}")
            return None

    def update_server_properties(self, resource_url: str, sha1: Optional[str], prompt: Optional[str], resource_id: Optional[str] = None) -> bool:
        """Actualizar o añadir claves relacionadas con resource-pack en server.properties"""
        try:
            props = self.server_path / "server.properties"
            if not props.exists():
                return False

            # Backup
            self.backup_server_properties()

            # Leer líneas
            lines = []
            with open(props, 'r', encoding='utf-8') as f:
                lines = f.read().splitlines()

            def set_prop(lines, key, value):
                found = False
                for i, line in enumerate(lines):
                    if line.startswith(key + "="):
                        lines[i] = f"{key}={value}"
                        found = True
                        break
                if not found:
                    lines.append(f"{key}={value}")

            set_prop(lines, 'resource-pack', resource_url)
            if sha1:
                set_prop(lines, 'resource-pack-sha1', sha1)
            if prompt is not None:
                set_prop(lines, 'resource-pack-prompt', prompt)
            if resource_id is not None:
                set_prop(lines, 'resource-pack-id', resource_id)

            # Escribir de nuevo
            with open(props, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines) + '\n')

            return True
        except Exception as e:
            print(f"Error updating server.properties: {e}")
            return False

    def rollback_server_properties(self) -> bool:
        """Restaurar el backup más reciente de server.properties"""
        try:
            props = self.server_path / "server.properties"
            backups = list(self.server_path.glob('server.properties.bak.*'))
            if not backups:
                return False

            # Elegir el backup con mayor timestamp (nombre contiene ts)
            latest = sorted(backups, key=lambda p: p.name.split('.')[-1])[-1]
            shutil.copy2(latest, props)
            return True
        except Exception as e:
            print(f"Error rolling back server.properties: {e}")
            return False
    
    async def install_plugin(self) -> bool:
        """Descargar e instalar plugin desde Modrinth"""
        try:
            # URL de la API de Modrinth
            project_id = "resourcepackmanager"
            api_url = f"https://api.modrinth.com/v2/project/{project_id}/version"
            
            async with httpx.AsyncClient() as client:
                # Obtener última versión
                response = await client.get(api_url)
                if response.status_code != 200:
                    return False
                
                versions = response.json()
                if not versions:
                    return False
                
                # Primera versión es la más reciente
                latest = versions[0]
                
                # Buscar archivo .jar
                jar_file = None
                for file in latest['files']:
                    if file['filename'].endswith('.jar'):
                        jar_file = file
                        break
                
                if not jar_file:
                    return False
                
                # Descargar
                download_response = await client.get(jar_file['url'])
                if download_response.status_code != 200:
                    return False
                
                # Crear carpeta plugins si no existe
                plugins_path = self.server_path / "plugins"
                plugins_path.mkdir(parents=True, exist_ok=True)
                
                # Guardar archivo
                with open(self.plugin_jar, 'wb') as f:
                    f.write(download_response.content)
                
                return True
        except Exception as e:
            print(f"Error installing plugin: {e}")
            return False


# Instancia singleton
resourcepack_service = ResourcePackService()
