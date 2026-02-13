"""Servicio para información del sistema"""
import psutil
import platform
from typing import Dict, Any


class SystemService:
    """Servicio para información del sistema"""
    
    async def get_system_info(self) -> Dict[str, Any]:
        """
        Obtener información del sistema
        
        Returns:
            Dict con CPU, RAM, disco, OS
        """
        # Memoria
        mem = psutil.virtual_memory()
        
        # Disco
        disk = psutil.disk_usage("/")
        
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        
        return {
            "memory": {
                "total": mem.total,
                "available": mem.available,
                "used": mem.used,
                "percent": mem.percent
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            },
            "cpu": {
                "percent": cpu_percent,
                "count": psutil.cpu_count()
            },
            "os": {
                "system": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine()
            }
        }


# Instancia global
system_service = SystemService()
