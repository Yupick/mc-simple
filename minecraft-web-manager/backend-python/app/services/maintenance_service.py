"""Safe subprocess jobs for Paper and managed plugin maintenance."""
import asyncio
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from app.core.config import settings


class ServerMaintenanceService:
    def __init__(self):
        self.project_path = Path(settings.SERVER_PATH).resolve().parent
        self.update_script = self.project_path / "update-paper.sh"
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.lock = asyncio.Lock()

    def is_busy(self) -> bool:
        return any(job["status"] in {"queued", "running"} for job in self.jobs.values())

    async def _run_script(self, *args: str):
        process = await asyncio.create_subprocess_exec(
            "bash",
            str(self.update_script),
            *args,
            cwd=str(self.project_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()
        return process.returncode, stdout.decode("utf-8", errors="replace"), stderr.decode("utf-8", errors="replace")

    async def check_updates(self) -> Dict[str, Any]:
        if not self.update_script.is_file():
            raise RuntimeError("No se encontró update-paper.sh en el directorio del proyecto")
        return_code, stdout, stderr = await self._run_script("--web-check")
        if return_code != 0:
            raise RuntimeError(stderr.strip() or "No se pudieron consultar las actualizaciones")
        try:
            return json.loads(stdout)
        except json.JSONDecodeError as error:
            raise RuntimeError("El actualizador devolvió una respuesta inválida") from error

    async def start_update(
        self,
        paper: bool,
        plugins: bool,
        version: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not paper and not plugins:
            raise ValueError("Selecciona Paper, plugins o ambos para actualizar")
        if version and (not paper or not re.fullmatch(r"[0-9]+(?:\.[0-9]+){1,2}", version)):
            raise ValueError("La versión de Paper no es válida")
        if not self.update_script.is_file():
            raise RuntimeError("No se encontró update-paper.sh en el directorio del proyecto")

        async with self.lock:
            if self.is_busy():
                raise RuntimeError("Ya hay una tarea de mantenimiento en curso")

            job_id = uuid.uuid4().hex
            args = ["--web-update"]
            if paper:
                args.append("--paper")
            if plugins:
                args.append("--plugins")
            if version:
                args.extend(["--version", version])

            self.jobs[job_id] = {
                "id": job_id,
                "status": "queued",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "result": None,
                "error": None,
            }
            asyncio.create_task(self._run_job(job_id, args))
            return {"id": job_id, "status": "queued"}

    async def _run_job(self, job_id: str, args: list[str]):
        self.jobs[job_id]["status"] = "running"
        self.jobs[job_id]["started_at"] = datetime.now(timezone.utc).isoformat()
        try:
            return_code, stdout, stderr = await self._run_script(*args)
            result = json.loads(stdout) if stdout.strip() else None
            if return_code != 0 or not result or not result.get("success", False):
                self.jobs[job_id]["status"] = "failed"
                self.jobs[job_id]["error"] = stderr.strip() or "La actualización no terminó correctamente"
            else:
                self.jobs[job_id]["status"] = "completed"
            self.jobs[job_id]["result"] = result
        except Exception as error:
            self.jobs[job_id]["status"] = "failed"
            self.jobs[job_id]["error"] = str(error)
        finally:
            self.jobs[job_id]["finished_at"] = datetime.now(timezone.utc).isoformat()

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        job = self.jobs.get(job_id)
        return dict(job) if job else None


maintenance_service = ServerMaintenanceService()