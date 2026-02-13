"""Servicio para control del servidor Minecraft"""
import json
import psutil
from pathlib import Path
from typing import Dict, Any, Optional
from app.core.config import settings
from app.services.bash_service import bash_service


class ServerService:
    """Servicio para controlar el servidor Minecraft"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.pid_file = self.server_path / "server.pid"
    
    def get_pid(self) -> Optional[int]:
        """Obtener PID del servidor desde archivo"""
        try:
            if self.pid_file.exists():
                pid = int(self.pid_file.read_text().strip())
                # Verificar que el proceso existe
                if psutil.pid_exists(pid):
                    return pid
        except Exception:
            pass
        return None
    
    def is_running(self) -> bool:
        """Verificar si el servidor está corriendo"""
        pid = self.get_pid()
        if pid:
            try:
                process = psutil.Process(pid)
                return process.is_running() and process.name() == "java"
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return False
    
    def get_version(self) -> Dict[str, str]:
        """
        Obtener versión de Paper del servidor
        
        Returns:
            Dict con paper, minecraft, full
        """
        version_file = self.server_path / "version_history.json"
        
        try:
            if version_file.exists():
                with open(version_file, 'r') as f:
                    data = json.load(f)
                    current_version = data.get('currentVersion', '')
                    
                    # Parsear "1.21.8-60-29c8822 (MC: 1.21.8)"
                    if current_version:
                        # Extraer versión Paper
                        paper_version = current_version.split('-')[0] if '-' in current_version else current_version.split()[0]
                        
                        # Extraer versión Minecraft
                        mc_version = ''
                        if 'MC:' in current_version:
                            mc_version = current_version.split('MC:')[1].strip().rstrip(')')
                        
                        return {
                            "paper": paper_version,
                            "minecraft": mc_version,
                            "full": current_version
                        }
        except Exception as e:
            print(f"Error leyendo versión: {e}")
        
        return {"paper": "Desconocida", "minecraft": "Desconocida", "full": "Desconocida"}
    
    async def get_status(self) -> Dict[str, Any]:
        """
        Obtener estado completo del servidor
        
        Returns:
            Dict con running, pid, memory, cpu, uptime, players
        """
        pid = self.get_pid()
        running = self.is_running()
        
        status = {
            "running": running,
            "pid": pid,
            "memory": {"used": 0, "max": 0},
            "cpu": 0.0,
            "uptime": 0,
            "players": {"online": 0, "max": 20},
            "version": self.get_version()
        }
        
        if running and pid:
            try:
                process = psutil.Process(pid)
                
                # Memoria
                mem_info = process.memory_info()
                status["memory"]["used"] = mem_info.rss
                
                # CPU
                status["cpu"] = process.cpu_percent(interval=0.1)
                
                # Uptime
                status["uptime"] = int(psutil.boot_time() - process.create_time())
                
                # Jugadores (via RCON - solo si mcrcon disponible)
                try:
                    # Verificar si mcrcon está instalado antes de intentar usarlo
                    import shutil
                    if shutil.which("mcrcon"):
                        result = await bash_service.rcon_command("list")
                        if result["success"]:
                            # Parsear "There are X of Y players online"
                            output = result["stdout"]
                            if "of" in output:
                                parts = output.split()
                                status["players"]["online"] = int(parts[2])
                                status["players"]["max"] = int(parts[4])
                except Exception:
                    pass
                
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                status["running"] = False
        
        return status
    
    async def start_server(self) -> Dict[str, Any]:
        """
        Iniciar servidor Minecraft
        
        Returns:
            Dict con success y mensaje
        """
        if self.is_running():
            return {"success": False, "message": "El servidor ya está corriendo"}
        
        result = await bash_service.server_command("start")
        
        return {
            "success": result["success"],
            "message": result["stdout"] if result["success"] else result["stderr"]
        }
    
    async def stop_server(self) -> Dict[str, Any]:
        """
        Detener servidor Minecraft
        
        Returns:
            Dict con success y mensaje
        """
        if not self.is_running():
            return {"success": False, "message": "El servidor no está corriendo"}
        
        result = await bash_service.server_command("stop")
        
        return {
            "success": result["success"],
            "message": result["stdout"] if result["success"] else result["stderr"]
        }
    
    async def restart_server(self) -> Dict[str, Any]:
        """
        Reiniciar servidor Minecraft
        
        Returns:
            Dict con success y mensaje
        """
        result = await bash_service.server_command("restart")
        
        return {
            "success": result["success"],
            "message": result["stdout"] if result["success"] else result["stderr"]
        }
    
    async def get_logs(self, lines: int = 100) -> Dict[str, Any]:
        """
        Obtener últimas líneas de logs
        
        Args:
            lines: Número de líneas
        
        Returns:
            Dict con success y logs
        """
        log_file = self.server_path / "logs" / "latest.log"
        
        try:
            if log_file.exists():
                result = await bash_service.exec_command(
                    f"tail -n {lines} {log_file}",
                    cwd=self.server_path
                )
                return {
                    "success": True,
                    "logs": result["stdout"]
                }
            else:
                return {"success": False, "logs": ""}
        except Exception as e:
            return {"success": False, "logs": "", "error": str(e)}
    
    async def send_command(self, command: str) -> Dict[str, Any]:
        """
        Enviar comando RCON al servidor
        
        Args:
            command: Comando a enviar
        
        Returns:
            Dict con success y respuesta
        """
        if not self.is_running():
            return {"success": False, "message": "El servidor no está corriendo"}
        
        result = await bash_service.rcon_command(command)
        
        return {
            "success": result["success"],
            "output": result["stdout"],
            "error": result["stderr"] if not result["success"] else None
        }


# Instancia global
server_service = ServerService()
