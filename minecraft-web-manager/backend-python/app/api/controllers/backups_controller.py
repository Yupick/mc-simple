from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.services.backup_service import BackupService
from app.models.backup_history import BackupHistory
from app.models.audit_log import AuditLog


class BackupsController:
    def __init__(self):
        self.backup_service = BackupService()
    
    async def get_all(self, db: Session):
        """Listar todos los backups"""
        try:
            backups = db.query(BackupHistory).order_by(
                BackupHistory.created_at.desc()
            ).all()
            
            return {
                "backups": [
                    {
                        "id": b.id,
                        "filename": b.filename,
                        "type": b.type,
                        "size_bytes": b.size_bytes,
                        "size_mb": round(b.size_bytes / (1024 * 1024), 2),
                        "path": b.path,
                        "created_at": b.created_at,
                        "created_by": b.created_by,
                        "status": b.status,
                        "description": b.description
                    }
                    for b in backups
                ],
                "count": len(backups)
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al listar backups: {str(e)}"
            )
    
    async def create(
        self,
        backup_type: str,
        description: str,
        user_id: int,
        db: Session
    ):
        """Crear nuevo backup"""
        try:
            # Validar tipo
            valid_types = ["full", "world", "plugins", "config"]
            if backup_type not in valid_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tipo inválido. Debe ser uno de: {', '.join(valid_types)}"
                )
            
            # Crear registro en DB (pendiente)
            backup_record = BackupHistory(
                type=backup_type,
                created_by=user_id,
                status="pending",
                description=description
            )
            db.add(backup_record)
            db.commit()
            db.refresh(backup_record)
            
            try:
                # Ejecutar backup
                result = await self.backup_service.create_backup(backup_type)
                
                # Actualizar registro
                backup_record.status = "completed"
                backup_record.filename = result.get("filename", "")
                backup_record.path = result.get("path", "")
                backup_record.size_bytes = result.get("size_bytes", 0)
                db.commit()
                
                # Audit log
                audit = AuditLog(
                    user_id=user_id,
                    action="create_backup",
                    resource_type="backup",
                    resource_id=str(backup_record.id),
                    details={"type": backup_type, "filename": backup_record.filename}
                )
                db.add(audit)
                db.commit()
                
                return {
                    "message": "Backup creado correctamente",
                    "backup": {
                        "id": backup_record.id,
                        "filename": backup_record.filename,
                        "type": backup_record.type,
                        "size_mb": round(backup_record.size_bytes / (1024 * 1024), 2)
                    }
                }
            
            except Exception as e:
                # Actualizar estado a error
                backup_record.status = "error"
                backup_record.error_message = str(e)
                db.commit()
                raise
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear backup: {str(e)}"
            )
    
    async def delete(
        self,
        backup_id: int,
        user_id: int,
        db: Session
    ):
        """Eliminar backup"""
        try:
            # Obtener registro
            backup = db.query(BackupHistory).filter(
                BackupHistory.id == backup_id
            ).first()
            
            if not backup:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Backup no encontrado"
                )
            
            # Eliminar archivo físico
            await self.backup_service.delete_backup(backup.path)
            
            # Eliminar registro
            db.delete(backup)
            db.commit()
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action="delete_backup",
                resource_type="backup",
                resource_id=str(backup_id),
                details={"filename": backup.filename}
            )
            db.add(audit)
            db.commit()
            
            return {"message": "Backup eliminado correctamente"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar backup: {str(e)}"
            )
