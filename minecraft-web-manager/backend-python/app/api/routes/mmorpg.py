"""Rutas para plugins MMORPG"""
from fastapi import APIRouter
from app.api.controllers import mmorpg_controller

router = APIRouter()

router.include_router(
    mmorpg_controller.router,
    prefix="/mmorpg",
    tags=["mmorpg"]
)
