"""Schemas Pydantic para validación de request/response"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# Auth schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Server schemas
class ServerStatus(BaseModel):
    running: bool
    pid: Optional[int]
    memory: Dict[str, int]
    cpu: float
    uptime: int
    players: Dict[str, int]


class CommandRequest(BaseModel):
    command: str


# World schemas
class WorldInfo(BaseModel):
    id: str
    name: str
    description: str
    type: str
    icon: str
    tags: List[str] = []
    size_mb: int
    is_active: bool
    created_at: str


class CreateWorldRequest(BaseModel):
    id: str
    name: str
    description: str = ""
    type: str = "survival"
    icon: str = "🌍"
    tags: List[str] = []
    settings: Dict[str, Any] = {}


# Plugin schemas
class PluginInfo(BaseModel):
    name: str
    filename: str
    enabled: bool
    size_mb: float


# Backup schemas
class BackupInfo(BaseModel):
    filename: str
    path: str
    size_mb: float
    created_at: str


class CreateBackupRequest(BaseModel):
    type: str = Field(..., pattern="^(full|world|plugins|config)$")
    description: str = ""


# Config schemas
class UpdatePropertiesRequest(BaseModel):
    properties: Dict[str, str]


class UpdateWhitelistRequest(BaseModel):
    whitelist: List[Dict[str, Any]]


class UpdateOpsRequest(BaseModel):
    ops: List[Dict[str, Any]]


# System schemas
class SystemInfo(BaseModel):
    memory: Dict[str, Any]
    disk: Dict[str, Any]
    cpu: Dict[str, Any]
    os: Dict[str, str]


# Generic response
class MessageResponse(BaseModel):
    success: bool
    message: str
