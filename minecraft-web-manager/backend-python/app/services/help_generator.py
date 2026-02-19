from typing import Any, Dict


def _flatten(prefix: str, obj: Any, out: Dict[str, Any]):
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else k
            _flatten(key, v, out)
    else:
        out[prefix] = obj


def generate_help_from_object(name_prefix: str, obj: Any) -> Dict[str, str]:
    """Flatten obj and generate simple help strings for each key."""
    flat: Dict[str, Any] = {}
    _flatten('', obj or {}, flat)
    help_map: Dict[str, str] = {}
    for k, v in flat.items():
        key = f"{name_prefix}.{k}" if name_prefix else k
        # heuristics
        last = k.split('.')[-1]
        if isinstance(v, bool):
            help_map[key] = f"Activa o desactiva '{last}'. Valor actual: {v}."
        elif isinstance(v, (int, float)):
            help_map[key] = f"Número para '{last}'. Valor actual: {v}."
        elif isinstance(v, str):
            if v.endswith('%'):
                help_map[key] = f"Porcentaje para '{last}' (ej: {v})."
            else:
                help_map[key] = f"Texto para '{last}'. Valor actual: {v}."
        elif isinstance(v, list):
            help_map[key] = f"Lista para '{last}'. {len(v)} elemento(s)."
        elif v is None:
            help_map[key] = f"Campo '{last}' sin valor actualmente."
        else:
            help_map[key] = f"Configuración '{last}'."
    return help_map
