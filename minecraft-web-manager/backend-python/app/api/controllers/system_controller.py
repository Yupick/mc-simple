from fastapi import HTTPException, status

from app.services.system_service import SystemService


class SystemController:
    def __init__(self):
        self.system_service = SystemService()
    
    async def get_info(self):
        """Obtener información del sistema"""
        try:
            info = await self.system_service.get_system_info()
            return info
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener información del sistema: {str(e)}"
            )
    
    async def health_check(self):
        """Health check del sistema"""
        return {
            "status": "ok",
            "service": "minecraft-web-manager",
            "version": "2.0.0"
        }
