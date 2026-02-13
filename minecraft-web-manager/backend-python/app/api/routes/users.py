"""Rutas para gestión de usuarios del servidor Minecraft"""
from fastapi import APIRouter
from app.api.controllers import (
    player_controller,
    op_controller,
    whitelist_controller,
    ban_controller
)

router = APIRouter()

# Players
router.include_router(
    player_controller.router,
    prefix="/players",
    tags=["players"]
)

# Operators
router.include_router(
    op_controller.router,
    prefix="/operators",
    tags=["operators"]
)

# Whitelist
router.include_router(
    whitelist_controller.router,
    prefix="/whitelist",
    tags=["whitelist"]
)

# Bans
router.include_router(
    ban_controller.router,
    prefix="/bans",
    tags=["bans"]
)
