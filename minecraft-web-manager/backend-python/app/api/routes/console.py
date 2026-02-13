"""Rutas para consola interactiva"""
from fastapi import APIRouter
from app.api.controllers import console_controller

router = APIRouter()

# Console
router.include_router(
    console_controller.router,
    prefix="/console",
    tags=["console"]
)
