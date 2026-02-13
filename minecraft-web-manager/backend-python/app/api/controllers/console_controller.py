"""Controlador para consola interactiva del servidor"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
from app.services.rcon_service import rcon_service
from app.services.server_service import server_service


router = APIRouter()


class ExecuteCommandRequest(BaseModel):
    command: str


# Comandos predeterminados organizados por categorías
PREDEFINED_COMMANDS = {
    "Información": [
        {"label": "Ver jugadores", "command": "/list", "description": "Lista de jugadores online"},
        {"label": "Ayuda", "command": "/help", "description": "Muestra comandos disponibles"},
        {"label": "Versión", "command": "/version", "description": "Ver versión del servidor"}
    ],
    "Mundo": [
        {"label": "Guardar mundo", "command": "/save-all", "description": "Guarda el mundo"},
        {"label": "Día", "command": "/time set day", "description": "Cambia a día"},
        {"label": "Noche", "command": "/time set night", "description": "Cambia a noche"},
        {"label": "Clima despejado", "command": "/weather clear", "description": "Quita lluvia"},
        {"label": "Clima lluvioso", "command": "/weather rain", "description": "Activa lluvia"}
    ],
    "Jugadores": [
        {"label": "Survival todos", "command": "/gamemode survival @a", "description": "Modo supervivencia"},
        {"label": "Creative todos", "command": "/gamemode creative @a", "description": "Modo creativo"},
        {"label": "TP arriba", "command": "/tp @a ~ ~10 ~", "description": "Teleporta 10 bloques arriba"},
        {"label": "Dar diamantes", "command": "/give @a minecraft:diamond 64", "description": "Da 64 diamantes"},
        {"label": "Limpiar efectos", "command": "/effect clear @a", "description": "Quita efectos"}
    ],
    "Administración": [
        {"label": "Dificultad pacífica", "command": "/difficulty peaceful", "description": "Sin mobs hostiles"},
        {"label": "Dificultad normal", "command": "/difficulty normal", "description": "Dificultad estándar"},
        {"label": "Dificultad difícil", "command": "/difficulty hard", "description": "Más difícil"},
        {"label": "Anuncio", "command": "/say Mensaje del servidor", "description": "Mensaje público"},
        {"label": "Whitelist ON", "command": "/whitelist on", "description": "Activa whitelist"},
        {"label": "Whitelist OFF", "command": "/whitelist off", "description": "Desactiva whitelist"}
    ]
}


@router.post("/execute")
async def execute_command(request: ExecuteCommandRequest):
    """
    Ejecutar un comando en el servidor via RCON
    
    Args:
        request: Comando a ejecutar
        
    Returns:
        Resultado de la ejecución
    """
    try:
        # Verificar que el servidor esté corriendo
        if not server_service.is_running():
            raise HTTPException(
                status_code=400, 
                detail="El servidor no está corriendo. Inicia el servidor primero."
            )
        
        # Limpiar comando (remover / si está al inicio para RCON)
        command = request.command.strip()
        if command.startswith('/'):
            command = command[1:]
        
        if not command:
            raise HTTPException(status_code=400, detail="Comando vacío")
        
        # Ejecutar comando via RCON
        output = await rcon_service.execute_command(command)
        
        return {
            "success": True,
            "command": request.command,
            "output": output,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "command": request.command,
            "output": "",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.get("/commands")
async def get_predefined_commands():
    """
    Obtener lista de comandos predeterminados
    
    Returns:
        Diccionario con comandos categorizados
    """
    return {
        "categories": PREDEFINED_COMMANDS
    }


@router.get("/status")
async def get_console_status():
    """
    Verificar si la consola está disponible (servidor corriendo)
    
    Returns:
        Estado de disponibilidad
    """
    running = server_service.is_running()
    return {
        "available": running,
        "message": "Consola disponible" if running else "El servidor debe estar corriendo"
    }
