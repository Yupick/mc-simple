from typing import Dict, Any
import yaml
from app.services.mmorpg_service import mmorpg_service


def _read_yaml_file(rel_path: str) -> Dict[str, Any]:
    try:
        content = mmorpg_service.read_config_file('mythicmobs', rel_path)
        if not content:
            return {}
        return yaml.safe_load(content) or {}
    except Exception:
        return {}


def _flatten_dict(prefix: str, obj: Any, out: Dict[str, Any]):
    """Flattens nested dict into out with dot-separated keys."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else k
            _flatten_dict(key, v, out)
    else:
        out[prefix] = obj


def _generate_help_for_value(key: str, value: Any) -> str:
    """Generate a short help description for a key/value pair."""
    # Basic heuristics based on type and name
    name = key.split('.')[-1]
    if isinstance(value, bool):
        return f"Activa o desactiva '{name}'. Valor actual: {value}."
    if isinstance(value, (int, float)):
        return f"Número para '{name}'. Valor actual: {value}."
    if isinstance(value, str):
        # if looks like percent
        if value.endswith('%'):
            return f"Porcentaje para '{name}' (ej: {value})."
        return f"Texto para '{name}'. Valor actual: {value}."
    if isinstance(value, list):
        return f"Lista de valores para '{name}'. {len(value)} elemento(s) actualmente."
    if value is None:
        return f"Campo '{name}' sin valor actualmente."
    return f"Configuración '{name}'."


def _parse_drop_line(line: str) -> Dict[str, Any]:
    """Parse a single drop line like 'KingsCrown 1 0.01' or 'GOLD_NUGGET 32-64 1'."""
    parts = str(line).strip().split()
    if len(parts) == 0:
        return {}
    item = parts[0]
    amount = None
    chance = None
    if len(parts) == 1:
        return {"item": item}
    if len(parts) == 2:
        second = parts[1]
        if '.' in second:
            chance = float(second)
        else:
            amount = second
        return {"item": item, "amount": amount, "chance": chance}
    # len >=3
    amount = parts[1]
    try:
        chance = float(parts[2])
    except Exception:
        chance = parts[2]
    return {"item": item, "amount": amount, "chance": chance}


class MythicMobsService:
    def __init__(self):
        self.plugin_id = 'mythicmobs'

    def get_visual_config(self) -> Dict[str, Any]:
        """Read several MythicMobs files and produce a combined visual config plus a help map."""
        cfg: Dict[str, Any] = {}

        # Read structured config files (include all files under config/)
        cfg_files = {}
        try:
            files = mmorpg_service.list_config_files('mythicmobs')
            for f in files:
                p = f.get('path', '')
                if p.startswith('config/') and (p.endswith('.yml') or p.endswith('.yaml')):
                    raw = mmorpg_service.read_config_file('mythicmobs', p)
                    try:
                        parsed = yaml.safe_load(raw) or {}
                    except Exception:
                        parsed = {}
                    key = p.split('/')[-1].rsplit('.', 1)[0]  # filename without ext
                    cfg_files[key] = parsed.get('Configuration', parsed) if isinstance(parsed, dict) else parsed
        except Exception:
            pass

        # Map some common config files to top-level keys for backwards compatibility
        cfg['general'] = cfg_files.get('config-general', cfg_files.get('general', {}))
        cfg['mobs'] = cfg_files.get('config-mobs', cfg_files.get('mobs', {}))
        cfg['skills'] = cfg_files.get('config-skills', cfg_files.get('skills', {}))
        cfg['spawning'] = cfg_files.get('config-spawning', cfg_files.get('spawning', {}))
        cfg['items_config'] = cfg_files.get('config-items', cfg_files.get('items', {}))

        stats = _read_yaml_file('stats.yml')
        cfg['stats'] = stats or {}

        # Build help map by flattening relevant parts
        help_map: Dict[str, str] = {}

        # general
        flat = {}
        _flatten_dict('', cfg.get('general', {}), flat)
        for k, v in flat.items():
            key = f"general.{k}" if k else k
            help_map[key] = _generate_help_for_value(key, v)

        # include other config files help (config-items etc.)
        for fname, fobj in cfg_files.items():
            flat = {}
            _flatten_dict('', fobj, flat)
            for k, v in flat.items():
                help_key = f"{fname}.{k}"
                if help_key not in help_map:
                    help_map[help_key] = _generate_help_for_value(help_key, v)

        # mobs -> focus on MobDrops and MobEggs
        mobs_cfg = cfg.get('mobs', {}).get('MobDrops', {})
        flat = {}
        _flatten_dict('', mobs_cfg, flat)
        for k, v in flat.items():
            key = f"mobs.MobDrops.{k}"
            help_map[key] = _generate_help_for_value(key, v)

        eggs_cfg = cfg.get('mobs', {}).get('MobEggs', {})
        flat = {}
        _flatten_dict('', eggs_cfg, flat)
        for k, v in flat.items():
            key = f"mobs.MobEggs.{k}"
            help_map[key] = _generate_help_for_value(key, v)

        # spawning
        spawn_cfg = cfg.get('spawning', {}).get('RandomSpawning', {})
        flat = {}
        _flatten_dict('', spawn_cfg, flat)
        for k, v in flat.items():
            key = f"spawning.RandomSpawning.{k}"
            help_map[key] = _generate_help_for_value(key, v)

        # Spawners top-level
        spawners_cfg = cfg.get('spawning', {}).get('Spawners', {}) if isinstance(cfg.get('spawning', {}), dict) else {}
        flat = {}
        _flatten_dict('', spawners_cfg, flat)
        for k, v in flat.items():
            key = f"spawning.Spawners.{k}"
            help_map[key] = _generate_help_for_value(key, v)

        # skills targeter filters
        filters = cfg.get('skills', {}).get('Targeters', {}).get('DefaultEntityFilters', {})
        for k, v in (filters or {}).items():
            key = f"skills.{k}"
            # humanize key name
            help_map[key] = f"Filtro de targeter '{k}'. Activa para que el targeter considere este tipo de entidad. Valor actual: {v}."

        # stats: for each stat, capture Display and BaseValue
        for stat_name, stat_obj in (cfg.get('stats') or {}).items():
            if isinstance(stat_obj, dict):
                display = stat_obj.get('Display')
                base = stat_obj.get('BaseValue')
                enabled = stat_obj.get('Enabled')
                parts = []
                if display:
                    parts.append(f"Nombre mostrado: {display}.")
                if base is not None:
                    parts.append(f"Valor base: {base}.")
                if enabled is not None:
                    parts.append(f"Activado: {enabled}.")
                desc = ' '.join(parts) if parts else 'Estadística configurable.'
                help_map[f"stats.{stat_name}"] = desc

        # Provide some generic fallbacks
        help_map.setdefault('general.Language', "Idioma usado por MythicMobs para mensajes internos.")
        help_map.setdefault('general.ThreadPoolSize', "Tamaño del pool de hilos; -1 = automático.")

        # attach help map
        cfg['help'] = help_map

        # Parse items/ and droptables/ into friendly lists for the UI
        items_list: Dict[str, Dict] = {}
        droptables_list: Dict[str, Dict] = {}

        try:
            files = mmorpg_service.list_config_files('mythicmobs')
            for f in files:
                p = f.get('path', '')
                if p.startswith('items/') or p.startswith('droptables/'):
                    raw = mmorpg_service.read_config_file('mythicmobs', p)
                    try:
                        parsed = yaml.safe_load(raw) or {}
                    except Exception:
                        parsed = {}
                    if not isinstance(parsed, dict):
                        continue
                    for key, val in parsed.items():
                        entry = {
                            'name': key,
                            'path': p,
                            'raw': yaml.safe_dump({key: val}, sort_keys=False, allow_unicode=True),
                            'obj': val
                        }
                        if p.startswith('items/'):
                            items_list[key] = entry
                        else:
                            # droptables entries: attempt to parse Drops into structured array
                            if isinstance(val, dict):
                                drops = val.get('Drops') or []
                                parsed_drops = []
                                for d in drops:
                                    parsed_drops.append(_parse_drop_line(d))
                                entry['parsed_drops'] = parsed_drops
                            droptables_list[key] = entry
        except Exception:
            pass

        cfg['items'] = items_list
        cfg['droptables'] = droptables_list
        return cfg

    def save_visual_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # General
            if 'general' in config:
                base = _read_yaml_file('config/config-general.yml') or {'Configuration': {'General': {}}}
                base.setdefault('Configuration', {})
                base['Configuration']['General'] = config['general']
                mmorpg_service.write_config_file('mythicmobs', 'config/config-general.yml', yaml.safe_dump(base, sort_keys=False, allow_unicode=True))

            if 'mobs' in config:
                base = _read_yaml_file('config/config-mobs.yml') or {'Configuration': {}}
                base['Configuration'] = config['mobs']
                mmorpg_service.write_config_file('mythicmobs', 'config/config-mobs.yml', yaml.safe_dump(base, sort_keys=False, allow_unicode=True))

            if 'spawning' in config:
                base = _read_yaml_file('config/config-spawning.yml') or {'Configuration': {}}
                base['Configuration'] = config['spawning']
                mmorpg_service.write_config_file('mythicmobs', 'config/config-spawning.yml', yaml.safe_dump(base, sort_keys=False, allow_unicode=True))

            if 'skills' in config:
                base = _read_yaml_file('config/config-skills.yml') or {'Configuration': {}}
                base['Configuration'] = config['skills']
                mmorpg_service.write_config_file('mythicmobs', 'config/config-skills.yml', yaml.safe_dump(base, sort_keys=False, allow_unicode=True))

            if 'stats' in config:
                # overwrite stats.yml entirely
                mmorpg_service.write_config_file('mythicmobs', 'stats.yml', yaml.safe_dump(config['stats'], sort_keys=False, allow_unicode=True))

            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}


mythicmobs_service = MythicMobsService()
