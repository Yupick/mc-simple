#!/bin/bash

# Cliente RCON para Minecraft Server
# Permite enviar comandos al servidor de forma remota

# Configuración
RCON_HOST="${RCON_HOST:-localhost}"
RCON_PORT="${RCON_PORT:-25575}"
RCON_PASSWORD="${RCON_PASSWORD:-minecraft}"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Verificar dependencias
check_dependencies() {
    if ! command -v mcrcon &> /dev/null; then
        print_error "mcrcon no está instalado"
        print_info "Para instalar: sudo apt update && sudo apt install -y mcrcon"
        print_info "O descarga desde: https://github.com/Tiiffi/mcrcon"
        exit 1
    fi
}

# Enviar comando único
send_command() {
    local cmd="$1"
    mcrcon -H "$RCON_HOST" -P "$RCON_PORT" -p "$RCON_PASSWORD" "$cmd" 2>/dev/null
}

# Modo interactivo
interactive_mode() {
    print_info "Cliente RCON - Modo Interactivo"
    print_info "Servidor: ${RCON_HOST}:${RCON_PORT}"
    print_info "Escribe 'exit' o 'quit' para salir"
    echo ""
    
    # Verificar conexión
    if ! send_command "list" &>/dev/null; then
        print_error "No se pudo conectar al servidor RCON"
        print_info "Verifica que:"
        print_info "  1. El servidor esté corriendo"
        print_info "  2. RCON esté habilitado en server.properties"
        print_info "  3. La contraseña sea correcta (actual: $RCON_PASSWORD)"
        exit 1
    fi
    
    print_success "Conectado al servidor"
    echo ""
    
    while true; do
        read -e -p "rcon> " command
        
        if [ -z "$command" ]; then
            continue
        fi
        
        if [ "$command" = "exit" ] || [ "$command" = "quit" ]; then
            print_info "Desconectando..."
            break
        fi
        
        result=$(send_command "$command")
        if [ ! -z "$result" ]; then
            echo "$result"
        fi
    done
}

# Mostrar ayuda
show_help() {
    cat << EOF
Cliente RCON para Minecraft Server

Uso: $0 [opciones] [comando]

Opciones:
  -h, --host HOST      Host del servidor (default: localhost)
  -p, --port PORT      Puerto RCON (default: 25575)
  -P, --password PASS  Contraseña RCON (default: minecraft)
  -i, --interactive    Modo interactivo
  -?, --help           Mostrar esta ayuda

Variables de entorno:
  RCON_HOST            Host del servidor
  RCON_PORT            Puerto RCON
  RCON_PASSWORD        Contraseña RCON

Ejemplos:
  # Modo interactivo
  $0 -i

  # Enviar comando único
  $0 "list"
  $0 "say Hola desde RCON"
  
  # Conectar a servidor remoto
  $0 -h 192.168.1.100 -P mipassword "list"
  
  # Usar variables de entorno
  export RCON_HOST=192.168.1.100
  export RCON_PASSWORD=mipassword
  $0 -i

Comandos útiles de Minecraft:
  list                         - Lista jugadores conectados
  say <mensaje>                - Enviar mensaje a todos
  stop                         - Detener servidor
  save-all                     - Guardar mundo
  whitelist add <jugador>      - Añadir a whitelist
  op <jugador>                 - Dar permisos de operador
  deop <jugador>               - Quitar permisos de operador
  gamemode <modo> <jugador>    - Cambiar modo de juego
  weather <clear|rain|thunder> - Cambiar clima
  time set <day|night>         - Cambiar hora
  difficulty <peaceful|easy|normal|hard> - Cambiar dificultad

EOF
}

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            RCON_HOST="$2"
            shift 2
            ;;
        -p|--port)
            RCON_PORT="$2"
            shift 2
            ;;
        -P|--password)
            RCON_PASSWORD="$2"
            shift 2
            ;;
        -i|--interactive)
            INTERACTIVE=1
            shift
            ;;
        -\?|--help)
            show_help
            exit 0
            ;;
        *)
            COMMAND="$*"
            break
            ;;
    esac
done

# Main
check_dependencies

if [ ! -z "$INTERACTIVE" ]; then
    interactive_mode
elif [ ! -z "$COMMAND" ]; then
    result=$(send_command "$COMMAND")
    if [ ! -z "$result" ]; then
        echo "$result"
    fi
else
    show_help
fi
