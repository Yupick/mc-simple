"""Servicio de WebSocket para logs y estado en tiempo real"""
import asyncio
from pathlib import Path
from app.core.config import settings
from app.services.server_service import server_service


class WebSocketService:
    """Servicio para manejo de WebSockets"""
    
    def __init__(self, sio):
        self.sio = sio
        self.server_path = Path(settings.SERVER_PATH)
        self.log_tasks = {}
        self.status_task = None
    
    async def start_log_stream(self, sid):
        """Iniciar stream de logs para un cliente"""
        if sid in self.log_tasks:
            return
        
        log_file = self.server_path / "logs" / "latest.log"
        
        async def stream_logs():
            try:
                # Verificar que el archivo existe
                if not log_file.exists():
                    await self.sio.emit('log-error', {
                        'error': f'Archivo de logs no encontrado: {log_file}'
                    }, room=sid)
                    return
                
                # Usar tail -f para seguir el archivo
                process = await asyncio.create_subprocess_exec(
                    "tail", "-f", "-n", "100", str(log_file),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                # Enviar confirmación de conexión
                await self.sio.emit('log-connected', {'message': 'Conectado a logs'}, room=sid)
                
                async for line in process.stdout:
                    log_line = line.decode().strip()
                    await self.sio.emit('log', {'line': log_line}, room=sid)
                
            except Exception as e:
                print(f"Error en stream de logs: {e}")
                await self.sio.emit('log-error', {'error': str(e)}, room=sid)
        
        task = asyncio.create_task(stream_logs())
        self.log_tasks[sid] = task
    
    async def stop_log_stream(self, sid):
        """Detener stream de logs para un cliente"""
        if sid in self.log_tasks:
            self.log_tasks[sid].cancel()
            del self.log_tasks[sid]
    
    async def start_status_updates(self):
        """Iniciar actualizaciones de estado cada 5 segundos"""
        if self.status_task:
            return
        
        async def update_status():
            while True:
                try:
                    status = await server_service.get_status()
                    await self.sio.emit('server-status-update', status)
                    await asyncio.sleep(5)
                except Exception as e:
                    print(f"Error en actualización de estado: {e}")
                    await asyncio.sleep(5)
        
        self.status_task = asyncio.create_task(update_status())
    
    def cleanup_client(self, sid):
        """Limpiar recursos de un cliente desconectado"""
        if sid in self.log_tasks:
            self.log_tasks[sid].cancel()
            del self.log_tasks[sid]
