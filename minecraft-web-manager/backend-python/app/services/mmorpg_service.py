"""Servicio para gestión de plugins MMORPG"""
from pathlib import Path
from typing import Dict, List, Optional

from app.core.config import settings
import shutil
from datetime import datetime


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
                "name": "Jobs",
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
            ,
            "essentials": {
                "id": "essentials",
                "name": "EssentialsX",
                "jar_name": "EssentialsX.jar",
                "folder": "Essentials"
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
            print(f"[mmorpg_service] folder not found: {folder}")
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
        print(f"[mmorpg_service] list_config_files for {plugin_id}: found {len(files)} files in {folder}")
        return files

    def read_config_file(self, plugin_id: str, rel_path: str) -> str:
        """Leer archivo de configuración"""
        file_path = self._resolve_config_path(plugin_id, rel_path)
        print(f"[mmorpg_service] read_config_file: reading {file_path}")
        if not file_path.exists():
            print(f"[mmorpg_service] read_config_file: file not found {file_path}, returning empty content")
            return ""
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    def write_config_file(self, plugin_id: str, rel_path: str, content: str) -> bool:
        """Guardar archivo de configuración"""
        file_path = self._resolve_config_path(plugin_id, rel_path)
        try:
            # Backup existing file before writing into plugin-specific Backup/ directory
            bak_dir = file_path.parent / 'Backup'
            if not bak_dir.exists():
                bak_dir.mkdir(parents=True, exist_ok=True)

            if file_path.exists():
                ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
                bak_name = f"{file_path.name}.{ts}.bak"
                bak_path = bak_dir / bak_name
                print(f"[mmorpg_service] write_config_file: creating backup {bak_path}")
                shutil.copy(str(file_path), str(bak_path))
                # Cleanup old backups, keep most recent 3
                all_baks = sorted([p for p in bak_dir.iterdir() if p.is_file() and p.name.startswith(file_path.name) and p.suffix == '.bak'], key=lambda p: p.stat().st_mtime, reverse=True)
                for old in all_baks[3:]:
                    try:
                        print(f"[mmorpg_service] write_config_file: removing old backup {old}")
                        old.unlink()
                    except Exception:
                        pass
            # ensure parent exists (allow creating new files and subfolders)
            if not file_path.parent.exists():
                file_path.parent.mkdir(parents=True, exist_ok=True)
            # Try to preserve leading comment block from existing file
            leading_comments = ''
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as oldf:
                        old = oldf.read()
                    lines = old.splitlines(True)
                    comment_lines = []
                    for ln in lines:
                        if ln.lstrip().startswith('#') or ln.strip() == '':
                            comment_lines.append(ln)
                        else:
                            break
                    leading_comments = ''.join(comment_lines)
                except Exception:
                    leading_comments = ''

            # write new content (prepend preserved leading comments)
            out_content = content
            if leading_comments:
                # ensure there's one blank line between comments and content
                if not content.startswith('\n'):
                    out_content = leading_comments + '\n' + content
                else:
                    out_content = leading_comments + content
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(out_content)
            return True
        except Exception as e:
            print(f"[mmorpg_service] write_config_file error: {e}")
            raise

    def _resolve_config_path(self, plugin_id: str, rel_path: str) -> Path:
        """Resolver ruta de archivo y prevenir path traversal"""
        info = self.get_plugin(plugin_id)
        if not info:
            raise ValueError("Plugin no válido")

        folder = self.plugins_path / info["folder"]
        target = (folder / rel_path).resolve()
        if not str(target).startswith(str(folder.resolve())):
            raise ValueError("Ruta inválida")
        # Permitimos que el archivo no exista aún (para crear nuevos archivos desde la UI).
        return target


mmorpg_service = MMORPGService()
