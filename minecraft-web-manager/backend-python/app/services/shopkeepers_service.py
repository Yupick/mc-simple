"""Servicio para Shopkeepers"""
from pathlib import Path
import yaml
from app.core.config import settings

class ShopkeepersService:
    def __init__(self):
        self.plugins_path = Path(settings.SERVER_PATH) / "plugins"
        self.sh_path = self.plugins_path / "Shopkeepers"

    def list_config_files(self):
        if not self.sh_path.exists():
            return []
        return [str(f.name) for f in self.sh_path.glob("*.yml")]

    def read_config_file(self, filename):
        file_path = self.sh_path / filename
        if not file_path.exists():
            raise ValueError("Archivo no encontrado")
        return file_path.read_text(encoding="utf-8")

    def write_config_file(self, filename, content):
        file_path = self.sh_path / filename
        file_path.write_text(content, encoding="utf-8")

    def get_visual_config(self):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            return {
                "defaultCurrency": data.get('default-currency', '$'),
                "tradeFee": data.get('trade-fee', 0.0),
                "npcPersistence": data.get('npc-persistence', True)
            }
        except Exception:
            return {"defaultCurrency": '$', "tradeFee": 0.0, "npcPersistence": True}

    def save_visual_config(self, config):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            data['default-currency'] = config.get('defaultCurrency', '$')
            data['trade-fee'] = config.get('tradeFee', 0.0)
            data['npc-persistence'] = config.get('npcPersistence', True)
            self.write_config_file("config.yml", yaml.safe_dump(data, allow_unicode=True))
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

shopkeepers_service = ShopkeepersService()
