"""Servicio para control del servidor Minecraft"""
import json
import os
import re
import psutil
from pathlib import Path
from tempfile import NamedTemporaryFile
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

    @staticmethod
    def memory_value_to_mb(value: str) -> int:
        match = re.fullmatch(r"([1-9][0-9]{0,3})([MG])", value)
        if not match:
            raise ValueError("Usa una cantidad positiva seguida de M o G, por ejemplo 1024M o 4G")
        amount = int(match.group(1))
        if match.group(2) == "G":
            if amount > 1024:
                raise ValueError("El límite máximo aceptado es 1024G")
            return amount * 1024
        if amount > 1048576:
            raise ValueError("El límite máximo aceptado es 1048576M")
        return amount

    def get_java_memory(self) -> Dict[str, str]:
        values = {"min_ram": "1G", "max_ram": "4G"}
        config_file = self.server_path / "java-memory.conf"

        if config_file.exists():
            for line in config_file.read_text(encoding="utf-8").splitlines():
                if not line or line.startswith("#"):
                    continue
                key, separator, value = line.partition("=")
                if not separator or key not in {"MIN_RAM", "MAX_RAM"}:
                    raise ValueError("El archivo java-memory.conf tiene una línea inválida")
                values["min_ram" if key == "MIN_RAM" else "max_ram"] = value

        min_mb = self.memory_value_to_mb(values["min_ram"])
        max_mb = self.memory_value_to_mb(values["max_ram"])
        if min_mb > max_mb:
            raise ValueError("La memoria inicial no puede superar la memoria máxima")
        return values

    def set_java_memory(self, min_ram: str, max_ram: str) -> Dict[str, str]:
        min_mb = self.memory_value_to_mb(min_ram)
        max_mb = self.memory_value_to_mb(max_ram)
        if min_mb > max_mb:
            raise ValueError("La memoria inicial no puede superar la memoria máxima")
        if self.is_running():
            raise RuntimeError("Detén el servidor antes de cambiar la memoria Java")

        self.server_path.mkdir(parents=True, exist_ok=True)
        temporary_path = None
        try:
            with NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=self.server_path,
                prefix=".java-memory.",
                delete=False,
            ) as temporary_file:
                temporary_file.write(f"MIN_RAM={min_ram}\nMAX_RAM={max_ram}\n")
                temporary_path = Path(temporary_file.name)
            temporary_path.chmod(0o640)
            os.replace(temporary_path, self.server_path / "java-memory.conf")
        finally:
            if temporary_path and temporary_path.exists():
                temporary_path.unlink()

        return {"min_ram": min_ram, "max_ram": max_ram}
    
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

        try:
            max_ram = self.get_java_memory()["max_ram"]
            status["memory"]["max"] = self.memory_value_to_mb(max_ram) * 1024 * 1024
        except (OSError, ValueError):
            status["memory"]["max"] = 0
        
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
