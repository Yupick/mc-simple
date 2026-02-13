"""Servicio para gestión de operadores (OPs) del servidor"""
import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from app.core.config import settings
from app.services.rcon_service import rcon_service


class OpService:
    """Servicio para gestionar operadores del servidor Minecraft"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.ops_file = self.server_path / "ops.json"
        self.properties_file = self.server_path / "server.properties"
    
    async def get_operators(self) -> List[Dict]:
        """
        Obtener lista de operadores desde ops.json
        
        Returns:
            Lista de operadores con uuid, name, level, bypassesPlayerLimit
        """
        try:
            if not self.ops_file.exists():
                return []
            
            with open(self.ops_file, 'r') as f:
                ops = json.load(f)
            
            return ops
        except Exception:
            return []
    
    async def add_operator(
        self, 
        username: str, 
        uuid: str, 
        level: int = 4, 
        bypass_limit: bool = False
    ) -> bool:
        """
        Agregar un operador al servidor
        
        Args:
            username: Nombre del jugador
            uuid: UUID del jugador
            level: Nivel de OP (1-4)
            bypass_limit: Si puede bypassear el límite de jugadores
            
        Returns:
            True si fue exitoso
        """
        try:
            ops = await self.get_operators()
            
            # Verificar si ya es OP
            existing = next((op for op in ops if op.get('uuid') == uuid), None)
            if existing:
                # Actualizar nivel
                existing['level'] = level
                existing['bypassesPlayerLimit'] = bypass_limit
            else:
                # Agregar nuevo OP
                ops.append({
                    "uuid": uuid,
                    "name": username,
                    "level": level,
                    "bypassesPlayerLimit": bypass_limit
                })
            
            # Guardar archivo
            with open(self.ops_file, 'w') as f:
                json.dump(ops, f, indent=2)
            
            # Ejecutar comando RCON para aplicar cambios
            await rcon_service.op_player(username)
            
            return True
        except Exception:
            return False
    
    async def remove_operator(self, uuid: str) -> bool:
        """
        Remover un operador del servidor
        
        Args:
            uuid: UUID del jugador
            
        Returns:
            True si fue exitoso
        """
        try:
            ops = await self.get_operators()
            
            # Buscar y remover
            op_to_remove = next((op for op in ops if op.get('uuid') == uuid), None)
            if not op_to_remove:
                return False
            
            ops = [op for op in ops if op.get('uuid') != uuid]
            
            # Guardar archivo
            with open(self.ops_file, 'w') as f:
                json.dump(ops, f, indent=2)
            
            # Ejecutar comando RCON
            await rcon_service.deop_player(op_to_remove.get('name'))
            
            return True
        except Exception:
            return False
    
    async def change_op_level(self, uuid: str, new_level: int) -> bool:
        """
        Cambiar el nivel de OP de un operador
        
        Args:
            uuid: UUID del jugador
            new_level: Nuevo nivel (1-4)
            
        Returns:
            True si fue exitoso
        """
        try:
            if new_level < 1 or new_level > 4:
                return False
            
            ops = await self.get_operators()
            
            # Buscar operador
            operator = next((op for op in ops if op.get('uuid') == uuid), None)
            if not operator:
                return False
            
            # Actualizar nivel
            operator['level'] = new_level
            
            # Guardar archivo
            with open(self.ops_file, 'w') as f:
                json.dump(ops, f, indent=2)
            
            return True
        except Exception:
            return False
    
    async def get_op_config(self) -> Dict:
        """
        Obtener configuración de OPs desde server.properties
        
        Returns:
            Dict con op-permission-level, function-permission-level
        """
        try:
            config = {
                "op-permission-level": 4,
                "function-permission-level": 2
            }
            
            if self.properties_file.exists():
                with open(self.properties_file, 'r') as f:
                    for line in f:
                        if line.startswith('op-permission-level='):
                            config['op-permission-level'] = int(line.split('=')[1].strip())
                        elif line.startswith('function-permission-level='):
                            config['function-permission-level'] = int(line.split('=')[1].strip())
            
            return config
        except Exception:
            return {"op-permission-level": 4, "function-permission-level": 2}
    
    async def update_op_config(
        self, 
        op_permission_level: Optional[int] = None,
        function_permission_level: Optional[int] = None
    ) -> bool:
        """
        Actualizar configuración de OPs en server.properties
        
        Args:
            op_permission_level: Nivel de permiso por defecto para OPs (1-4)
            function_permission_level: Nivel requerido para usar functions (1-4)
            
        Returns:
            True si fue exitoso
        """
        try:
            if not self.properties_file.exists():
                return False
            
            # Leer archivo
            with open(self.properties_file, 'r') as f:
                lines = f.readlines()
            
            # Actualizar líneas
            with open(self.properties_file, 'w') as f:
                for line in lines:
                    if op_permission_level is not None and line.startswith('op-permission-level='):
                        f.write(f'op-permission-level={op_permission_level}\n')
                    elif function_permission_level is not None and line.startswith('function-permission-level='):
                        f.write(f'function-permission-level={function_permission_level}\n')
                    else:
                        f.write(line)
            
            return True
        except Exception:
            return False
    
    async def get_op_by_uuid(self, uuid: str) -> Optional[Dict]:
        """
        Obtener un operador por UUID
        
        Args:
            uuid: UUID del jugador
            
        Returns:
            Datos del operador o None
        """
        ops = await self.get_operators()
        return next((op for op in ops if op.get('uuid') == uuid), None)


# Instancia singleton
op_service = OpService()
