#!/bin/bash

# Script de instalación de servidor Minecraft Paper
# Autor: GitHub Copilot
# Fecha: 2026-02-10

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Verificar dependencias
check_dependencies() {
    local missing_deps=()
    
    for cmd in curl jq java; do
        if ! command -v $cmd &> /dev/null; then
            missing_deps+=($cmd)
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Faltan dependencias: ${missing_deps[*]}"
        print_info "Instala las dependencias faltantes:"
        print_info "  curl: sudo apt install curl"
        print_info "  jq: sudo apt install jq"
        print_info "  java: sudo apt install openjdk-21-jre-headless"
        exit 1
    fi
}

# Obtener versiones de Paper desde 1.19
get_paper_versions() {
    versions=$(curl -s "https://api.papermc.io/v2/projects/paper" | jq -r '.versions[]' | awk -F. '{if ($2 >= 19) print}')
    
    if [ -z "$versions" ]; then
        return 1
    fi
    
    echo "$versions"
}

# Mostrar menú de versiones
select_version() {
    local versions=("$@")
    
    # Filtrar versiones vacías
    local filtered_versions=()
    for v in "${versions[@]}"; do
        if [ ! -z "$v" ]; then
            filtered_versions+=("$v")
        fi
    done
    
    if [ ${#filtered_versions[@]} -eq 0 ]; then
        print_error "No se encontraron versiones disponibles"
        exit 1
    fi
    
    echo "" >&2
    print_info "Versiones disponibles de Minecraft Paper (desde 1.19):" >&2
    echo "" >&2
    
    local i=1
    for version in "${filtered_versions[@]}"; do
        echo "  $i) $version" >&2
        ((i++))
    done
    
    echo "" >&2
    read -p "Selecciona el número de versión [1-${#filtered_versions[@]}]: " selection >&2
    
    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "${#filtered_versions[@]}" ]; then
        print_error "Selección inválida"
        exit 1
    fi
    
    echo "${filtered_versions[$((selection-1))]}"
}

# Obtener último build de una versión
get_latest_build() {
    local version=$1
    
    print_info "Obteniendo último build para la versión $version..." >&2
    
    build=$(curl -s "https://api.papermc.io/v2/projects/paper/versions/$version" | jq -r '.builds[-1]')
    
    if [ -z "$build" ] || [ "$build" = "null" ]; then
        print_error "No se pudo obtener el build para la versión $version"
        exit 1
    fi
    
    echo "$build"
}

# Descargar Paper
download_paper() {
    local version=$1
    local build=$2
    local dir=$3
    
    local filename="paper-${version}-${build}.jar"
    local url="https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${build}/downloads/${filename}"
    
    print_info "Descargando Paper ${version} (build ${build})..." >&2
    
    if curl -L -o "${dir}/${filename}" --progress-bar "$url"; then
        # Renombrar a paper.jar para facilitar actualizaciones
        mv "${dir}/${filename}" "${dir}/paper.jar"
        print_success "Paper descargado exitosamente: paper.jar (${version}-${build})" >&2
        echo "paper.jar"
    else
        print_error "Error al descargar Paper" >&2
        exit 1
    fi
}

# Descargar plugin ViaVersion
download_viaversion() {
    local plugins_dir=$1
    
    print_info "Descargando ViaVersion desde Hangar..."
    
    # Obtener URL de descarga de la última versión
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/ViaVersion/ViaVersion/versions" | jq -r '.result[0].downloads.PAPER.downloadUrl' 2>/dev/null)
    
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de descarga desde Hangar API"
        print_info "Descarga manual desde: https://hangar.papermc.io/ViaVersion/ViaVersion"
        return 1
    fi
    
    if curl -L -o "${plugins_dir}/ViaVersion.jar" --progress-bar "$download_url" 2>/dev/null; then
        print_success "ViaVersion descargado"
    else
        print_warning "No se pudo descargar ViaVersion desde Hangar"
        print_info "Descarga manual desde: https://hangar.papermc.io/ViaVersion/ViaVersion"
    fi
}

# Descargar plugin ViaBackwards
download_viabackwards() {
    local plugins_dir=$1
    
    print_info "Descargando ViaBackwards desde Hangar..."
    
    # Obtener URL de descarga de la última versión
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/ViaVersion/ViaBackwards/versions" | jq -r '.result[0].downloads.PAPER.downloadUrl' 2>/dev/null)
    
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de descarga desde Hangar API"
        print_info "Descarga manual desde: https://hangar.papermc.io/ViaVersion/ViaBackwards"
        return 1
    fi
    
    if curl -L -o "${plugins_dir}/ViaBackwards.jar" --progress-bar "$download_url" 2>/dev/null; then
        print_success "ViaBackwards descargado"
    else
        print_warning "No se pudo descargar ViaBackwards desde Hangar"
        print_info "Descarga manual desde: https://hangar.papermc.io/ViaVersion/ViaBackwards"
    fi
}

# Descargar plugin ProtocolLib
download_protocollib() {
    local plugins_dir=$1
    
    print_info "Descargando ProtocolLib desde GitHub..."
    
    # Obtener URL de descarga de la última versión desde Hangar (apunta a GitHub)
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/dmulloy2/ProtocolLib/versions" | jq -r '.result[0].downloads.PAPER.externalUrl' 2>/dev/null)
    
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de descarga desde Hangar API"
        print_info "Descarga manual desde: https://github.com/dmulloy2/ProtocolLib/releases"
        return 1
    fi
    
    if curl -L -o "${plugins_dir}/ProtocolLib.jar" --progress-bar "$download_url" 2>/dev/null; then
        print_success "ProtocolLib descargado"
    else
        print_warning "No se pudo descargar ProtocolLib"
        print_info "Descarga manual desde: https://github.com/dmulloy2/ProtocolLib/releases"
    fi
}

# Descargar plugin Vault (VaultUnlocked - fork moderno compatible)
download_vault() {
    local plugins_dir=$1
    
    print_info "Descargando VaultUnlocked desde Hangar..."
    
    # Obtener URL de descarga de la última versión (fork moderno de Vault)
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/TNE/VaultUnlocked/versions" | jq -r '.result[0].downloads.PAPER.downloadUrl' 2>/dev/null)
    
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de descarga desde Hangar API"
        print_info "Descarga manual desde: https://hangar.papermc.io/TNE/VaultUnlocked"
        return 1
    fi
    
    if curl -L -o "${plugins_dir}/VaultUnlocked.jar" --progress-bar "$download_url" 2>/dev/null; then
        print_success "VaultUnlocked descargado (compatible con Vault API)"
    else
        print_warning "No se pudo descargar VaultUnlocked desde Hangar"
        print_info "Descarga manual desde: https://hangar.papermc.io/TNE/VaultUnlocked"
    fi
}

# Descargar plugin Geyser
download_geyser() {
    local plugins_dir=$1
    
    print_info "Descargando Geyser desde GeyserMC..."
    
    # Obtener URL de descarga de la última versión (apunta a download.geysermc.org)
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/GeyserMC/Geyser/versions" | jq -r '.result[0].downloads.PAPER.externalUrl' 2>/dev/null)
    
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de descarga desde Hangar API"
        print_info "Descarga manual desde: https://geysermc.org/download"
        return 1
    fi
    
    if curl -L -o "${plugins_dir}/Geyser-Spigot.jar" --progress-bar "$download_url" 2>/dev/null; then
        print_success "Geyser descargado"
    else
        print_warning "No se pudo descargar Geyser"
        print_info "Descarga manual desde: https://geysermc.org/download"
    fi
    
    # Descargar Floodgate (complemento de Geyser)
    print_info "Descargando Floodgate desde GeyserMC..."
    
    local floodgate_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/GeyserMC/Floodgate/versions" | jq -r '.result[0].downloads.PAPER.externalUrl' 2>/dev/null)
    
    if [ -z "$floodgate_url" ] || [ "$floodgate_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de descarga desde Hangar API"
        print_info "Descarga manual desde: https://geysermc.org/download"
        return 1
    fi
    
    if curl -L -o "${plugins_dir}/floodgate-spigot.jar" --progress-bar "$floodgate_url" 2>/dev/null; then
        print_success "Floodgate descargado"
    else
        print_warning "No se pudo descargar Floodgate"
        print_info "Descarga manual desde: https://geysermc.org/download"
    fi
}

# Crear eula.txt
create_eula() {
    local dir=$1
    
    cat > "${dir}/eula.txt" << 'EOF'
# By changing the setting below to TRUE you are indicating your agreement to our EULA (https://aka.ms/MinecraftEULA).
# Fecha: $(date)
eula=true
EOF
    
    print_success "EULA aceptado automáticamente"
}

# Crear server.properties básico
create_server_properties() {
    local dir=$1
    
    cat > "${dir}/worlds/mundo/server.properties" << 'EOF'
# Configuración del servidor Minecraft Paper
enable-jmx-monitoring=false
rcon.port=25575
level-seed=
gamemode=survival
enable-command-block=true
enable-query=false
generator-settings={}
enforce-secure-profile=true
level-name=world
motd=Servidor Minecraft Paper
query.port=25565
pvp=true
generate-structures=true
max-chained-neighbor-updates=1000000
difficulty=easy
network-compression-threshold=256
max-tick-time=60000
require-resource-pack=false
use-native-transport=true
max-players=20
online-mode=true
enable-status=true
allow-flight=false
initial-disabled-packs=
broadcast-rcon-to-ops=true
view-distance=10
server-ip=
resource-pack-prompt=
allow-nether=true
server-port=25565
enable-rcon=true
rcon.password=minecraft
sync-chunk-writes=true
op-permission-level=4
prevent-proxy-connections=false
hide-online-players=false
resource-pack=
entity-broadcast-range-percentage=100
simulation-distance=10
player-idle-timeout=0
force-gamemode=false
rate-limit=0
hardcore=false
white-list=false
broadcast-console-to-ops=true
spawn-npcs=true
spawn-animals=true
function-permission-level=2
initial-enabled-packs=vanilla
level-type=minecraft\:normal
text-filtering-config=
spawn-monsters=true
enforce-whitelist=false
spawn-protection=16
resource-pack-sha1=
max-world-size=29999984
EOF
    
    print_success "Archivo server.properties creado"
}

# Crear manage-control.sh
create_management_script() {
    local dir=$1
    local jar_file=$2
    
    cat > "${dir}/manage-control.sh" <<EOFSCRIPT
#!/bin/bash

# Script de gestión del servidor Minecraft Paper
# Comandos: start, stop, restart, logs, status

set -e

# Configuración
SERVER_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
JAR_FILE="${jar_file}"
PID_FILE="\${SERVER_DIR}/server.pid"
LOG_FILE="\${SERVER_DIR}/logs/latest.log"
MIN_RAM="1G"
MAX_RAM="4G"

# Colores
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

print_info() { echo -e "\${BLUE}[INFO]\${NC} \$1"; }
print_success() { echo -e "\${GREEN}[✓]\${NC} \$1"; }
print_warning() { echo -e "\${YELLOW}[!]\${NC} \$1"; }
print_error() { echo -e "\${RED}[✗]\${NC} \$1"; }

# Verificar si el servidor está corriendo
is_running() {
    if [ -f "\$PID_FILE" ]; then
        local pid=\$(cat "\$PID_FILE")
        if ps -p "\$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "\$PID_FILE"
        fi
    fi
    return 1
}

# Iniciar servidor
start_server() {
    cd "\$SERVER_DIR"
    
    if is_running; then
        print_warning "El servidor ya está corriendo (PID: \$(cat "\$PID_FILE"))"
        return 1
    fi
    
    print_info "Iniciando servidor Minecraft Paper..."
    
    # Crear directorio de logs si no existe
    mkdir -p logs
    
    # Iniciar servidor con nohup
    nohup java -Xms\${MIN_RAM} -Xmx\${MAX_RAM} \\
        -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 \\
        -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch \\
        -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M \\
        -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 \\
        -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 \\
        -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 \\
        -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 \\
        -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true \\
        -jar "\$JAR_FILE" nogui > /dev/null 2>&1 &
    
    local pid=\$!
    echo \$pid > "\$PID_FILE"
    
    sleep 3
    
    if is_running; then
        print_success "Servidor iniciado en segundo plano (PID: \$pid)"
        print_info "Logs en: \$LOG_FILE"
        print_info "Usa './manage-control.sh logs' para ver los logs en tiempo real"
        print_info "Usa './manage-control.sh status' para ver el estado"
    else
        print_error "Error al iniciar el servidor"
        rm -f "\$PID_FILE"
        return 1
    fi
}

# Detener servidor
stop_server() {
    if ! is_running; then
        print_warning "El servidor no está corriendo"
        rm -f "\$PID_FILE"
        return 1
    fi
    
    local pid=\$(cat "\$PID_FILE")
    print_info "Deteniendo servidor (PID: \$pid)..."
    
    # Intentar detener el servidor limpiamente
    # Nota: Para un stop limpio, necesitarías RCON. Este método fuerza el cierre.
    print_warning "Enviando señal de terminación..."
    kill "\$pid" 2>/dev/null || true
    
    # Esperar a que se detenga
    local timeout=30
    local count=0
    while ps -p "\$pid" > /dev/null 2>&1 && [ \$count -lt \$timeout ]; do
        sleep 1
        ((count++))
    done
    
    if ps -p "\$pid" > /dev/null 2>&1; then
        print_warning "Forzando cierre..."
        kill -9 "\$pid" 2>/dev/null || true
        sleep 2
    fi
    
    rm -f "\$PID_FILE"
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
    if [ ! -f "\$LOG_FILE" ]; then
        print_error "No se encontró el archivo de logs: \$LOG_FILE"
        print_info "El servidor debe estar corriendo o haber sido ejecutado al menos una vez"
        return 1
    fi
    
    print_info "Mostrando logs en tiempo real (Ctrl+C para salir)"
    print_info "El servidor continuará ejecutándose al salir"
    echo ""
    tail -f "\$LOG_FILE"
}

# Estado del servidor
status_server() {
    if is_running; then
        local pid=\$(cat "\$PID_FILE")
        print_success "El servidor está corriendo"
        echo "  PID: \$pid"
        
        # Obtener uso de memoria
        if command -v ps &> /dev/null; then
            local mem=\$(ps -p \$pid -o rss= 2>/dev/null | awk '{print int(\$1/1024)" MB"}')
            if [ ! -z "\$mem" ]; then
                echo "  Memoria: \$mem"
            fi
            
            # Obtener tiempo de ejecución
            local uptime=\$(ps -p \$pid -o etime= 2>/dev/null | xargs)
            if [ ! -z "\$uptime" ]; then
                echo "  Tiempo activo: \$uptime"
            fi
        fi
        
        echo "  Logs: \$LOG_FILE"
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
    echo "  PID: \$PID_FILE"
    echo "  Logs: \$LOG_FILE"
}

# Main
main() {
    case "\${1:-help}" in
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
            print_error "Comando desconocido: \$1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "\$@"
EOFSCRIPT
    
    chmod +x "${dir}/manage-control.sh"
    
    print_success "Script de gestión creado: manage-control.sh"
}

# Script principal
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   Instalador de Servidor Minecraft Paper               ║"
    echo "║   Versión 1.0 - GitHub Copilot                         ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    
    # Verificar dependencias
    check_dependencies
    
    # Obtener versiones disponibles
    print_info "Obteniendo versiones disponibles de Paper..."
    versions_raw=$(get_paper_versions)
    
    if [ -z "$versions_raw" ]; then
        print_error "No se pudieron obtener las versiones de Paper"
        print_info "Verifica tu conexión a internet y que curl/jq estén instalados"
        exit 1
    fi
    
    # Convertir a array, filtrando líneas vacías
    mapfile -t versions < <(echo "$versions_raw" | grep -E '^[0-9]+\.[0-9]+' | sort -V)
    
    if [ ${#versions[@]} -eq 0 ]; then
        print_error "No se encontraron versiones válidas"
        exit 1
    fi
    
    # Seleccionar versión
    selected_version=$(select_version "${versions[@]}")
    print_success "Versión seleccionada: $selected_version"
    
    # Obtener último build
    build=$(get_latest_build "$selected_version")
    print_success "Build seleccionado: $build"
    
    # Crear directorio del servidor
    SERVER_DIR="./server"
    if [ -d "$SERVER_DIR" ]; then
        print_warning "El directorio 'server' ya existe"
        read -p "¿Deseas continuar? Esto sobrescribirá archivos existentes [s/N]: " confirm
        if [[ ! "$confirm" =~ ^[sS]$ ]]; then
            print_info "Instalación cancelada"
            exit 0
        fi
    fi
    
    mkdir -p "$SERVER_DIR"
    PLUGINS_DIR="${SERVER_DIR}/plugins"
    mkdir -p "$PLUGINS_DIR"
    
    # Crear estructura de mundos
    WORLDS_DIR="${SERVER_DIR}/worlds"
    MUNDO_DIR="${WORLDS_DIR}/mundo"
    mkdir -p "${MUNDO_DIR}/world"
    mkdir -p "${MUNDO_DIR}/world_nether"
    mkdir -p "${MUNDO_DIR}/world_the_end"
    
    # Crear symlink active -> mundo
    cd "${WORLDS_DIR}" && ln -sf mundo active && cd - > /dev/null
    
    print_success "Directorios creados: server/, plugins/ y estructura de mundos"
    
    # Descargar Paper
    jar_file=$(download_paper "$selected_version" "$build" "$SERVER_DIR")
    
    # Preguntar por plugins de compatibilidad
    echo ""
    read -p "¿Deseas descargar ViaVersion + ViaBackwards (compatibilidad con todas las versiones)? [s/N]: " install_via
    if [[ "$install_via" =~ ^[sS]$ ]]; then
        download_viaversion "$PLUGINS_DIR"
        download_viabackwards "$PLUGINS_DIR"
    fi
    
    # Preguntar por ProtocolLib
    echo ""
    read -p "¿Deseas descargar ProtocolLib (requerido por muchos plugins)? [s/N]: " install_protocol
    if [[ "$install_protocol" =~ ^[sS]$ ]]; then
        download_protocollib "$PLUGINS_DIR"
    fi
    
    # Preguntar por Vault
    echo ""
    read -p "¿Deseas descargar Vault (sistema de economía y permisos)? [s/N]: " install_vault
    if [[ "$install_vault" =~ ^[sS]$ ]]; then
        download_vault "$PLUGINS_DIR"
    fi
    
    # Preguntar por Geyser
    echo ""
    read -p "¿Deseas descargar Geyser + Floodgate (compatibilidad Bedrock/Java)? [s/N]: " install_geyser
    if [[ "$install_geyser" =~ ^[sS]$ ]]; then
        download_geyser "$PLUGINS_DIR"
    fi
    
    # Crear archivos de configuración
    echo ""
    print_info "Creando archivos de configuración..."
    create_eula "$SERVER_DIR"
    create_server_properties "$SERVER_DIR"
    
    # Crear symlinks en la raíz del servidor
    cd "$SERVER_DIR"
    ln -sf worlds/active/server.properties server.properties
    ln -sf worlds/active/world world
    ln -sf worlds/active/world_nether world_nether
    ln -sf worlds/active/world_the_end world_the_end
    cd - > /dev/null
    
    print_success "Symlinks creados para mundos y configuración"
    
    # Crear script de gestión
    create_management_script "$SERVER_DIR" "$jar_file"
    
    # Resumen final
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   ✓ Instalación completada exitosamente               ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    print_success "Servidor Minecraft Paper instalado correctamente"
    echo ""
    print_info "Resumen de la instalación:"
    echo "  • Versión: Paper $selected_version (build $build)"
    echo "  • Directorio: $SERVER_DIR"
    echo "  • JAR: $jar_file (paper-$selected_version-$build)"
    echo "  • Plugins instalados:"
    if [[ "$install_via" =~ ^[sS]$ ]]; then
        echo "    - ViaVersion (compatibilidad versiones nuevas)"
        echo "    - ViaBackwards (compatibilidad versiones antiguas)"
    fi
    if [[ "$install_protocol" =~ ^[sS]$ ]]; then
        echo "    - ProtocolLib (biblioteca de protocolos)"
    fi
    if [[ "$install_geyser" =~ ^[sS]$ ]]; then
        echo "    - Geyser (compatibilidad Bedrock)"
        echo "    - Floodgate (complemento de Geyser)"
    fi
    echo ""
    print_info "Próximos pasos:"
    echo "  1. cd server"
    echo "  2. ./manage-control.sh start     # Iniciar servidor"
    echo "  3. ./manage-control.sh logs      # Ver logs (Ctrl+C para salir)"
    echo "  4. ./manage-control.sh status    # Ver estado del servidor"
    echo ""
    print_info "El servidor RCON está habilitado en el puerto 25575, contraseña: minecraft"
    echo ""
}

# Ejecutar script principal
main
