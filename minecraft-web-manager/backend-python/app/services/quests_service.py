"""Servicio para Quests"""
from pathlib import Path
import yaml
from app.core.config import settings
from app.services.help_generator import generate_help_from_object

class QuestsService:
    def __init__(self):
        self.plugins_path = Path(settings.SERVER_PATH) / "plugins"
        self.q_path = self.plugins_path / "Quests"

    def list_config_files(self):
        if not self.q_path.exists():
            return []
        return [str(f.name) for f in self.q_path.glob("*.yml")]

    def read_config_file(self, filename):
        file_path = self.q_path / filename
        if not file_path.exists():
            raise ValueError("Archivo no encontrado")
        return file_path.read_text(encoding="utf-8")

    def write_config_file(self, filename, content):
        file_path = self.q_path / filename
        file_path.write_text(content, encoding="utf-8")

    def get_visual_config(self):
        try:
            # Use config.yml as source of visual options
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content) or {}
            cfg = {
                "categoriesEnabled": data.get('options', {}).get('categories-enabled', True),
                "titlesEnabled": data.get('options', {}).get('titles-enabled', True),
                "allowQuestCancel": data.get('options', {}).get('allow-quest-cancel', True),
                "allowQuestTrack": data.get('options', {}).get('allow-quest-track', True),
                "questLimitDefault": data.get('options', {}).get('quest-limit', {}).get('default', 2),
                "verboseLoggingLevel": data.get('options', {}).get('verbose-logging-level', 2),
                "storageProvider": data.get('options', {}).get('storage', {}).get('provider', 'yaml'),
                "storageDatabase": data.get('options', {}).get('storage', {}).get('database-settings', {}).get('network', {}).get('database', ''),
                "storageUsername": data.get('options', {}).get('storage', {}).get('database-settings', {}).get('network', {}).get('username', ''),
                "storageAddress": data.get('options', {}).get('storage', {}).get('database-settings', {}).get('network', {}).get('address', ''),
                "questAutosaveInterval": data.get('options', {}).get('performance-tweaking', {}).get('quest-autosave-interval', 12000)
            }
            cfg['help'] = generate_help_from_object('quests', data)
            return cfg
        except Exception:
            cfg = {
                "categoriesEnabled": True,
                "titlesEnabled": True,
                "allowQuestCancel": True,
                "allowQuestTrack": True,
                "questLimitDefault": 2,
                "verboseLoggingLevel": 2,
                "storageProvider": 'yaml',
                "storageDatabase": '',
                "storageUsername": '',
                "storageAddress": '',
                "questAutosaveInterval": 12000
            }
            cfg['help'] = generate_help_from_object('quests', {})
            return cfg

    def save_visual_config(self, config):
        try:
            # Persist changes into config.yml
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content) or {}
            opts = data.setdefault('options', {})
            opts.setdefault('quest-limit', {})
            opts['categories-enabled'] = config.get('categoriesEnabled', opts.get('categories-enabled', True))
            opts['titles-enabled'] = config.get('titlesEnabled', opts.get('titles-enabled', True))
            opts['allow-quest-cancel'] = config.get('allowQuestCancel', opts.get('allow-quest-cancel', True))
            opts['allow-quest-track'] = config.get('allowQuestTrack', opts.get('allow-quest-track', True))
            opts['quest-limit']['default'] = config.get('questLimitDefault', opts['quest-limit'].get('default', 2))
            opts['verbose-logging-level'] = config.get('verboseLoggingLevel', opts.get('verbose-logging-level', 2))
            storage = opts.setdefault('storage', {})
            storage['provider'] = config.get('storageProvider', storage.get('provider', 'yaml'))
            storage.setdefault('database-settings', {})
            storage['database-settings'].setdefault('network', {})
            storage['database-settings']['network']['database'] = config.get('storageDatabase', storage['database-settings']['network'].get('database', ''))
            storage['database-settings']['network']['username'] = config.get('storageUsername', storage['database-settings']['network'].get('username', ''))
            storage['database-settings']['network']['address'] = config.get('storageAddress', storage['database-settings']['network'].get('address', ''))
            perf = opts.setdefault('performance-tweaking', {})
            perf['quest-autosave-interval'] = config.get('questAutosaveInterval', perf.get('quest-autosave-interval', 12000))
            self.write_config_file("config.yml", yaml.safe_dump(data, allow_unicode=True))
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

quests_service = QuestsService()
