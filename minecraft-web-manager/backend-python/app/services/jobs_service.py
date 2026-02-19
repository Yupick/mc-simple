"""Servicio para Jobs"""
from pathlib import Path
import yaml
from app.core.config import settings

class JobsService:
    def __init__(self):
        self.plugins_path = Path(settings.SERVER_PATH) / "plugins"
        self.jobs_path = self.plugins_path / "Jobs"

    def list_config_files(self):
        if not self.jobs_path.exists():
            return []
        return [str(f.name) for f in self.jobs_path.glob("*.yml")]

    def read_config_file(self, filename):
        file_path = self.jobs_path / filename
        if not file_path.exists():
            raise ValueError("Archivo no encontrado")
        return file_path.read_text(encoding="utf-8")

    def write_config_file(self, filename, content):
        file_path = self.jobs_path / filename
        file_path.write_text(content, encoding="utf-8")

    def get_visual_config(self):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            return {
                "defaultPay": data.get('default-pay', 10.0),
                "xpPerAction": data.get('xp-per-action', 1.0),
                "maxJobsPerPlayer": data.get('max-jobs-per-player', 3)
            }
        except Exception:
            return {"defaultPay": 10.0, "xpPerAction": 1.0, "maxJobsPerPlayer": 3}

    def save_visual_config(self, config):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            data['default-pay'] = config.get('defaultPay', 10.0)
            data['xp-per-action'] = config.get('xpPerAction', 1.0)
            data['max-jobs-per-player'] = config.get('maxJobsPerPlayer', 3)
            self.write_config_file("config.yml", yaml.safe_dump(data, allow_unicode=True))
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

jobs_service = JobsService()
