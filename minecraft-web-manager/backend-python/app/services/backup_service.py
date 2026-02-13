"""Servicio para sistema de backups"""
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
from app.core.config import settings
from app.services.bash_service import bash_service


class BackupService:
    """Servicio para sistema de backups"""
    
    def __init__(self):
        self.backup_path = Path(settings.BACKUP_PATH)
        self.scripts_path = Path(settings.SERVER_PATH).parent
    
    async def list_backups(self) -> List[Dict[str, Any]]:
        """
        Listar backups disponibles
        
        Returns:
            Lista de backups con info
        """
        backups = []
        
        if not self.backup_path.exists():
            return backups
        
        for file in self.backup_path.iterdir():
            if file.is_file() and file.suffix == ".gz":
                backups.append({
                    "filename": file.name,
                    "path": str(file),
                    "size_mb": file.stat().st_size / (1024 * 1024),
                    "created_at": datetime.fromtimestamp(file.stat().st_mtime).isoformat()
                })
        
        # Ordenar por fecha (más recientes primero)
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        
        return backups
    
    async def create_backup(self, backup_type: str, description: str = "") -> Dict[str, Any]:
        """
        Crear backup
        
        Args:
            backup_type: full, world, plugins, config
            description: Descripción del backup
        
        Returns:
            Dict con success, filename, path
        """
        if backup_type not in ["full", "world", "plugins", "config"]:
            return {"success": False, "message": "Tipo de backup inválido"}
        
        try:
            backup_script = self.scripts_path / "backup.sh"
            result = await bash_service.execute_script(
                "backup.sh",
                [backup_type]
            )
            
            if result["success"]:
                # Obtener nombre del archivo del stdout
                filename = None
                for line in result["stdout"].split("\n"):
                    if ".tar.gz" in line:
                        filename = line.split()[-1]
                        break
                
                return {
                    "success": True,
                    "message": "Backup creado exitosamente",
                    "filename": filename,
                    "type": backup_type
                }
            else:
                return {
                    "success": False,
                    "message": result["stderr"]
                }
                
        except Exception as e:
            return {"success": False, "message": f"Error al crear backup: {str(e)}"}
    
    async def delete_backup(self, filename: str) -> Dict[str, Any]:
        """
        Eliminar backup
        
        Args:
            filename: Nombre del archivo
        
        Returns:
            Dict con success y mensaje
        """
        backup_file = self.backup_path / filename
        
        try:
            if backup_file.exists():
                backup_file.unlink()
                return {
                    "success": True,
                    "message": f"Backup '{filename}' eliminado"
                }
            else:
                return {"success": False, "message": "Backup no encontrado"}
                
        except Exception as e:
            return {"success": False, "message": f"Error: {str(e)}"}


# Instancia global
backup_service = BackupService()
