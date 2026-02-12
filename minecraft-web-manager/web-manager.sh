#!/bin/bash

# Script de administración del Web Manager para Minecraft
# Uso: ./web-manager.sh {start|stop|restart|status}

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PIDS_DIR="$SCRIPT_DIR/.pids"
LOGS_DIR="$SCRIPT_DIR/logs"

# Archivos de PID
BACKEND_PID_FILE="$PIDS_DIR/backend.pid"
FRONTEND_PID_FILE="$PIDS_DIR/frontend.pid"

# Archivos de logs
BACKEND_LOG="$LOGS_DIR/backend.log"
FRONTEND_LOG="$LOGS_DIR/frontend.log"

# Crear directorios si no existen
mkdir -p "$PIDS_DIR"
mkdir -p "$LOGS_DIR"

# Función para imprimir mensajes
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Función para verificar si un proceso está corriendo
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Función para obtener el estado
get_status() {
    local backend_running=false
    local frontend_running=false

    if is_running "$BACKEND_PID_FILE"; then
        backend_running=true
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    fi

    if is_running "$FRONTEND_PID_FILE"; then
        frontend_running=true
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    fi

    echo "=== Estado del Web Manager ==="
    echo ""

    if [ "$backend_running" = true ]; then
        print_message "$GREEN" "✓ Backend: CORRIENDO (PID: $BACKEND_PID)"
        echo "  Puerto: 3001"
        echo "  Log: $BACKEND_LOG"
    else
        print_message "$RED" "✗ Backend: DETENIDO"
    fi

    echo ""

    if [ "$frontend_running" = true ]; then
        print_message "$GREEN" "✓ Frontend: CORRIENDO (PID: $FRONTEND_PID)"
        echo "  URL: http://localhost:5173"
        echo "  Log: $FRONTEND_LOG"
    else
        print_message "$RED" "✗ Frontend: DETENIDO"
    fi

    echo ""

    if [ "$backend_running" = true ] && [ "$frontend_running" = true ]; then
        print_message "$GREEN" "Estado: SISTEMA OPERATIVO"
        echo ""
        print_message "$BLUE" "Accede al panel web en: http://localhost:5173"
        return 0
    elif [ "$backend_running" = true ] || [ "$frontend_running" = true ]; then
        print_message "$YELLOW" "Estado: PARCIALMENTE OPERATIVO"
        return 2
    else
        print_message "$RED" "Estado: SISTEMA DETENIDO"
        return 1
    fi
}

# Función para verificar configuración del backend
check_backend_config() {
    local errors=0

    # Verificar archivo .env
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        print_message "$RED" "✗ Error: No existe el archivo .env en el backend"
        print_message "$YELLOW" "  Crea el archivo con: cd backend && cp .env.example .env"
        print_message "$YELLOW" "  Luego edita las variables necesarias"
        errors=$((errors + 1))
    fi

    # Verificar directorio de datos
    if [ ! -d "$BACKEND_DIR/data" ]; then
        print_message "$YELLOW" "Creando directorio de datos..."
        mkdir -p "$BACKEND_DIR/data"
    fi

    # Verificar base de datos
    if [ ! -f "$BACKEND_DIR/data/minecraft-manager.db" ]; then
        print_message "$YELLOW" "⚠ Base de datos no encontrada. Se ejecutarán las migraciones..."

        # Verificar que node_modules exista antes de ejecutar migraciones
        if [ ! -d "$BACKEND_DIR/node_modules" ]; then
            print_message "$YELLOW" "Instalando dependencias primero..."
            cd "$BACKEND_DIR" && npm install > "$BACKEND_LOG" 2>&1
            if [ $? -ne 0 ]; then
                print_message "$RED" "✗ Error al instalar dependencias"
                return 1
            fi
        fi

        print_message "$BLUE" "Ejecutando migraciones de base de datos..."
        cd "$BACKEND_DIR" && npm run migrate >> "$BACKEND_LOG" 2>&1
        if [ $? -ne 0 ]; then
            print_message "$RED" "✗ Error al ejecutar migraciones"
            print_message "$YELLOW" "  Revisa el log: $BACKEND_LOG"
            errors=$((errors + 1))
        else
            print_message "$GREEN" "✓ Migraciones ejecutadas correctamente"
            print_message "$YELLOW" "  IMPORTANTE: Debes crear un usuario admin con: cd backend && npm run create-admin"
        fi
    fi

    return $errors
}

# Función para iniciar el backend
start_backend() {
    if is_running "$BACKEND_PID_FILE"; then
        print_message "$YELLOW" "El backend ya está corriendo"
        return 1
    fi

    print_message "$BLUE" "Iniciando backend..."

    # Verificar si el puerto 3001 está libre
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_message "$YELLOW" "⚠ El puerto 3001 está en uso. Liberando puerto..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null
        sleep 1
    fi

    # Verificar configuración
    check_backend_config
    if [ $? -ne 0 ]; then
        print_message "$RED" "✗ Errores de configuración encontrados. Corrige los errores antes de continuar."
        return 1
    fi

    # Verificar que existan las dependencias
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        print_message "$YELLOW" "Instalando dependencias del backend..."
        cd "$BACKEND_DIR" && npm install > "$BACKEND_LOG" 2>&1
        if [ $? -ne 0 ]; then
            print_message "$RED" "Error al instalar dependencias del backend"
            return 1
        fi
    fi

    # Iniciar backend
    cd "$BACKEND_DIR"
    nohup npm start > "$BACKEND_LOG" 2>&1 &
    local pid=$!
    echo $pid > "$BACKEND_PID_FILE"

    # Esperar un momento para verificar que inició correctamente
    sleep 3

    if is_running "$BACKEND_PID_FILE"; then
        print_message "$GREEN" "✓ Backend iniciado correctamente (PID: $pid)"
        print_message "$BLUE" "  API disponible en: http://localhost:3001/api"
        return 0
    else
        print_message "$RED" "✗ Error al iniciar el backend"
        print_message "$YELLOW" "  Revisa el log: $BACKEND_LOG"
        return 1
    fi
}

# Función para iniciar el frontend
start_frontend() {
    if is_running "$FRONTEND_PID_FILE"; then
        print_message "$YELLOW" "El frontend ya está corriendo"
        return 1
    fi

    print_message "$BLUE" "Iniciando frontend..."

    # Verificar si el puerto 5173 está libre
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_message "$YELLOW" "⚠ El puerto 5173 está en uso. Liberando puerto..."
        lsof -ti:5173 | xargs kill -9 2>/dev/null
        sleep 1
    fi

    # Verificar que existan las dependencias
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_message "$YELLOW" "Instalando dependencias del frontend..."
        cd "$FRONTEND_DIR" && npm install > "$FRONTEND_LOG" 2>&1
        if [ $? -ne 0 ]; then
            print_message "$RED" "Error al instalar dependencias del frontend"
            return 1
        fi
    fi

    # Iniciar frontend
    cd "$FRONTEND_DIR"
    nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
    local pid=$!
    echo $pid > "$FRONTEND_PID_FILE"

    # Esperar un momento para verificar que inició correctamente
    sleep 3

    if is_running "$FRONTEND_PID_FILE"; then
        print_message "$GREEN" "✓ Frontend iniciado correctamente (PID: $pid)"
        print_message "$BLUE" "  Panel web disponible en: http://localhost:5173"
        return 0
    else
        print_message "$RED" "✗ Error al iniciar el frontend"
        print_message "$YELLOW" "  Revisa el log: $FRONTEND_LOG"
        return 1
    fi
}

# Función para detener el backend
stop_backend() {
    if ! is_running "$BACKEND_PID_FILE"; then
        print_message "$YELLOW" "El backend no está corriendo"
        return 1
    fi

    print_message "$BLUE" "Deteniendo backend..."

    local pid=$(cat "$BACKEND_PID_FILE")
    kill $pid 2>/dev/null

    # Esperar a que el proceso termine
    local count=0
    while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done

    # Si no se detuvo, forzar
    if ps -p $pid > /dev/null 2>&1; then
        print_message "$YELLOW" "Forzando detención del backend..."
        kill -9 $pid 2>/dev/null
    fi

    rm -f "$BACKEND_PID_FILE"
    print_message "$GREEN" "✓ Backend detenido"
    return 0
}

# Función para detener el frontend
stop_frontend() {
    if ! is_running "$FRONTEND_PID_FILE"; then
        print_message "$YELLOW" "El frontend no está corriendo"
        return 1
    fi

    print_message "$BLUE" "Deteniendo frontend..."

    local pid=$(cat "$FRONTEND_PID_FILE")

    # Matar el proceso principal y sus hijos (Vite crea procesos hijos)
    pkill -P $pid 2>/dev/null
    kill $pid 2>/dev/null

    # Esperar a que el proceso termine
    local count=0
    while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done

    # Si no se detuvo, forzar
    if ps -p $pid > /dev/null 2>&1; then
        print_message "$YELLOW" "Forzando detención del frontend..."
        kill -9 $pid 2>/dev/null
        pkill -9 -P $pid 2>/dev/null
    fi

    rm -f "$FRONTEND_PID_FILE"
    print_message "$GREEN" "✓ Frontend detenido"
    return 0
}

# Función principal de inicio
start() {
    print_message "$BLUE" "=== Iniciando Web Manager ==="
    echo ""

    start_backend
    local backend_result=$?

    echo ""

    start_frontend
    local frontend_result=$?

    echo ""

    if [ $backend_result -eq 0 ] && [ $frontend_result -eq 0 ]; then
        print_message "$GREEN" "=== Sistema iniciado correctamente ==="
        echo ""
        print_message "$GREEN" "Accede al panel web en: http://localhost:5173"
        print_message "$BLUE" "API disponible en: http://localhost:3001/api"
        echo ""
        print_message "$YELLOW" "Para ver los logs en tiempo real:"
        echo "  Backend:  tail -f $BACKEND_LOG"
        echo "  Frontend: tail -f $FRONTEND_LOG"
    else
        print_message "$RED" "=== Error al iniciar el sistema ==="
        echo ""
        print_message "$YELLOW" "Revisa los logs para más información"
    fi
}

# Función principal de detención
stop() {
    print_message "$BLUE" "=== Deteniendo Web Manager ==="
    echo ""

    stop_frontend
    echo ""
    stop_backend

    echo ""
    print_message "$GREEN" "=== Sistema detenido ==="
}

# Función de reinicio
restart() {
    print_message "$BLUE" "=== Reiniciando Web Manager ==="
    echo ""

    stop
    echo ""
    sleep 2
    start
}

# Función para ver logs
logs() {
    local service=$1

    case "$service" in
        backend)
            if [ -f "$BACKEND_LOG" ]; then
                tail -f "$BACKEND_LOG"
            else
                print_message "$RED" "No hay logs del backend disponibles"
            fi
            ;;
        frontend)
            if [ -f "$FRONTEND_LOG" ]; then
                tail -f "$FRONTEND_LOG"
            else
                print_message "$RED" "No hay logs del frontend disponibles"
            fi
            ;;
        *)
            echo "Uso: $0 logs {backend|frontend}"
            ;;
    esac
}

# Función de configuración inicial
setup() {
    print_message "$BLUE" "=== Configuración Inicial del Web Manager ==="
    echo ""

    # Paso 1: Instalar dependencias del backend
    print_message "$BLUE" "Paso 1/4: Instalando dependencias del backend..."
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        cd "$BACKEND_DIR" && npm install
        if [ $? -ne 0 ]; then
            print_message "$RED" "✗ Error al instalar dependencias del backend"
            return 1
        fi
        print_message "$GREEN" "✓ Dependencias del backend instaladas"
    else
        print_message "$GREEN" "✓ Dependencias del backend ya instaladas"
    fi
    echo ""

    # Paso 2: Configurar archivo .env
    print_message "$BLUE" "Paso 2/4: Configurando archivo .env..."
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        print_message "$YELLOW" "✓ Archivo .env creado desde .env.example"
        print_message "$YELLOW" "  IMPORTANTE: Edita el archivo backend/.env con tus rutas y configuraciones"
        print_message "$YELLOW" "  Variables clave:"
        print_message "$YELLOW" "    - SERVER_PATH: Ruta al servidor Minecraft"
        print_message "$YELLOW" "    - BACKUP_PATH: Ruta a los backups"
        print_message "$YELLOW" "    - JWT_SECRET: Cambiar por un secreto largo y seguro"
        print_message "$YELLOW" "    - RCON_PASSWORD: Password RCON del servidor"
        echo ""
        read -p "Presiona ENTER después de editar el archivo .env..."
    else
        print_message "$GREEN" "✓ Archivo .env ya existe"
    fi
    echo ""

    # Paso 3: Ejecutar migraciones
    print_message "$BLUE" "Paso 3/4: Ejecutando migraciones de base de datos..."
    cd "$BACKEND_DIR" && npm run migrate
    if [ $? -ne 0 ]; then
        print_message "$RED" "✗ Error al ejecutar migraciones"
        return 1
    fi
    print_message "$GREEN" "✓ Migraciones ejecutadas correctamente"
    echo ""

    # Paso 4: Crear usuario admin
    print_message "$BLUE" "Paso 4/4: Crear usuario administrador..."
    cd "$BACKEND_DIR" && npm run create-admin
    if [ $? -ne 0 ]; then
        print_message "$YELLOW" "⚠ No se pudo crear el usuario admin automáticamente"
        print_message "$YELLOW" "  Puedes crearlo manualmente con: cd backend && npm run create-admin"
    fi
    echo ""

    # Paso 5: Instalar dependencias del frontend
    print_message "$BLUE" "Extra: Instalando dependencias del frontend..."
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        cd "$FRONTEND_DIR" && npm install
        if [ $? -ne 0 ]; then
            print_message "$RED" "✗ Error al instalar dependencias del frontend"
            return 1
        fi
        print_message "$GREEN" "✓ Dependencias del frontend instaladas"
    else
        print_message "$GREEN" "✓ Dependencias del frontend ya instaladas"
    fi

    # Instalar dependencias adicionales del diseño (si no están instaladas)
    print_message "$BLUE" "Verificando dependencias del diseño..."
    cd "$FRONTEND_DIR"
    if ! npm list lucide-react > /dev/null 2>&1; then
        print_message "$YELLOW" "Instalando dependencias del diseño Azure Clean..."
        npm install lucide-react @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-avatar framer-motion > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_message "$GREEN" "✓ Dependencias del diseño instaladas"
        else
            print_message "$YELLOW" "⚠ Error al instalar dependencias del diseño (no crítico)"
        fi
    else
        print_message "$GREEN" "✓ Dependencias del diseño ya instaladas"
    fi
    echo ""

    print_message "$GREEN" "=== Configuración completada ==="
    echo ""
    print_message "$BLUE" "Ya puedes iniciar el sistema con:"
    echo "  $0 start"
    echo ""
}

# Script principal
case "$1" in
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
        get_status
        ;;
    logs)
        logs "$2"
        ;;
    setup)
        setup
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs|setup}"
        echo ""
        echo "Comandos:"
        echo "  setup    - Configuración inicial interactiva (primera vez)"
        echo "  start    - Inicia el backend y el frontend"
        echo "  stop     - Detiene el backend y el frontend"
        echo "  restart  - Reinicia ambos servicios"
        echo "  status   - Muestra el estado actual"
        echo "  logs     - Muestra logs en tiempo real (backend|frontend)"
        echo ""
        echo "Ejemplos:"
        echo "  $0 setup              # Primera vez: configuración completa"
        echo "  $0 start              # Iniciar el sistema"
        echo "  $0 status             # Ver estado"
        echo "  $0 logs backend       # Ver logs del backend"
        exit 1
        ;;
esac

exit 0
