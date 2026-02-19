from pathlib import Path
from typing import Dict, Any
import yaml

from app.core.config import settings


class EssentialsService:
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.plugin_folder = self.server_path / 'plugins' / 'Essentials'

    def _read_raw(self, filename: str) -> str:
        path = (self.plugin_folder / filename)
        if not path.exists():
            return ""
        return path.read_text(encoding='utf-8', errors='ignore')

    def get_visual_config(self) -> Dict[str, Any]:
        """Genera una representación visual básica para config.yml y kits.yml"""
        result = {"tabs": []}

        # Config.yml - top-level keys
        raw = self._read_raw('config.yml')
        try:
            parsed = yaml.safe_load(raw) or {}
        except Exception:
            parsed = {}

        # Extract simple top-level comments: map key -> preceding comment block
        helps = {}
        last_comments = []
        for line in raw.splitlines():
            s = line.strip()
            if s.startswith('#'):
                last_comments.append(s.lstrip('# ').rstrip())
                continue
            if ':' in line and not line.startswith(' '):
                key = line.split(':', 1)[0].strip()
                if last_comments:
                    helps[key] = '\n'.join(last_comments)
                last_comments = []
            else:
                last_comments = []

        fields = []
        for k, v in parsed.items():
            ftype = 'string'
            if isinstance(v, bool):
                ftype = 'boolean'
            elif isinstance(v, int) or isinstance(v, float):
                ftype = 'number'
            elif isinstance(v, dict) or isinstance(v, list):
                ftype = 'json'

            fields.append({
                "key": k,
                "value": v,
                "type": ftype,
                "help": helps.get(k, '')
            })

        result['tabs'].append({
            "id": "config",
            "title": "General",
            "file": "config.yml",
            "fields": fields
        })

        # Kits - parse kits.yml into list
        kits_raw = self._read_raw('kits.yml')
        try:
            kits_parsed = yaml.safe_load(kits_raw) or {}
        except Exception:
            kits_parsed = {}

        kits_list = []
        for kit_name, kit_data in (kits_parsed.get('kits') or {}).items():
            kits_list.append({
                "name": kit_name,
                "delay": kit_data.get('delay'),
                "items": kit_data.get('items', [])
            })

        result['tabs'].append({
            "id": "kits",
            "title": "Kits",
            "file": "kits.yml",
            "kits": kits_list
        })

        # Raw editor tab
        result['tabs'].append({
            "id": "raw",
            "title": "Editor RAW",
            "files": ['config.yml', 'kits.yml', 'worth.yml', 'custom_items.yml']
        })

        return result

    def save_visual_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Guardar cambios desde el formulario visual. Actualmente solo soporta cambios top-level en config.yml"""
        tab = config.get('tab')
        if tab == 'config':
            fields = config.get('fields', [])
            # Load existing YAML
            cfg_path = self.plugin_folder / 'config.yml'
            raw = self._read_raw('config.yml')
            try:
                parsed = yaml.safe_load(raw) or {}
            except Exception:
                parsed = {}

            for f in fields:
                key = f.get('key')
                value = f.get('value')
                parsed[key] = value

            # Dump back
            with open(cfg_path, 'w', encoding='utf-8') as fh:
                yaml.safe_dump(parsed, fh, sort_keys=False)

            return {"success": True, "message": "config.yml guardado"}

        return {"success": False, "error": "Tab no soportada para guardado"}


essentials_service = EssentialsService()
