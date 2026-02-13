from fastapi import HTTPException, status
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.services.world_service import WorldService
from app.services.server_service import ServerService
from app.models.audit_log import AuditLog


class WorldsController:
    def __init__(self):
        self.world_service = WorldService()
        self.server_service = ServerService()
    
    async def get_all(self):
        """Listar todos los mundos"""
        try:
            worlds = await self.world_service.list_worlds()
            return {"worlds": worlds, "count": len(worlds)}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al listar mundos: {str(e)}"
            )
    
    async def get_active(self):
        """Obtener mundo activo"""
        try:
            active_world = await self.world_service.get_active_world()
            if not active_world:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No hay mundo activo"
                )
            return active_world
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener mundo activo: {str(e)}"
            )
    
    async def get_by_id(self, world_id: str):
        """Obtener mundo por ID"""
        try:
            world = await self.world_service.get_world(world_id)
            if not world:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Mundo '{world_id}' no encontrado"
                )
            return world
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener mundo: {str(e)}"
            )
    
    async def create(
        self,
        name: str,
        description: str,
        world_type: str,
        settings: Dict[str, Any],
        user_id: int,
        db: Session
    ):
        """Crear nuevo mundo"""
        try:
            world = await self.world_service.create_world(
                name=name,
                description=description,
                world_type=world_type,
                settings=settings
            )
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="create_world",
                resource_type="world",
                resource_id=world["id"],
                details={"name": name}
            )
            db.add(audit)
            db.commit()
            
            return {"message": "Mundo creado correctamente", "world": world}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear mundo: {str(e)}"
            )
    
    async def update(
        self,
        world_id: str,
        metadata: Dict[str, Any],
        user_id: int,
        db: Session
    ):
        """Actualizar metadata de mundo"""
        try:
            world = await self.world_service.update_world(world_id, metadata)
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="update_world",
                resource_type="world",
                resource_id=world_id,
                details=metadata
            )
            db.add(audit)
            db.commit()
            
            return {"message": "Mundo actualizado correctamente", "world": world}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar mundo: {str(e)}"
            )
    
    async def activate(
        self,
        world_id: str,
        user_id: int,
        db: Session
    ):
        """Activar mundo (cambiar symlink)"""
        try:
            # Verificar que el servidor esté detenido
            status_data = await self.server_service.get_status()
            if status_data.get("running"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Debes detener el servidor antes de cambiar de mundo"
                )
            
            result = await self.world_service.activate_world(world_id)
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="activate_world",
                resource_type="world",
                resource_id=world_id
            )
            db.add(audit)
            db.commit()
            
            return {"message": f"Mundo '{world_id}' activado correctamente", "result": result}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al activar mundo: {str(e)}"
            )
    
    async def delete(
        self,
        world_id: str,
        user_id: int,
        db: Session
    ):
        """Eliminar mundo"""
        try:
            # Verificar que no sea el mundo activo
            active = await self.world_service.get_active_world()
            if active and active.get("id") == world_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No puedes eliminar el mundo activo"
                )
            
            await self.world_service.delete_world(world_id)
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="delete_world",
                resource_type="world",
                resource_id=world_id
            )
            db.add(audit)
            db.commit()
            
            return {"message": f"Mundo '{world_id}' eliminado correctamente"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar mundo: {str(e)}"
            )
    
    async def get_properties(self, world_id: str):
        """Obtener server.properties del mundo"""
        try:
            properties = await self.world_service.get_world_properties(world_id)
            return {"properties": properties}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener properties: {str(e)}"
            )
    
    async def update_properties(
        self,
        world_id: str,
        properties: Dict[str, Any],
        user_id: int,
        db: Session
    ):
        """Actualizar server.properties del mundo"""
        try:
            await self.world_service.update_world_properties(world_id, properties)
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="update_world_properties",
                resource_type="world",
                resource_id=world_id
            )
            db.add(audit)
            db.commit()
            
            return {"message": "Properties actualizadas correctamente"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar properties: {str(e)}"
            )
