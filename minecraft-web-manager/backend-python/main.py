"""Punto de entrada principal de la aplicación FastAPI"""
import socketio
from fastapi import FastAPI, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.deps import get_current_user_optional
from app.models.user import User
from app.api.routes import auth, server, worlds, plugins, backups, config, system, users
from app.services.websocket_service import WebSocketService

# Crear aplicación FastAPI
app = FastAPI(
    title="Minecraft Manager",
    description="Sistema de gestión para servidor Minecraft Paper",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos
static_path = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Templates Jinja2
templates_path = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_path))

# Registrar routers de API
app.include_router(auth.router)
app.include_router(server.router)
app.include_router(worlds.router)
app.include_router(plugins.router)
app.include_router(backups.router)
app.include_router(config.router)
app.include_router(system.router)
app.include_router(users.router, prefix="/api")

# Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# WebSocket service
ws_service = WebSocketService(sio)


# Eventos de Socket.IO
@sio.event
async def connect(sid, environ, auth=None):
    """Cliente conectado"""
    print(f"✅ Cliente WebSocket conectado: {sid}")
    print(f"   Environ keys: {list(environ.keys())[:5]}")
    # Siempre aceptar conexión
    return True


@sio.event
async def disconnect(sid):
    """Cliente desconectado"""
    print(f"Cliente desconectado: {sid}")
    ws_service.cleanup_client(sid)


@sio.event
async def start_logs(sid, data=None):
    """Iniciar stream de logs"""
    await ws_service.start_log_stream(sid)


@sio.event
async def stop_logs(sid, data=None):
    """Detener stream de logs"""
    await ws_service.stop_log_stream(sid)


# Iniciar actualizaciones de estado al arrancar
@app.on_event("startup")
async def startup_event():
    """Evento de inicio"""
    print("Iniciando servidor...")
    await ws_service.start_status_updates()


# Rutas de templates HTML
@app.get("/", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional)
):
    """Dashboard principal"""
    if not user:
        return RedirectResponse(url="/login")
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "user": user
    })


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Página de login"""
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/server", response_class=HTMLResponse)
async def server_page(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional)
):
    """Página de control del servidor"""
    if not user:
        return RedirectResponse(url="/login")
    
    return templates.TemplateResponse("server.html", {
        "request": request,
        "user": user
    })


@app.get("/worlds", response_class=HTMLResponse)
async def worlds_page(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional)
):
    """Página de gestión de mundos"""
    if not user:
        return RedirectResponse(url="/login")
    
    return templates.TemplateResponse("worlds.html", {
        "request": request,
        "user": user
    })


@app.get("/users", response_class=HTMLResponse)
async def users_page(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional)
):
    """Página de gestión de usuarios"""
    if not user:
        return RedirectResponse(url="/login")
    
    return templates.TemplateResponse("users.html", {
        "request": request,
        "user": user
    })


@app.get("/plugins", response_class=HTMLResponse)
async def plugins_page(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional)
):
    """Página de gestión de plugins"""
    if not user:
        return RedirectResponse(url="/login")
    
    return templates.TemplateResponse("plugins.html", {
        "request": request,
        "user": user
    })


@app.get("/backups", response_class=HTMLResponse)
async def backups_page(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional)
):
    """Página de sistema de backups"""
    if not user:
        return RedirectResponse(url="/login")
    
    return templates.TemplateResponse("backups.html", {
        "request": request,
        "user": user
    })


@app.get("/config", response_class=HTMLResponse)
async def config_page(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional)
):
    """Página de configuración"""
    if not user:
        return RedirectResponse(url="/login")
    
    return templates.TemplateResponse("config.html", {
        "request": request,
        "user": user
    })


# Combinar FastAPI con Socket.IO
app_socketio = socketio.ASGIApp(sio, app)
