"""Servicio para Citizens"""
from pathlib import Path
import yaml
from app.core.config import settings

class CitizensService:
    def __init__(self):
        self.plugins_path = Path(settings.SERVER_PATH) / "plugins"
        self.ct_path = self.plugins_path / "Citizens"

    def list_config_files(self):
        if not self.ct_path.exists():
            return []
        return [str(f.name) for f in self.ct_path.glob("*.yml")]

    def read_config_file(self, filename):
        file_path = self.ct_path / filename
        if not file_path.exists():
            raise ValueError("Archivo no encontrado")
        return file_path.read_text(encoding="utf-8")

    def write_config_file(self, filename, content):
        file_path = self.ct_path / filename
        file_path.write_text(content, encoding="utf-8")

    def get_visual_config(self):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            return {
                "npcPersistence": data.get('npc-persistence', True),
                "defaultPathing": data.get('default-pathing', 'walk'),
                "skinFetch": data.get('skin-fetch', True)
            }
        except Exception:
            return {"npcPersistence": True, "defaultPathing": 'walk', "skinFetch": True}

    def save_visual_config(self, config):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            data['npc-persistence'] = config.get('npcPersistence', True)
            data['default-pathing'] = config.get('defaultPathing', 'walk')
            data['skin-fetch'] = config.get('skinFetch', True)
            self.write_config_file("config.yml", yaml.safe_dump(data, allow_unicode=True))
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

citizens_service = CitizensService()
