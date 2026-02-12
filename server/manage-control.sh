#!/bin/bash

# Script de gestión del servidor Minecraft Paper
# Comandos: start, stop, restart, logs, status

set -e

# Configuración
SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAR_FILE="paper.jar"
PID_FILE="${SERVER_DIR}/server.pid"
LOG_FILE="${SERVER_DIR}/logs/latest.log"
MIN_RAM="1G"
MAX_RAM="4G"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Verificar si el servidor está corriendo
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Iniciar servidor
start_server() {
    cd "$SERVER_DIR"
    
    if is_running; then
        print_warning "El servidor ya está corriendo (PID: $(cat "$PID_FILE"))"
        return 1
    fi
    
    print_info "Iniciando servidor Minecraft Paper..."
    
    # Crear directorio de logs si no existe
    mkdir -p logs
    
    # Iniciar servidor con nohup
    nohup java -Xms${MIN_RAM} -Xmx${MAX_RAM} \
        -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 \
        -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch \
        -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M \
        -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 \
        -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 \
        -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 \
        -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 \
        -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true \
        -jar "$JAR_FILE" nogui > /dev/null 2>&1 &
    
    local pid=$!
    echo $pid > "$PID_FILE"
    
    sleep 3
    
    if is_running; then
        print_success "Servidor iniciado en segundo plano (PID: $pid)"
        print_info "Logs en: $LOG_FILE"
        print_info "Usa './manage-control.sh logs' para ver los logs en tiempo real"
        print_info "Usa './manage-control.sh status' para ver el estado"
    else
        print_error "Error al iniciar el servidor"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Detener servidor
stop_server() {
    if ! is_running; then
        print_warning "El servidor no está corriendo"
        rm -f "$PID_FILE"
        return 1
    fi
    
    local pid=$(cat "$PID_FILE")
    print_info "Deteniendo servidor (PID: $pid)..."
    
    # Intentar detener el servidor limpiamente
    # Nota: Para un stop limpio, necesitarías RCON. Este método fuerza el cierre.
    print_warning "Enviando señal de terminación..."
    kill "$pid" 2>/dev/null || true
    
    # Esperar a que se detenga
    local timeout=30
    local count=0
    while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt $timeout ]; do
        sleep 1
        ((count++))
    done
    
    if ps -p "$pid" > /dev/null 2>&1; then
        print_warning "Forzando cierre..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 2
    fi
    
    rm -f "$PID_FILE"
    print_success "Servidor detenido"
}

# Reiniciar servidor
restart_server() {
    print_info "Reiniciando servidor..."
    stop_server
    sleep 3
    start_server
}

# Ver logs en tiempo real
view_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        print_error "No se encontró el archivo de logs: $LOG_FILE"
        print_info "El servidor debe estar corriendo o haber sido ejecutado al menos una vez"
        return 1
    fi
    
    print_info "Mostrando logs en tiempo real (Ctrl+C para salir)"
    print_info "El servidor continuará ejecutándose al salir"
    echo ""
    tail -f "$LOG_FILE"
}

# Estado del servidor
status_server() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        print_success "El servidor está corriendo"
        echo "  PID: $pid"
        
        # Obtener uso de memoria
        if command -v ps &> /dev/null; then
            local mem=$(ps -p $pid -o rss= 2>/dev/null | awk '{print int($1/1024)" MB"}')
            if [ ! -z "$mem" ]; then
                echo "  Memoria: $mem"
            fi
            
            # Obtener tiempo de ejecución
            local uptime=$(ps -p $pid -o etime= 2>/dev/null | xargs)
            if [ ! -z "$uptime" ]; then
                echo "  Tiempo activo: $uptime"
            fi
        fi
        
        echo "  Logs: $LOG_FILE"
    else
        print_warning "El servidor no está corriendo"
    fi
}

# Mostrar ayuda
show_help() {
    echo "Script de gestión del servidor Minecraft Paper"
    echo ""
    echo "Uso: ./manage-control.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start     - Iniciar el servidor en segundo plano"
    echo "  stop      - Detener el servidor"
    echo "  restart   - Reiniciar el servidor"
    echo "  logs      - Ver los logs en tiempo real (Ctrl+C para salir)"
    echo "  status    - Ver el estado del servidor"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./manage-control.sh start     # Iniciar servidor"
    echo "  ./manage-control.sh logs      # Ver logs en tiempo real"
    echo "  ./manage-control.sh status    # Ver estado y PID"
    echo ""
    echo "Archivos:"
    echo "  PID: $PID_FILE"
    echo "  Logs: $LOG_FILE"
}

# Main
main() {
    case "${1:-help}" in
        start)
            start_server
            ;;
        stop)
            stop_server
            ;;
        restart)
            restart_server
            ;;
        logs)
            view_logs
            ;;
        status)
            status_server
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Comando desconocido: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
