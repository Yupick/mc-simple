from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.plugin_service import PluginService
from app.services.recommended_plugins_service import recommended_plugins_service
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
    
    async def get_recommended(self):
        """Obtener lista de plugins recomendados con estado de instalación"""
        try:
            plugins = recommended_plugins_service.get_recommended_plugins()
            return {"plugins": plugins, "count": len(plugins)}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener plugins recomendados: {str(e)}"
            )
    
    async def install_recommended(
        self,
        plugin_id: str,
        user_id: int,
        db: Session
    ):
        """Instalar plugin recomendado desde Modrinth"""
        try:
            result = await recommended_plugins_service.install_plugin(plugin_id)
            
            if not result["success"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result["error"]
                )
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="install_recommended_plugin",
                resource_type="plugin",
                resource_id=plugin_id,
                details=result
            )
            db.add(audit)
            db.commit()
            
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al instalar plugin: {str(e)}"
            )
    
    async def uninstall_recommended(
        self,
        plugin_id: str,
        user_id: int,
        db: Session
    ):
        """Desinstalar plugin recomendado"""
        try:
            result = await recommended_plugins_service.uninstall_plugin(plugin_id)
            
            if not result["success"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result["error"]
                )
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="uninstall_recommended_plugin",
                resource_type="plugin",
                resource_id=plugin_id,
                details=result
            )
            db.add(audit)
            db.commit()
            
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al desinstalar plugin: {str(e)}"
            )

