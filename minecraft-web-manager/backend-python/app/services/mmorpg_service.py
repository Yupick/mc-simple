"""Servicio para gestión de plugins MMORPG"""
from pathlib import Path
from typing import Dict, List, Optional

from app.core.config import settings


class MMORPGService:
    """Gestiona plugins MMORPG y sus archivos de configuración"""

    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.plugins_path = self.server_path / "plugins"

        self.plugins = {
            "worldedit": {
                "id": "worldedit",
                "name": "WorldEdit",
                "jar_name": "WorldEdit.jar",
                "folder": "WorldEdit"
            },
            "luckperms": {
                "id": "luckperms",
                "name": "LuckPerms",
                "jar_name": "LuckPerms.jar",
                "folder": "LuckPerms"
            },
            "worldguard": {
                "id": "worldguard",
                "name": "WorldGuard",
                "jar_name": "WorldGuard.jar",
                "folder": "WorldGuard"
            },
            "quests": {
                "id": "quests",
                "name": "Quests",
                "jar_name": "Quests.jar",
                "folder": "Quests"
            },
            "jobs": {
                "id": "jobs",
                "name": "Jobs Reborn",
                "jar_name": "Jobs.jar",
                "folder": "Jobs"
            },
            "shopkeepers": {
                "id": "shopkeepers",
                "name": "Shopkeepers",
                "jar_name": "Shopkeepers.jar",
                "folder": "Shopkeepers"
            },
            "mythicmobs": {
                "id": "mythicmobs",
                "name": "MythicMobs",
                "jar_name": "MythicMobs.jar",
                "folder": "MythicMobs"
            },
            "citizens": {
                "id": "citizens",
                "name": "Citizens",
                "jar_name": "Citizens.jar",
                "folder": "Citizens"
            }
        }

    def get_plugin(self, plugin_id: str) -> Optional[Dict]:
        """Obtener metadata de plugin"""
        return self.plugins.get(plugin_id)

    def get_status(self) -> Dict:
        """Estado de instalación y habilitación"""
        status = {}
        for plugin_id, info in self.plugins.items():
            jar_path = self.plugins_path / info["jar_name"]
            disabled_path = self.plugins_path / f"{info['jar_name']}.disabled"
            status[plugin_id] = {
                "installed": jar_path.exists() or disabled_path.exists(),
                "enabled": jar_path.exists()
            }
        return status

    def list_config_files(self, plugin_id: str) -> List[Dict]:
        """Listar archivos de configuración dentro de la carpeta del plugin"""
        info = self.get_plugin(plugin_id)
        if not info:
            return []

        folder = self.plugins_path / info["folder"]
        if not folder.exists():
            return []

        allowed_ext = {".yml", ".yaml", ".json", ".conf", ".toml", ".txt"}
        files = []

        for file_path in folder.rglob("*"):
            if not file_path.is_file():
                continue
            if file_path.suffix.lower() not in allowed_ext:
                continue
            if "/logs/" in file_path.as_posix():
                continue

            rel_path = file_path.relative_to(folder).as_posix()
            stat = file_path.stat()
            files.append({
                "path": rel_path,
                "size": stat.st_size,
                "modified": int(stat.st_mtime)
            })

        files.sort(key=lambda x: x["path"].lower())
        return files

    def read_config_file(self, plugin_id: str, rel_path: str) -> str:
        """Leer archivo de configuración"""
        file_path = self._resolve_config_path(plugin_id, rel_path)
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    def write_config_file(self, plugin_id: str, rel_path: str, content: str) -> bool:
        """Guardar archivo de configuración"""
        file_path = self._resolve_config_path(plugin_id, rel_path)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True

    def _resolve_config_path(self, plugin_id: str, rel_path: str) -> Path:
        """Resolver ruta de archivo y prevenir path traversal"""
        info = self.get_plugin(plugin_id)
        if not info:
            raise ValueError("Plugin no válido")

        folder = self.plugins_path / info["folder"]
        target = (folder / rel_path).resolve()
        if not str(target).startswith(str(folder.resolve())):
            raise ValueError("Ruta inválida")
        if not target.exists() or not target.is_file():
            raise ValueError("Archivo no encontrado")
        return target


mmorpg_service = MMORPGService()
