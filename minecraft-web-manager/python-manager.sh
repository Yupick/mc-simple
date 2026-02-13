#!/bin/bash

# Script de administración del Web Manager Python para Minecraft
# Uso: ./python-manager.sh {setup|start|stop|restart|status|logs}

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend-python"
VENV_DIR="$BACKEND_DIR/venv"
PID_FILE="$BACKEND_DIR/.pid"
LOGS_DIR="$BACKEND_DIR/logs"
LOG_FILE="$LOGS_DIR/server.log"

# Python y uvicorn
PYTHON_BIN="$VENV_DIR/bin/python"
UVICORN_BIN="$VENV_DIR/bin/uvicorn"
PIP_BIN="$VENV_DIR/bin/pip"

# Puerto
PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

# Crear directorios si no existen
mkdir -p "$LOGS_DIR"

# Funciones de utilidad
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar si existe venv
check_venv() {
    if [ ! -d "$VENV_DIR" ] || [ ! -f "$PYTHON_BIN" ]; then
        return 1
    fi
    return 0
}

# Obtener PID del proceso
get_pid() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        # Verificar si el proceso existe
        if kill -0 "$pid" 2>/dev/null; then
            echo "$pid"
            return 0
        else
            # PID file existe pero proceso no, limpiar
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Verificar si está corriendo
is_running() {
    get_pid > /dev/null 2>&1
    return $?
}

# SETUP - Instalación inicial
setup() {
    echo -e "\n${BLUE}=== SETUP INICIAL ===${NC}\n"
    
    # Verificar Python 3
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 no está instalado"
        print_info "Instala Python 3: sudo apt install python3 python3-venv python3-pip"
        exit 1
    fi
    
    print_info "Python encontrado: $(python3 --version)"
    
    # Crear entorno virtual
    if check_venv; then
        print_success "Entorno virtual ya existe"
    else
        print_info "Creando entorno virtual..."
        python3 -m venv "$VENV_DIR"
        if [ $? -eq 0 ]; then
            print_success "Entorno virtual creado"
        else
            print_error "Error al crear entorno virtual"
            exit 1
        fi
    fi
    
    # Actualizar pip
    print_info "Actualizando pip..."
    "$PYTHON_BIN" -m pip install --upgrade pip --quiet
    
    # Instalar dependencias
    print_info "Instalando dependencias..."
    if [ -f "$BACKEND_DIR/requirements.txt" ]; then
        "$PIP_BIN" install -r "$BACKEND_DIR/requirements.txt" --quiet
        if [ $? -eq 0 ]; then
            print_success "Dependencias instaladas"
        else
            print_error "Error al instalar dependencias"
            exit 1
        fi
    else
        print_error "No se encontró requirements.txt"
        exit 1
    fi
    
    # Crear directorios necesarios
    print_info "Creando directorios..."
    mkdir -p "$BACKEND_DIR/data"
    mkdir -p "$LOGS_DIR"
    print_success "Directorios creados"
    
    # Verificar .env
    if [ -f "$BACKEND_DIR/.env" ]; then
        print_success "Archivo .env encontrado"
    else
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            print_info "Copiando .env.example a .env..."
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            print_warning "⚠️  IMPORTANTE: Edita $BACKEND_DIR/.env con tus configuraciones"
        else
            print_warning "No se encontró .env ni .env.example"
        fi
    fi
    
    # Ejecutar migraciones
    print_info "Inicializando base de datos..."
    cd "$BACKEND_DIR"
    "$PYTHON_BIN" -c "from app.db.session import init_db; init_db()" 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "Base de datos inicializada"
    else
        print_warning "Hubo un problema al inicializar la DB (puede ser normal si ya existe)"
    fi
    
    # Crear admin
    print_info "Crear usuario administrador..."
    "$PYTHON_BIN" -m app.scripts.create_admin
    
    echo -e "\n${GREEN}✅ Setup completado exitosamente!${NC}\n"
    print_info "Para iniciar el servidor ejecuta: ./python-manager.sh start"
}

# START - Iniciar servidor
start() {
    if is_running; then
        print_error "El servidor ya está corriendo"
        local pid=$(get_pid)
        print_info "PID: $pid"
        exit 1
    fi
    
    if ! check_venv; then
        print_error "Entorno virtual no encontrado"
        print_info "Ejecuta: ./python-manager.sh setup"
        exit 1
    fi
    
    print_info "Iniciando servidor en $HOST:$PORT..."
    
    # Cambiar al directorio backend-python
    cd "$BACKEND_DIR"
    
    # Iniciar servidor en background
    nohup "$UVICORN_BIN" main:app_socketio \
        --host "$HOST" \
        --port "$PORT" \
        --reload \
        >> "$LOG_FILE" 2>&1 &
    
    local pid=$!
    
    # Guardar PID
    echo "$pid" > "$PID_FILE"
    
    # Esperar un momento para verificar
    sleep 2
    
    if kill -0 "$pid" 2>/dev/null; then
        print_success "Servidor iniciado correctamente (PID: $pid)"
        print_info "URL: http://$HOST:$PORT"
        print_info "Docs: http://$HOST:$PORT/docs"
        print_info "Logs: $LOG_FILE"
        print_info ""
        print_info "Para ver logs en tiempo real: ./python-manager.sh logs"
    else
        print_error "Error al iniciar el servidor"
        rm -f "$PID_FILE"
        print_info "Revisa los logs: tail -f $LOG_FILE"
        exit 1
    fi
}

# STOP - Detener servidor
stop() {
    if ! is_running; then
        print_warning "El servidor no está corriendo"
        return
    fi
    
    local pid=$(get_pid)
    print_info "Deteniendo servidor (PID: $pid)..."
    
    # Enviar SIGTERM
    kill "$pid" 2>/dev/null
    
    # Esperar hasta 10 segundos
    local count=0
    while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
        sleep 1
        ((count++))
    done
    
    # Si todavía está corriendo, forzar
    if kill -0 "$pid" 2>/dev/null; then
        print_warning "Proceso no respondió, forzando cierre..."
        kill -9 "$pid" 2>/dev/null
        sleep 1
    fi
    
    # Limpiar PID file
    rm -f "$PID_FILE"
    
    print_success "Servidor detenido"
}

# RESTART - Reiniciar servidor
restart() {
    echo -e "\n${BLUE}=== REINICIANDO SERVIDOR ===${NC}\n"
    stop
    sleep 2
    start
}

# STATUS - Estado del servidor
status() {
    echo -e "\n${BLUE}=== ESTADO DEL SERVIDOR ===${NC}\n"
    
    if is_running; then
        local pid=$(get_pid)
        print_success "Servidor corriendo (PID: $pid)"
        
        # Info del proceso si está disponible ps
        if command -v ps &> /dev/null; then
            echo ""
            ps -p "$pid" -o pid,ppid,%cpu,%mem,etime,cmd --no-headers | while read line; do
                print_info "Proceso: $line"
            done
        fi
        
        echo ""
        print_info "URL: http://$HOST:$PORT"
        print_info "Logs: $LOG_FILE"
    else
        print_warning "Servidor detenido"
    fi
    
    echo ""
}

# LOGS - Ver logs en tiempo real
logs() {
    if [ ! -f "$LOG_FILE" ]; then
        print_warning "No se encontró archivo de logs"
        exit 1
    fi
    
    print_info "Mostrando logs en tiempo real (Ctrl+C para salir)..."
    echo ""
    tail -f "$LOG_FILE"
}

# BUILD - No necesario en Python, pero lo dejamos para compatibilidad
build() {
    print_info "No es necesario compilar en la versión Python"
    print_success "La aplicación está lista para usar"
}

# CLEAN - Limpiar archivos temporales
clean() {
    print_info "Limpiando archivos temporales..."
    
    # Detener si está corriendo
    if is_running; then
        print_warning "Deteniendo servidor primero..."
        stop
    fi
    
    # Limpiar archivos
    rm -f "$PID_FILE"
    rm -f "$LOG_FILE"
    
    # Limpiar __pycache__
    find "$BACKEND_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
    find "$BACKEND_DIR" -type f -name "*.pyc" -delete 2>/dev/null
    
    print_success "Limpieza completada"
}

# Mostrar uso
show_usage() {
    cat << EOF

${BLUE}Minecraft Web Manager - Python Version${NC}

Uso: ./python-manager.sh {comando} [opciones]

${YELLOW}Comandos:${NC}
  setup         Instalación inicial (venv, dependencias, DB, admin)
  start         Iniciar servidor
  stop          Detener servidor
  restart       Reiniciar servidor
  status        Mostrar estado del servidor
  logs          Ver logs en tiempo real
  build         (No necesario en Python, para compatibilidad)
  clean         Limpiar archivos temporales y cache

${YELLOW}Variables de entorno:${NC}
  PORT          Puerto del servidor (default: 8000)
  HOST          Host del servidor (default: 0.0.0.0)

${YELLOW}Ejemplos:${NC}
  ./python-manager.sh setup
  ./python-manager.sh start
  PORT=8080 ./python-manager.sh start
  ./python-manager.sh logs
  ./python-manager.sh stop

${YELLOW}Despliegue en producción (systemd):${NC}
  sudo cp minecraft-manager.service /etc/systemd/system/
  sudo systemctl enable minecraft-manager
  sudo systemctl start minecraft-manager

EOF
}

# Main
case "${1:-}" in
    setup)
        setup
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    build)
        build
        ;;
    clean)
        clean
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

exit 0
