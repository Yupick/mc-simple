"""Servicio para LuckPerms"""
from pathlib import Path
import yaml
from app.core.config import settings
from app.services.help_generator import generate_help_from_object

class LuckPermsService:
    def __init__(self):
        self.plugins_path = Path(settings.SERVER_PATH) / "plugins"
        self.lp_path = self.plugins_path / "LuckPerms"

    def list_config_files(self):
        if not self.lp_path.exists():
            return []
        return [str(f.name) for f in self.lp_path.glob("*.yml")]

    def read_config_file(self, filename):
        file_path = self.lp_path / filename
        if not file_path.exists():
            raise ValueError("Archivo no encontrado")
        return file_path.read_text(encoding="utf-8")

    def write_config_file(self, filename, content):
        file_path = self.lp_path / filename
        file_path.write_text(content, encoding="utf-8")

    def get_visual_config(self):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            cfg = {
                "storageMethod": data.get('storage-method', 'sqlite'),
                "syncInterval": data.get('sync-interval', 60),
                "verbose": data.get('verbose', False)
            }
            cfg['help'] = generate_help_from_object('luckperms', data)
            return cfg
        except Exception:
            cfg = {"storageMethod": "sqlite", "syncInterval": 60, "verbose": False}
            cfg['help'] = generate_help_from_object('luckperms', {})
            return cfg

    def save_visual_config(self, config):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            data['storage-method'] = config.get('storageMethod', 'sqlite')
            data['sync-interval'] = config.get('syncInterval', 60)
            data['verbose'] = config.get('verbose', False)
            self.write_config_file("config.yml", yaml.safe_dump(data, allow_unicode=True))
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

luckperms_service = LuckPermsService()
