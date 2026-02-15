# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

Cambios en desarrollo que aún no están en producción.

## [1.2.0] - 2026-02-15

### Added
- Paneles de configuración MMORPG con editor RAW y visual
- Sección MMORPG en el menú lateral con aparición dinámica
- Plugins recomendados MMORPG (WorldEdit, LuckPerms, WorldGuard, Quests, Jobs Reborn, Shopkeepers, MythicMobs, Citizens)

### Fixed
- Integración de rutas y sidebar para nuevos paneles de configuración

## [1.0.0] - 2026-02-14

### Added
- Implementación de GitFlow para gestión de versiones
- Sistema de gestión de usuarios del panel web
- Panel de administradores con roles (admin, moderator, viewer)
- Consola interactiva RCON con comandos predefinidos
- Visualización de logs del servidor en tiempo real vía WebSocket
- Gestión de mundos con edición y upload
- Gestión de plugins con upload drag & drop
- Sistema de backups automáticos y manuales
- Configuración del servidor (server.properties)
- Dashboard con métricas en tiempo real
- Autenticación con JWT y sesiones
- Sidebar reorganizado con grupos: Control, Gestión, Administración

### Fixed
- Eventos WebSocket de logs (start_logs/stop_logs)
- Botones de comandos predefinidos con diseño mejorado

### Changed
- Reorganización del sidebar con nuevo grupo "Administración"

## [0.1.0] - Versiones Anteriores

Desarrollo inicial sin versionado estructurado.
