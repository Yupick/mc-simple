from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.services.config_service import ConfigService
from app.models.audit_log import AuditLog


class ConfigController:
    def __init__(self):
        self.config_service = ConfigService()
    
    async def get_server_properties(self):
        """Obtener server.properties"""
        try:
            properties = await self.config_service.get_server_properties()
            return {"properties": properties}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener server.properties: {str(e)}"
            )
    
    async def update_server_properties(
        self,
        properties: Dict[str, Any],
        user_id: int,
        db: Session
    ):
        """Actualizar server.properties"""
        try:
            await self.config_service.update_server_properties(properties)
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="update_server_properties",
                resource_type="config",
                resource_id="server.properties"
            )
            db.add(audit)
            db.commit()
            
            return {"message": "Server.properties actualizado correctamente"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar server.properties: {str(e)}"
            )
    
    async def get_whitelist(self):
        """Obtener whitelist"""
        try:
            whitelist = await self.config_service.get_whitelist()
            return {"whitelist": whitelist}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener whitelist: {str(e)}"
            )
    
    async def update_whitelist(
        self,
        whitelist: list,
        user_id: int,
        db: Session
    ):
        """Actualizar whitelist"""
        try:
            await self.config_service.update_whitelist(whitelist)
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="update_whitelist",
                resource_type="config",
                resource_id="whitelist.json"
            )
            db.add(audit)
            db.commit()
            
            return {"message": "Whitelist actualizada correctamente"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar whitelist: {str(e)}"
            )
    
    async def get_ops(self):
        """Obtener ops"""
        try:
            ops = await self.config_service.get_ops()
            return {"ops": ops}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener ops: {str(e)}"
            )
    
    async def update_ops(
        self,
        ops: list,
        user_id: int,
        db: Session
    ):
        """Actualizar ops"""
        try:
            await self.config_service.update_ops(ops)
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="update_ops",
                resource_type="config",
                resource_id="ops.json"
            )
            db.add(audit)
            db.commit()
            
            return {"message": "Ops actualizados correctamente"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar ops: {str(e)}"
            )
