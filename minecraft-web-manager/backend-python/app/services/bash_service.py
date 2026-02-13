"""Servicio para ejecutar scripts bash de forma asíncrona"""
import asyncio
from typing import Optional, Dict, Any, Callable
from pathlib import Path
from app.core.config import settings


class BashService:
    """Servicio para ejecutar scripts bash del sistema"""
    
    def __init__(self):
        self.server_path = Path(settings.SERVER_PATH)
        self.scripts_path = self.server_path.parent
    
    async def execute_script(
        self,
        script_name: str,
        args: list = None,
        cwd: Optional[Path] = None,
        on_data: Optional[Callable] = None,
        on_error: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Ejecutar script bash y retornar resultado
        
        Args:
            script_name: Nombre del script (ej: 'backup.sh')
            args: Argumentos del script
            cwd: Directorio de trabajo
            on_data: Callback para stdout
            on_error: Callback para stderr
        
        Returns:
            Dict con success, stdout, stderr, code
        """
        if args is None:
            args = []
        
        script_path = self.scripts_path / script_name
        cwd = cwd or self.scripts_path
        
        try:
            process = await asyncio.create_subprocess_exec(
                str(script_path),
                *args,
                cwd=str(cwd),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout_data = []
            stderr_data = []
            
            # Leer stdout
            async for line in process.stdout:
                chunk = line.decode()
                stdout_data.append(chunk)
                if on_data:
                    on_data(chunk)
            
            # Leer stderr
            async for line in process.stderr:
                chunk = line.decode()
                stderr_data.append(chunk)
                if on_error:
                    on_error(chunk)
            
            await process.wait()
            
            return {
                "success": process.returncode == 0,
                "stdout": "".join(stdout_data),
                "stderr": "".join(stderr_data),
                "code": process.returncode
            }
            
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "code": -1
            }
    
    async def server_command(self, command: str, *args) -> Dict[str, Any]:
        """
        Ejecutar comando en manage-control.sh del servidor
        
        Args:
            command: start, stop, restart, status, logs
            *args: Argumentos adicionales
        
        Returns:
            Dict con resultado
        """
        script_path = self.server_path / "manage-control.sh"
        
        try:
            process = await asyncio.create_subprocess_exec(
                str(script_path),
                command,
                *args,
                cwd=str(self.server_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            return {
                "success": process.returncode == 0,
                "stdout": stdout.decode(),
                "stderr": stderr.decode(),
                "code": process.returncode
            }
            
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "code": -1
            }
    
    async def exec_command(self, command: str, cwd: Optional[Path] = None) -> Dict[str, Any]:
        """
        Ejecutar comando shell arbitrario
        
        Args:
            command: Comando a ejecutar
            cwd: Directorio de trabajo
        
        Returns:
            Dict con stdout, stderr
        """
        cwd = cwd or self.scripts_path
        
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                cwd=str(cwd),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            return {
                "success": process.returncode == 0,
                "stdout": stdout.decode(),
                "stderr": stderr.decode(),
                "code": process.returncode
            }
            
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "code": -1
            }
    
    async def rcon_command(self, command: str) -> Dict[str, Any]:
        """
        Enviar comando RCON al servidor
        
        Args:
            command: Comando RCON (ej: 'list', 'save-all')
        
        Returns:
            Dict con resultado
        """
        rcon_script = self.scripts_path / "rcon-client.sh"
        
        try:
            process = await asyncio.create_subprocess_exec(
                str(rcon_script),
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            return {
                "success": process.returncode == 0,
                "stdout": stdout.decode(),
                "stderr": stderr.decode(),
                "code": process.returncode
            }
            
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "code": -1
            }


# Instancia global
bash_service = BashService()
