#!/bin/bash

# Script de Backup para Servidor Minecraft Paper
# Crea backups automáticos del servidor con notificaciones a los jugadores

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
BACKUP_DIR="./backups"
SERVER_DIR="./server"
MAX_BACKUPS=7  # Mantener últimos 7 backups
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="backup-$DATE.tar.gz"

# Función para mostrar uso
show_usage() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        Script de Backup - Servidor Minecraft         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Uso: $0 [opción]"
    echo ""
    echo "Opciones:"
    echo "  full          - Backup completo del servidor (por defecto)"
    echo "  world         - Backup solo de los mundos"
    echo "  plugins       - Backup solo de plugins"
    echo "  config        - Backup solo de configuración"
    echo "  restore       - Restaurar desde un backup"
    echo "  list          - Listar backups disponibles"
    echo "  clean         - Limpiar backups antiguos manualmente"
    echo "  auto          - Backup automático (sin notificaciones)"
    echo ""
    echo "Ejemplos:"
    echo "  $0              # Backup completo"
    echo "  $0 world        # Solo mundos"
    echo "  $0 list         # Ver backups"
    echo ""
}

# Función para verificar si el servidor está corriendo
is_server_running() {
    if [ -f "$SERVER_DIR/server.pid" ]; then
        local PID=$(cat "$SERVER_DIR/server.pid")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Función para enviar comando RCON
send_rcon_command() {
    if [ -x "./rcon-client.sh" ]; then
        ./rcon-client.sh "$1" 2>/dev/null
    fi
}

# Función para notificar jugadores
notify_players() {
    if is_server_running; then
        send_rcon_command "$1"
    fi
}

# Función para guardar el mundo
save_world() {
    echo -e "${YELLOW}💾 Guardando mundo...${NC}"
    if is_server_running; then
        notify_players "say §e[BACKUP] Guardando mundo..."
        send_rcon_command "save-all flush"
        sleep 5
        echo -e "${GREEN}✓ Mundo guardado${NC}"
    else
        echo -e "${YELLOW}⚠ Servidor no está corriendo, continuando con backup...${NC}"
    fi
}

# Función para crear directorio de backups
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        echo -e "${GREEN}✓ Directorio de backups creado: $BACKUP_DIR${NC}"
    fi
}

# Función para backup completo
backup_full() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Iniciando Backup Completo                   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    create_backup_dir
    save_world
    
    notify_players "say §e[BACKUP] Creando backup completo del servidor..."
    
    echo -e "${YELLOW}📦 Creando archivo de backup...${NC}"
    
    if tar -czf "$BACKUP_DIR/$BACKUP_NAME" "$SERVER_DIR" 2>/dev/null; then
        local SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
        echo -e "${GREEN}✓ Backup creado exitosamente: $BACKUP_NAME${NC}"
        echo -e "${GREEN}  Tamaño: $SIZE${NC}"
        echo -e "${GREEN}  Ubicación: $BACKUP_DIR/$BACKUP_NAME${NC}"
        
        notify_players "say §a[BACKUP] Backup completado exitosamente!"
        
        clean_old_backups
        return 0
    else
        echo -e "${RED}✗ Error al crear el backup${NC}"
        notify_players "say §c[BACKUP] Error al crear backup!"
        return 1
    fi
}

# Función para backup solo de mundos
backup_world() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Backup de Mundos                            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    create_backup_dir
    save_world
    
    local WORLD_BACKUP="$BACKUP_DIR/world-$DATE.tar.gz"
    
    notify_players "say §e[BACKUP] Creando backup de mundos..."
    
    echo -e "${YELLOW}🌍 Creando backup de mundos...${NC}"
    
    cd "$SERVER_DIR" || exit 1
    if tar -czf "../$WORLD_BACKUP" world* 2>/dev/null; then
        cd ..
        local SIZE=$(du -h "$WORLD_BACKUP" | cut -f1)
        echo -e "${GREEN}✓ Backup de mundos creado: world-$DATE.tar.gz${NC}"
        echo -e "${GREEN}  Tamaño: $SIZE${NC}"
        
        notify_players "say §a[BACKUP] Backup de mundos completado!"
        return 0
    else
        cd ..
        echo -e "${RED}✗ Error al crear el backup de mundos${NC}"
        return 1
    fi
}

# Función para backup de plugins
backup_plugins() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Backup de Plugins                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    create_backup_dir
    
    local PLUGINS_BACKUP="$BACKUP_DIR/plugins-$DATE.tar.gz"
    
    echo -e "${YELLOW}🔌 Creando backup de plugins...${NC}"
    
    if [ -d "$SERVER_DIR/plugins" ]; then
        if tar -czf "$PLUGINS_BACKUP" "$SERVER_DIR/plugins" 2>/dev/null; then
            local SIZE=$(du -h "$PLUGINS_BACKUP" | cut -f1)
            echo -e "${GREEN}✓ Backup de plugins creado: plugins-$DATE.tar.gz${NC}"
            echo -e "${GREEN}  Tamaño: $SIZE${NC}"
            return 0
        else
            echo -e "${RED}✗ Error al crear el backup de plugins${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠ No se encontró la carpeta de plugins${NC}"
        return 1
    fi
}

# Función para backup de configuración
backup_config() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Backup de Configuración                     ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    create_backup_dir
    
    local CONFIG_BACKUP="$BACKUP_DIR/config-$DATE.tar.gz"
    
    echo -e "${YELLOW}⚙️  Creando backup de configuración...${NC}"
    
    cd "$SERVER_DIR" || exit 1
    if tar -czf "../$CONFIG_BACKUP" *.properties *.yml *.yaml *.json 2>/dev/null; then
        cd ..
        local SIZE=$(du -h "$CONFIG_BACKUP" | cut -f1)
        echo -e "${GREEN}✓ Backup de configuración creado: config-$DATE.tar.gz${NC}"
        echo -e "${GREEN}  Tamaño: $SIZE${NC}"
        return 0
    else
        cd ..
        echo -e "${RED}✗ Error al crear el backup de configuración${NC}"
        return 1
    fi
}

# Función para limpiar backups antiguos
clean_old_backups() {
    echo -e "${YELLOW}🧹 Limpiando backups antiguos (más de $MAX_BACKUPS días)...${NC}"
    
    local COUNT=$(find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +$MAX_BACKUPS 2>/dev/null | wc -l)
    
    if [ "$COUNT" -gt 0 ]; then
        find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +$MAX_BACKUPS -delete 2>/dev/null
        echo -e "${GREEN}✓ $COUNT backup(s) antiguo(s) eliminado(s)${NC}"
    else
        echo -e "${GREEN}✓ No hay backups antiguos para eliminar${NC}"
    fi
}

# Función para listar backups
list_backups() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Backups Disponibles                         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}⚠ No existe el directorio de backups${NC}"
        return 1
    fi
    
    local BACKUPS=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f | sort -r)
    
    if [ -z "$BACKUPS" ]; then
        echo -e "${YELLOW}⚠ No hay backups disponibles${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Backups encontrados:${NC}"
    echo ""
    
    local COUNT=1
    while IFS= read -r BACKUP; do
        local FILENAME=$(basename "$BACKUP")
        local SIZE=$(du -h "$BACKUP" | cut -f1)
        local DATE_MOD=$(stat -c %y "$BACKUP" | cut -d' ' -f1,2 | cut -d'.' -f1)
        
        echo -e "  ${BLUE}[$COUNT]${NC} $FILENAME"
        echo -e "      Tamaño: $SIZE | Fecha: $DATE_MOD"
        echo ""
        
        COUNT=$((COUNT + 1))
    done <<< "$BACKUPS"
    
    local TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    echo -e "${GREEN}Espacio total usado: $TOTAL_SIZE${NC}"
}

# Función para restaurar backup
restore_backup() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Restaurar Backup                            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Verificar si el servidor está corriendo
    if is_server_running; then
        echo -e "${RED}⚠ ADVERTENCIA: El servidor está corriendo!${NC}"
        echo -e "${YELLOW}Debes detener el servidor antes de restaurar un backup.${NC}"
        echo ""
        read -p "¿Deseas detener el servidor ahora? (s/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            if [ -x "$SERVER_DIR/manage-control.sh" ]; then
                "$SERVER_DIR/manage-control.sh" stop
                sleep 5
            else
                echo -e "${RED}✗ No se pudo detener el servidor automáticamente${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}Operación cancelada${NC}"
            return 1
        fi
    fi
    
    # Listar backups disponibles
    list_backups
    
    echo ""
    echo -e "${YELLOW}Ingresa el número del backup a restaurar (o 'q' para salir):${NC}"
    read -r SELECTION
    
    if [[ "$SELECTION" == "q" ]] || [[ "$SELECTION" == "Q" ]]; then
        echo -e "${YELLOW}Operación cancelada${NC}"
        return 0
    fi
    
    # Obtener el archivo de backup seleccionado
    local BACKUPS=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f | sort -r)
    local BACKUP_FILE=$(echo "$BACKUPS" | sed -n "${SELECTION}p")
    
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}✗ Selección inválida${NC}"
        return 1
    fi
    
    echo ""
    echo -e "${RED}⚠ ADVERTENCIA: Esta operación sobrescribirá el servidor actual!${NC}"
    echo -e "${YELLOW}Backup a restaurar: $(basename "$BACKUP_FILE")${NC}"
    echo ""
    read -p "¿Estás seguro de continuar? Escribe 'SI' para confirmar: " -r CONFIRM
    
    if [[ "$CONFIRM" != "SI" ]]; then
        echo -e "${YELLOW}Operación cancelada${NC}"
        return 0
    fi
    
    echo ""
    echo -e "${YELLOW}📦 Creando backup de seguridad del estado actual...${NC}"
    local SAFETY_BACKUP="$BACKUP_DIR/pre-restore-$DATE.tar.gz"
    if tar -czf "$SAFETY_BACKUP" "$SERVER_DIR" 2>/dev/null; then
        echo -e "${GREEN}✓ Backup de seguridad creado: pre-restore-$DATE.tar.gz${NC}"
    fi
    
    echo -e "${YELLOW}🔄 Restaurando backup...${NC}"
    
    # Eliminar servidor actual
    rm -rf "$SERVER_DIR"
    
    # Extraer backup
    if tar -xzf "$BACKUP_FILE" 2>/dev/null; then
        echo -e "${GREEN}✓ Backup restaurado exitosamente${NC}"
        echo ""
        echo -e "${GREEN}Puedes iniciar el servidor con:${NC}"
        echo -e "${BLUE}  ./server/manage-control.sh start${NC}"
        return 0
    else
        echo -e "${RED}✗ Error al restaurar el backup${NC}"
        echo -e "${YELLOW}Restaurando backup de seguridad...${NC}"
        tar -xzf "$SAFETY_BACKUP" 2>/dev/null
        return 1
    fi
}

# Función principal
main() {
    # Mostrar ayuda sin verificar servidor
    if [[ "${1:-full}" == "-h" ]] || [[ "${1:-full}" == "--help" ]] || [[ "${1:-full}" == "help" ]]; then
        show_usage
        exit 0
    fi
    
    # Verificar que exista el directorio del servidor
    if [ ! -d "$SERVER_DIR" ]; then
        echo -e "${RED}✗ Error: No se encontró el directorio del servidor${NC}"
        echo -e "${YELLOW}Asegúrate de estar en el directorio correcto${NC}"
        exit 1
    fi
    
    case "${1:-full}" in
        full)
            backup_full
            ;;
        world)
            backup_world
            ;;
        plugins)
            backup_plugins
            ;;
        config)
            backup_config
            ;;
        restore)
            restore_backup
            ;;
        list)
            list_backups
            ;;
        clean)
            clean_old_backups
            ;;
        auto)
            # Modo automático sin notificaciones (para cron)
            create_backup_dir
            if is_server_running; then
                send_rcon_command "save-all flush"
                sleep 5
            fi
            tar -czf "$BACKUP_DIR/$BACKUP_NAME" "$SERVER_DIR" 2>/dev/null
            clean_old_backups
            ;;
        -h|--help|help)
            show_usage
            ;;
        *)
            echo -e "${RED}✗ Opción no válida: $1${NC}"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
