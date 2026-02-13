from fastapi import HTTPException, status
from typing import Optional

from app.services.server_service import ServerService
from app.services.bash_service import BashService


class ServerController:
    def __init__(self):
        self.server_service = ServerService()
        self.bash_service = BashService()
    
    async def get_status(self):
        """Obtener estado actual del servidor"""
        try:
            status_data = await self.server_service.get_status()
            return status_data
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener estado: {str(e)}"
            )
    
    async def get_info(self):
        """Obtener información del servidor"""
        try:
            info = await self.server_service.get_info()
            return info
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener información: {str(e)}"
            )
    
    async def start(self):
        """Iniciar servidor"""
        try:
            # Verificar que no esté corriendo
            status_data = await self.server_service.get_status()
            if status_data.get("running"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El servidor ya está corriendo"
                )
            
            result = await self.server_service.start()
            return {"message": "Servidor iniciado correctamente", "result": result}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al iniciar servidor: {str(e)}"
            )
    
    async def stop(self):
        """Detener servidor"""
        try:
            # Verificar que esté corriendo
            status_data = await self.server_service.get_status()
            if not status_data.get("running"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El servidor no está corriendo"
                )
            
            result = await self.server_service.stop()
            return {"message": "Servidor detenido correctamente", "result": result}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al detener servidor: {str(e)}"
            )
    
    async def restart(self):
        """Reiniciar servidor"""
        try:
            result = await self.server_service.restart()
            return {"message": "Servidor reiniciado correctamente", "result": result}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al reiniciar servidor: {str(e)}"
            )
    
    async def get_logs(self, lines: int = 100):
        """Obtener logs del servidor"""
        try:
            logs = await self.server_service.get_logs(lines)
            return {"logs": logs, "lines": len(logs)}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener logs: {str(e)}"
            )
    
    async def send_command(self, command: str):
        """Enviar comando RCON al servidor"""
        try:
            # Verificar que el servidor esté corriendo
            status_data = await self.server_service.get_status()
            if not status_data.get("running"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El servidor no está corriendo"
                )
            
            result = await self.bash_service.rcon_command(command)
            return {
                "command": command,
                "output": result.get("stdout", ""),
                "success": result.get("success", False)
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al enviar comando: {str(e)}"
            )
