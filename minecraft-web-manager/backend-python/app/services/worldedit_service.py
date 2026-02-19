"""Servicio para gestionar WorldEdit"""
from pathlib import Path
import yaml
from app.core.config import settings
from app.services.help_generator import generate_help_from_object

class WorldEditService:
    def __init__(self):
        self.plugins_path = Path(settings.SERVER_PATH) / "plugins"
        self.we_path = self.plugins_path / "WorldEdit"

    def list_config_files(self):
        if not self.we_path.exists():
            return []
        return [str(f.name) for f in self.we_path.glob("*.yml")]

    def read_config_file(self, filename):
        file_path = self.we_path / filename
        if not file_path.exists():
            raise ValueError("Archivo no encontrado")
        return file_path.read_text(encoding="utf-8")

    def write_config_file(self, filename, content):
        file_path = self.we_path / filename
        file_path.write_text(content, encoding="utf-8")

    def get_visual_config(self):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            cfg = {
                "maxSelectionBlocks": data.get('max-selection-blocks', 100000),
                "saveHistory": data.get('save-history', True),
                "maxUndo": data.get('max-undo', 10),
                "autoSave": data.get('auto-save', False),
                # Limits
                "maxBlocksChanged": data.get('limits', {}).get('max-blocks-changed', {}).get('default', -1),
                "maxRadius": data.get('limits', {}).get('max-radius', -1),
                "maxBrushRadius": data.get('limits', {}).get('max-brush-radius', 5),
                "maxPolygonalPoints": data.get('limits', {}).get('max-polygonal-points', {}).get('default', -1),
                # Logging
                "logCommands": data.get('logging', {}).get('log-commands', False),
                "logFile": data.get('logging', {}).get('file', 'worldedit.log'),
                # Wand / tools
                "wandItem": data.get('wand-item', 'minecraft:wooden_axe'),
                "navigationWandItem": data.get('navigation-wand', {}).get('item', 'minecraft:compass'),
                "navigationWandMaxDistance": data.get('navigation-wand', {}).get('max-distance', 100),
                # Misc
                "debug": data.get('debug', False),
                "serverSideCui": data.get('server-side-cui', True),
                "commandBlockSupport": data.get('command-block-support', False),
                "historySize": data.get('history', {}).get('size', 15),
                "historyExpiration": data.get('history', {}).get('expiration', 10),
                "calculationTimeout": data.get('calculation', {}).get('timeout', 100),
                "allowSymbolicLinks": data.get('files', {}).get('allow-symbolic-links', False),
                "snapshotsDir": data.get('snapshots', {}).get('directory', ''),
                "savingDir": data.get('saving', {}).get('dir', '')
            }
            # generate help map from loaded YAML
            cfg['help'] = generate_help_from_object('worldedit', data)
            return cfg
        except Exception:
            cfg = {
                "maxSelectionBlocks": 100000,
                "saveHistory": True,
                "maxUndo": 10,
                "autoSave": False,
                "maxBlocksChanged": -1,
                "maxRadius": -1,
                "maxBrushRadius": 5,
                "maxPolygonalPoints": -1,
                "logCommands": False,
                "logFile": 'worldedit.log',
                "wandItem": 'minecraft:wooden_axe',
                "navigationWandItem": 'minecraft:compass',
                "navigationWandMaxDistance": 100,
                "debug": False,
                "serverSideCui": True,
                "commandBlockSupport": False,
                "historySize": 15,
                "historyExpiration": 10,
                "calculationTimeout": 100,
                "allowSymbolicLinks": False,
                "snapshotsDir": '',
                "savingDir": ''
            }
            cfg['help'] = generate_help_from_object('worldedit', {})
            return cfg

    def save_visual_config(self, config):
        try:
            content = self.read_config_file("config.yml")
            data = yaml.safe_load(content)
            data['max-selection-blocks'] = config.get('maxSelectionBlocks', 100000)
            data['save-history'] = config.get('saveHistory', True)
            data['max-undo'] = config.get('maxUndo', 10)
            data['auto-save'] = config.get('autoSave', False)
            # Limits
            if 'limits' not in data:
                data['limits'] = {}
            data['limits'].setdefault('max-blocks-changed', {})
            data['limits']['max-blocks-changed']['default'] = config.get('maxBlocksChanged', data['limits']['max-blocks-changed'].get('default', -1))
            data['limits']['max-radius'] = config.get('maxRadius', data.get('limits', {}).get('max-radius', -1))
            data['limits'].setdefault('max-brush-radius', {})
            data['limits']['max-brush-radius'] = config.get('maxBrushRadius', data.get('limits', {}).get('max-brush-radius', 5))
            data['limits'].setdefault('max-polygonal-points', {})
            if isinstance(data['limits'].get('max-polygonal-points'), dict):
                data['limits']['max-polygonal-points']['default'] = config.get('maxPolygonalPoints', data['limits']['max-polygonal-points'].get('default', -1))
            # Logging
            data.setdefault('logging', {})
            data['logging']['log-commands'] = config.get('logCommands', data['logging'].get('log-commands', False))
            data['logging']['file'] = config.get('logFile', data['logging'].get('file', 'worldedit.log'))
            # Wand / tools
            data['wand-item'] = config.get('wandItem', data.get('wand-item', 'minecraft:wooden_axe'))
            data.setdefault('navigation-wand', {})
            data['navigation-wand']['item'] = config.get('navigationWandItem', data.get('navigation-wand', {}).get('item', 'minecraft:compass'))
            data['navigation-wand']['max-distance'] = config.get('navigationWandMaxDistance', data.get('navigation-wand', {}).get('max-distance', 100))
            # Misc
            data['debug'] = config.get('debug', data.get('debug', False))
            data['server-side-cui'] = config.get('serverSideCui', data.get('server-side-cui', True))
            data['command-block-support'] = config.get('commandBlockSupport', data.get('command-block-support', False))
            data.setdefault('history', {})
            data['history']['size'] = config.get('historySize', data['history'].get('size', 15))
            data['history']['expiration'] = config.get('historyExpiration', data['history'].get('expiration', 10))
            data.setdefault('calculation', {})
            data['calculation']['timeout'] = config.get('calculationTimeout', data.get('calculation', {}).get('timeout', 100))
            data.setdefault('files', {})
            data['files']['allow-symbolic-links'] = config.get('allowSymbolicLinks', data.get('files', {}).get('allow-symbolic-links', False))
            data.setdefault('snapshots', {})
            data['snapshots']['directory'] = config.get('snapshotsDir', data.get('snapshots', {}).get('directory', ''))
            data.setdefault('saving', {})
            data['saving']['dir'] = config.get('savingDir', data.get('saving', {}).get('dir', ''))
            self.write_config_file("config.yml", yaml.safe_dump(data, allow_unicode=True))
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

worldedit_service = WorldEditService()
