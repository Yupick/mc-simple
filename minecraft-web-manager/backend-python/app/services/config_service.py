"""Servicio para leer/escribir archivos de configuración"""
import json
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from app.core.config import settings


class ConfigService:
    """Servicio para gestión de archivos de configuración"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
    
    def read_properties(self, file_path: Path) -> Dict[str, str]:
        """
        Leer archivo .properties
        
        Args:
            file_path: Ruta al archivo
        
        Returns:
            Dict con propiedades
        """
        properties = {}
        
        try:
            if file_path.exists():
                for line in file_path.read_text().split("\n"):
                    line = line.strip()
                    if line and not line.startswith("#"):
                        if "=" in line:
                            key, value = line.split("=", 1)
                            properties[key.strip()] = value.strip()
        except Exception:
            pass
        
        return properties
    
    def write_properties(self, file_path: Path, properties: Dict[str, str]) -> bool:
        """
        Escribir archivo .properties
        
        Args:
            file_path: Ruta al archivo
            properties: Dict de propiedades
        
        Returns:
            True si éxito
        """
        try:
            lines = []
            for key, value in properties.items():
                lines.append(f"{key}={value}")
            
            file_path.write_text("\n".join(lines) + "\n")
            return True
        except Exception:
            return False
    
    def read_json(self, file_path: Path) -> Optional[Any]:
        """Leer archivo JSON"""
        try:
            if file_path.exists():
                return json.loads(file_path.read_text())
        except Exception:
            pass
        return None
    
    def write_json(self, file_path: Path, data: Any) -> bool:
        """Escribir archivo JSON"""
        try:
            file_path.write_text(json.dumps(data, indent=2))
            return True
        except Exception:
            return False
    
    def read_yaml(self, file_path: Path) -> Optional[Dict]:
        """Leer archivo YAML"""
        try:
            if file_path.exists():
                return yaml.safe_load(file_path.read_text())
        except Exception:
            pass
        return None
    
    def write_yaml(self, file_path: Path, data: Dict) -> bool:
        """Escribir archivo YAML"""
        try:
            file_path.write_text(yaml.dump(data, default_flow_style=False))
            return True
        except Exception:
            return False
    
    async def get_server_properties(self) -> Dict[str, str]:
        """Obtener server.properties global"""
        return self.read_properties(self.server_path / "server.properties")
    
    async def update_server_properties(self, properties: Dict[str, str]) -> Dict[str, Any]:
        """Actualizar server.properties global"""
        success = self.write_properties(
            self.server_path / "server.properties",
            properties
        )
        return {
            "success": success,
            "message": "Propiedades actualizadas" if success else "Error al actualizar"
        }
    
    async def get_whitelist(self) -> list:
        """Obtener whitelist.json"""
        return self.read_json(self.server_path / "whitelist.json") or []
    
    async def update_whitelist(self, whitelist: list) -> Dict[str, Any]:
        """Actualizar whitelist.json"""
        success = self.write_json(
            self.server_path / "whitelist.json",
            whitelist
        )
        return {
            "success": success,
            "message": "Whitelist actualizada" if success else "Error al actualizar"
        }
    
    async def get_ops(self) -> list:
        """Obtener ops.json"""
        return self.read_json(self.server_path / "ops.json") or []
    
    async def update_ops(self, ops: list) -> Dict[str, Any]:
        """Actualizar ops.json"""
        success = self.write_json(
            self.server_path / "ops.json",
            ops
        )
        return {
            "success": success,
            "message": "Ops actualizado" if success else "Error al actualizar"
        }


# Instancia global
config_service = ConfigService()
