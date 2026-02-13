from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.plugin_service import PluginService
from app.models.audit_log import AuditLog


class PluginsController:
    def __init__(self):
        self.plugin_service = PluginService()
    
    async def get_all(self):
        """Listar todos los plugins"""
        try:
            plugins = await self.plugin_service.list_plugins()
            return {"plugins": plugins, "count": len(plugins)}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al listar plugins: {str(e)}"
            )
    
    async def toggle(
        self,
        plugin_name: str,
        user_id: int,
        db: Session
    ):
        """Enable/Disable plugin (renombrar .jar)"""
        try:
            result = await self.plugin_service.toggle_plugin(plugin_name)
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="toggle_plugin",
                resource_type="plugin",
                resource_id=plugin_name,
                details=result
            )
            db.add(audit)
            db.commit()
            
            return {
                "message": f"Plugin {'habilitado' if result['enabled'] else 'deshabilitado'} correctamente",
                "plugin": result
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al cambiar estado del plugin: {str(e)}"
            )
    
    async def delete(
        self,
        plugin_name: str,
        user_id: int,
        db: Session
    ):
        """Eliminar plugin"""
        try:
            await self.plugin_service.delete_plugin(plugin_name)
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="delete_plugin",
                resource_type="plugin",
                resource_id=plugin_name
            )
            db.add(audit)
            db.commit()
            
            return {"message": f"Plugin '{plugin_name}' eliminado correctamente"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar plugin: {str(e)}"
            )
    
    async def get_config(self, plugin_name: str):
        """Obtener archivos de configuración del plugin"""
        try:
            config = await self.plugin_service.get_plugin_config(plugin_name)
            return {"config": config}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener configuración: {str(e)}"
            )
