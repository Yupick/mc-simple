"""Servicio para WorldGuard"""
from pathlib import Path
import yaml
from app.core.config import settings
from app.services.help_generator import generate_help_from_object

class WorldGuardService:
    def __init__(self):
        self.plugins_path = Path(settings.SERVER_PATH) / "plugins"
        self.wg_path = self.plugins_path / "WorldGuard"

    def list_config_files(self):
        if not self.wg_path.exists():
            return []
        return [str(f.name) for f in self.wg_path.glob("*.yml")]

    def read_config_file(self, filename):
        file_path = self.wg_path / filename
        if not file_path.exists():
            raise ValueError("Archivo no encontrado")
        return file_path.read_text(encoding="utf-8")

    def write_config_file(self, filename, content):
        file_path = self.wg_path / filename
        file_path.write_text(content, encoding="utf-8")

    def get_visual_config(self):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            cfg = {
                "defaultFlags": data.get('default-flags', {}),
                "protectionRadius": data.get('protection-radius', 0),
                "bypassPermission": data.get('bypass-permission', 'worldguard.bypass'),
                "logging": data.get('logging', True)
            }
            cfg['help'] = generate_help_from_object('worldguard', data)
            return cfg
        except Exception:
            cfg = {"defaultFlags": {}, "protectionRadius": 0, "bypassPermission": 'worldguard.bypass', "logging": True}
            cfg['help'] = generate_help_from_object('worldguard', {})
            return cfg

    def save_visual_config(self, config):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            data['default-flags'] = config.get('defaultFlags', {})
            data['protection-radius'] = config.get('protectionRadius', 0)
            data['bypass-permission'] = config.get('bypassPermission', 'worldguard.bypass')
            data['logging'] = config.get('logging', True)
            self.write_config_file("config.yml", yaml.safe_dump(data, allow_unicode=True))
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

worldguard_service = WorldGuardService()
