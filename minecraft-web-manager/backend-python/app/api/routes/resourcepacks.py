"""Rutas para el módulo de resource packs"""
from fastapi import APIRouter
from app.api.controllers import resourcepacks_controller

router = APIRouter()

# Incluir rutas de resource packs
router.include_router(
    resourcepacks_controller.router,
    prefix="/resourcepacks",
    tags=["resourcepacks"]
)
