"""Rutas para el módulo de administradores"""
from fastapi import APIRouter
from app.api.controllers import admins_controller

router = APIRouter()

# Incluir rutas de administradores
router.include_router(
    admins_controller.router,
    prefix="/admins",
    tags=["admins"]
)
