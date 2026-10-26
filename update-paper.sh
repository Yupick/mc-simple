#!/bin/bash

# Script de actualización de Paper y plugins soportados.

set -e

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
SERVER_DIR="${PROJECT_DIR}/server"
PLUGINS_DIR="${SERVER_DIR}/plugins"
BACKUP_DIR="${PROJECT_DIR}/backups"
SERVER_PID_FILE="${SERVER_DIR}/server.pid"

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

if [ ! -f "${SCRIPT_DIR}/scripts/paper-api.sh" ] ||
    [ ! -f "${SCRIPT_DIR}/scripts/plugins.sh" ]; then
    print_error "Falta un helper requerido en ${SCRIPT_DIR}/scripts/"
    exit 1
fi
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/scripts/paper-api.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/scripts/plugins.sh"

PLUGIN_BACKUP_FILE=""

check_dependencies() {
    local missing_deps=()

    for cmd in curl jq java tar unzip sha256sum; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done

    if [ "${#missing_deps[@]}" -gt 0 ]; then
        print_error "Faltan dependencias: ${missing_deps[*]}"
        print_info "Instala las dependencias con: sudo apt install curl jq openjdk-21-jre-headless tar unzip coreutils"
        return 1
    fi
}

check_server() {
    if [ ! -d "$SERVER_DIR" ]; then
        print_error "No se encontró el directorio del servidor: ${SERVER_DIR}"
        print_info "Ejecuta primero install-paper.sh"
        return 1
    fi
}

detect_current_version() {
    local jar="${SERVER_DIR}/paper.jar"
    local jar_name
    local version_info
    local version_history
    local line
    local version
    local build

    if [ ! -f "$jar" ]; then
        jar=$(find "$SERVER_DIR" -maxdepth 1 -type f -name 'paper-*.jar' -print -quit)
    fi

    if [ -z "$jar" ] || [ ! -f "$jar" ]; then
        print_error "No se encontró el JAR de Paper actual"
        return 1
    fi

    jar_name=$(basename "$jar")
    print_info "Detectando versión actual de Paper..." >&2

    version_info=$(cd "$SERVER_DIR" && java -jar "$jar_name" --version 2>&1 || true)

    while IFS= read -r line; do
        if [[ "$line" =~ (^|[^[:alnum:]_])([0-9]+\.[0-9]+(\.[0-9]+)?)-([0-9]+)-[[:xdigit:]]+([^[:alnum:]]|$) ]]; then
            version="${BASH_REMATCH[2]}"
            build="${BASH_REMATCH[4]}"
            break
        fi

        if [[ "$line" =~ git-Paper-([0-9]+) ]]; then
            build="${BASH_REMATCH[1]}"
        fi
        if [[ "$line" =~ \(MC:\ ([0-9]+\.[0-9]+(\.[0-9]+)?)\) ]]; then
            version="${BASH_REMATCH[1]}"
        fi
        if [ -n "$version" ] && [ -n "$build" ]; then
            break
        fi
    done <<< "$version_info"

    if [[ "$jar_name" =~ ^paper-([0-9.]+)-([0-9]+)\.jar$ ]]; then
        [ -n "$version" ] || version="${BASH_REMATCH[1]}"
        [ -n "$build" ] || build="${BASH_REMATCH[2]}"
    fi

    if [ -z "$version" ] && [ -r "${SERVER_DIR}/version_history.json" ]; then
        version_history=$(jq -r '.currentVersion // empty' "${SERVER_DIR}/version_history.json" 2>/dev/null || true)
        if [[ "$version_history" =~ ([0-9]+\.[0-9]+(\.[0-9]+)?)-([0-9]+) ]]; then
            version="${BASH_REMATCH[1]}"
            [ -n "$build" ] || build="${BASH_REMATCH[3]}"
            print_warning "Versión obtenida de version_history.json; podría no reflejar el JAR actual" >&2
        fi
    fi

    if [ -z "$version" ]; then
        print_error "No se pudo detectar la versión Minecraft del JAR de Paper desde la salida, el nombre ni version_history.json" >&2
        return 1
    fi

    if [ -z "$build" ]; then
        build="unknown"
    fi

    printf '%s:%s\n' "$version" "$build"
}

get_latest_build() {
    local version=$1
    paper_api_latest_stable_build "$version"
}

download_paper() {
    local version=$1
    local build_record=$2
    local dir=$3
    local build_id
    local temporary_file
    local current_jar="${dir}/paper.jar"
    local backup_jar="${dir}/paper.jar.old"

    build_id=$(printf '%s' "$build_record" | jq -er '.id')
    print_info "Descargando Paper ${version} (build ${build_id})..." >&2

    if ! temporary_file=$(paper_api_download_build "$build_record" "$dir"); then
        print_error "No se pudo descargar y validar Paper ${version} (build ${build_id})" >&2
        return 1
    fi

    if [ -f "$current_jar" ] && ! mv -f -- "$current_jar" "$backup_jar"; then
        rm -f -- "$temporary_file"
        print_error "No se pudo respaldar el JAR actual de Paper" >&2
        return 1
    fi

    if ! mv -f -- "$temporary_file" "$current_jar"; then
        rm -f -- "$temporary_file"
        if [ -f "$backup_jar" ] && [ ! -f "$current_jar" ]; then
            mv -f -- "$backup_jar" "$current_jar"
        fi
        print_error "No se pudo instalar el nuevo JAR de Paper" >&2
        return 1
    fi

    print_success "Paper instalado y validado: ${version} (build ${build_id})" >&2
    printf '%s\n' "paper.jar"
}

create_backup() {
    local target=$1
    local prefix=$2
    local timestamp
    local backup_file

    mkdir -p "$BACKUP_DIR"
    timestamp=$(date +%Y%m%d-%H%M%S)
    backup_file="${BACKUP_DIR}/${prefix}-${timestamp}.tar.gz"

    print_info "Creando backup de ${target}..." >&2
    if tar -czf "$backup_file" -C "$PROJECT_DIR" "$target" 2>/dev/null; then
        print_success "Backup creado: $(basename "$backup_file")" >&2
        printf '%s\n' "$backup_file"
    else
        rm -f -- "$backup_file"
        print_error "No se pudo crear el backup de ${target}" >&2
        return 1
    fi
}

read_server_pid() {
    local pid

    if [ ! -r "$SERVER_PID_FILE" ]; then
        return 1
    fi

    IFS= read -r pid < "$SERVER_PID_FILE" || return 1
    if [[ ! "$pid" =~ ^[1-9][0-9]*$ ]]; then
        return 1
    fi

    printf '%s\n' "$pid"
}

pid_is_running() {
    local pid=$1
    local process_state

    if ! kill -0 "$pid" 2>/dev/null; then
        return 1
    fi

    process_state=$(ps -p "$pid" -o stat= 2>/dev/null || true)
    [[ -n "$process_state" && "$process_state" != Z* ]]
}

is_server_running() {
    local pid
    pid=$(read_server_pid) || return 1
    pid_is_running "$pid"
}

stop_server_for_update() {
    local non_interactive=${1:-false}
    local pid
    local attempt

    if [ ! -e "$SERVER_PID_FILE" ]; then
        return 0
    fi

    if ! pid=$(read_server_pid); then
        print_error "El archivo server.pid existe, pero no contiene un PID válido"
        return 1
    fi

    if ! pid_is_running "$pid"; then
        rm -f -- "$SERVER_PID_FILE"
        return 0
    fi

    print_warning "El servidor está activo (PID ${pid})"
    if [[ "$non_interactive" != true ]]; then
        read -r -p "¿Deseas detenerlo antes de actualizar? [s/N]: " stop_confirm
        if [[ ! "$stop_confirm" =~ ^[sS]$ ]]; then
            print_error "Actualización cancelada: el servidor debe estar detenido"
            return 1
        fi
    fi

    if [ ! -x "${SERVER_DIR}/manage-control.sh" ]; then
        print_error "No se encontró un manage-control.sh ejecutable para detener el servidor"
        return 1
    fi

    if ! "${SERVER_DIR}/manage-control.sh" stop; then
        print_warning "manage-control.sh devolvió error; se verificará el proceso antes de continuar"
    fi

    for ((attempt = 0; attempt < 35; attempt++)); do
        if ! pid_is_running "$pid"; then
            rm -f -- "$SERVER_PID_FILE"
            print_success "Servidor detenido"
            return 0
        fi
        sleep 1
    done

    print_error "El proceso del servidor sigue activo; no se reemplazará ningún JAR"
    return 1
}

update_management_script() {
    local management_script="${SERVER_DIR}/manage-control.sh"

    if [ -f "$management_script" ] &&
        ! grep -q 'JAR_FILE="paper.jar"' "$management_script"; then
        sed -i 's|JAR_FILE="[^"]*"|JAR_FILE="paper.jar"|g' "$management_script"
        print_success "Script de gestión actualizado a paper.jar"
    fi
}

update_installed_plugins() {
    local create_plugin_backup=${1:-true}
    local plugin_backup=""

    PLUGIN_BACKUP_FILE=""

    if ! has_managed_plugins "$PLUGINS_DIR"; then
        update_plugins "$PLUGINS_DIR"
        return $?
    fi

    if ! stop_server_for_update; then
        return 1
    fi

    if [[ "$create_plugin_backup" == true ]]; then
        if ! plugin_backup=$(create_backup "server/plugins" "pre-plugin-update"); then
            return 1
        fi
    fi

    PLUGIN_BACKUP_FILE=$plugin_backup
    if ! update_plugins "$PLUGINS_DIR"; then
        return 1
    fi
}

ask_to_start_server() {
    local start_now

    if is_server_running; then
        print_info "El servidor sigue activo"
        return 0
    fi

    read -r -p "¿Deseas iniciar el servidor ahora? [s/N]: " start_now
    if [[ "$start_now" =~ ^[sS]$ ]]; then
        print_info "Iniciando servidor..."
        "${SERVER_DIR}/manage-control.sh" start
    fi
}

web_check() {
    local current
    local current_version
    local current_build
    local build_record
    local latest_build
    local versions
    local plugins

    exec 3>&1
    exec 1>&2

    check_dependencies || return 1
    check_server || return 1
    current=$(detect_current_version) || return 1
    IFS=: read -r current_version current_build <<< "$current"
    build_record=$(get_latest_build "$current_version") || return 1
    latest_build=$(printf '%s' "$build_record" | jq -er '.id') || return 1
    versions=$(paper_api_list_versions) || return 1
    plugins=$(list_managed_plugin_versions "$PLUGINS_DIR") || return 1

    jq -cn \
        --arg current_version "$current_version" \
        --arg current_build "$current_build" \
        --argjson latest_build "$latest_build" \
        --arg versions "$versions" \
        --argjson plugins "$plugins" \
        '{current:{version:$current_version,build:$current_build},latest:{version:$current_version,build:$latest_build},paper_update_available:($current_build == "unknown" or (($current_build|tonumber) < $latest_build)),versions:($versions|split("\n")),plugins:$plugins}' >&3
}

web_update() {
    local paper_requested=false
    local plugins_requested=false
    local requested_version=""
    local current=""
    local current_version=""
    local current_build="unknown"
    local target_version=""
    local build_record=""
    local latest_build=""
    local paper_update=false
    local plugin_update=false
    local plugin_update_failed=false
    local backup_target=""
    local backup_file=""
    local success=true

    exec 3>&1
    exec 1>&2

    while [ "$#" -gt 0 ]; do
        case "$1" in
            --paper) paper_requested=true ;;
            --plugins) plugins_requested=true ;;
            --version)
                shift
                [ "$#" -gt 0 ] || { print_error "Falta el valor de --version" >&2; return 2; }
                requested_version=$1
                ;;
            *) print_error "Argumento web no reconocido: $1" >&2; return 2 ;;
        esac
        shift
    done

    if [[ "$paper_requested" != true && "$plugins_requested" != true ]]; then
        print_error "Solicita --paper, --plugins o ambos" >&2
        return 2
    fi

    check_dependencies || return 1
    check_server || return 1

    if [[ "$paper_requested" == true ]]; then
        current=$(detect_current_version) || return 1
        IFS=: read -r current_version current_build <<< "$current"
        target_version=${requested_version:-$current_version}
        build_record=$(get_latest_build "$target_version") || return 1
        latest_build=$(printf '%s' "$build_record" | jq -er '.id') || return 1
        if [[ "$target_version" != "$current_version" || "$current_build" != "$latest_build" ]]; then
            paper_update=true
        fi
    fi

    PLUGIN_UPDATE_UPDATED=0
    PLUGIN_UPDATE_SKIPPED=0
    PLUGIN_UPDATE_UNCHANGED=0
    PLUGIN_UPDATE_FAILURES=0
    if [[ "$plugins_requested" == true ]] && has_managed_plugins "$PLUGINS_DIR"; then
        plugin_update=true
    fi

    if [[ "$paper_update" == true ]]; then
        backup_target="server"
    elif [[ "$plugin_update" == true ]]; then
        backup_target="server/plugins"
    fi

    if [[ -n "$backup_target" ]]; then
        stop_server_for_update true || return 1
        backup_file=$(create_backup "$backup_target" "pre-web-update") || return 1
    fi

    if [[ "$paper_update" == true ]]; then
        download_paper "$target_version" "$build_record" "$SERVER_DIR" >/dev/null || return 1
        update_management_script
    fi

    if [[ "$plugin_update" == true ]]; then
        if ! update_plugins "$PLUGINS_DIR"; then
            plugin_update_failed=true
            success=false
        fi
    fi

    jq -cn \
        --argjson success "$success" \
        --argjson paper_requested "$paper_requested" \
        --argjson paper_updated "$paper_update" \
        --arg current_version "$current_version" \
        --arg current_build "$current_build" \
        --arg target_version "$target_version" \
        --argjson target_build "${latest_build:-0}" \
        --argjson plugins_requested "$plugins_requested" \
        --argjson plugins_updated "$PLUGIN_UPDATE_UPDATED" \
        --argjson plugins_unchanged "$PLUGIN_UPDATE_UNCHANGED" \
        --argjson plugins_skipped "$PLUGIN_UPDATE_SKIPPED" \
        --argjson plugins_failed "$PLUGIN_UPDATE_FAILURES" \
        --arg backup "$backup_file" \
        '{success:$success,paper:{requested:$paper_requested,updated:$paper_updated,current_version:$current_version,current_build:$current_build,target_version:$target_version,target_build:$target_build},plugins:{requested:$plugins_requested,updated:$plugins_updated,unchanged:$plugins_unchanged,skipped:$plugins_skipped,failed:$plugins_failed},backup:$backup}' >&3

    [[ "$plugin_update_failed" != true ]]
}

main() {
    local current
    local current_version
    local current_build
    local target_version
    local versions_raw
    local ver_num
    local build_record
    local latest_build
    local latest_build_id
    local option
    local confirm
    local backup_file=""
    local new_jar
    local update_plugins_confirm
    local plugin_update_failed=0

    case "${1:-}" in
        --web-check)
            web_check
            return $?
            ;;
        --web-update)
            shift
            web_update "$@"
            return $?
            ;;
    esac

    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   Actualizador de Servidor Minecraft Paper             ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""

    check_dependencies
    check_server

    if ! current=$(detect_current_version); then
        print_error "No se puede continuar sin identificar la versión actual"
        exit 1
    fi
    IFS=: read -r current_version current_build <<< "$current"
    print_success "Versión actual: Paper ${current_version} (build ${current_build})"

    echo ""
    echo "Opciones de actualización:"
    echo "  1) Actualizar Paper a la última versión de la misma serie (${current_version})"
    echo "  2) Cambiar a otra versión de Minecraft"
    echo "  3) Actualizar solo los plugins soportados instalados"
    echo "  4) Cancelar"
    echo ""
    read -r -p "Selecciona una opción [1-3]: " option

    case $option in
        1)
            target_version="$current_version"
            ;;
        2)
            if ! versions_raw=$(paper_api_list_versions); then
                print_error "No se pudieron obtener las versiones de Paper"
                exit 1
            fi

            mapfile -t versions <<< "$versions_raw"
            print_info "Versiones disponibles:"
            printf '%s\n' "${versions[@]}" | nl
            read -r -p "Ingresa el número de la versión deseada: " ver_num

            if ! [[ "$ver_num" =~ ^[0-9]+$ ]] ||
                [ "$ver_num" -lt 1 ] ||
                [ "$ver_num" -gt "${#versions[@]}" ]; then
                print_error "Selección de versión inválida"
                exit 1
            fi

            target_version=${versions[$((ver_num - 1))]}
            print_warning "Cambiar de versión puede afectar el mundo y la compatibilidad de plugins."
            read -r -p "¿Deseas continuar? [s/N]: " confirm
            if [[ ! "$confirm" =~ ^[sS]$ ]]; then
                print_info "Cambio de versión cancelado"
                exit 0
            fi
            ;;
        3)
            if ! update_installed_plugins true; then
                if [ -n "$PLUGIN_BACKUP_FILE" ]; then
                    print_info "Backup de plugins guardado en: $(basename "$PLUGIN_BACKUP_FILE")"
                fi
                ask_to_start_server
                exit 1
            fi
            if [ -n "$PLUGIN_BACKUP_FILE" ]; then
                print_info "Backup de plugins guardado en: $(basename "$PLUGIN_BACKUP_FILE")"
            fi
            ask_to_start_server
            exit 0
            ;;
        *)
            print_info "Actualización cancelada"
            exit 0
            ;;
    esac

    if ! build_record=$(get_latest_build "$target_version"); then
        print_error "No se pudo resolver un build estable de Paper ${target_version}"
        exit 1
    fi
    latest_build_id=$(printf '%s' "$build_record" | jq -er '.id')

    if [ "$target_version" = "$current_version" ] &&
        [ "$latest_build_id" = "$current_build" ]; then
        print_success "Paper ya está en el último build estable (${latest_build_id})"
        read -r -p "¿Deseas actualizar los plugins soportados instalados? [s/N]: " update_plugins_confirm

        if [[ "$update_plugins_confirm" =~ ^[sS]$ ]]; then
            if ! update_installed_plugins true; then
                plugin_update_failed=1
            fi
            if [ -n "$PLUGIN_BACKUP_FILE" ]; then
                print_info "Backup de plugins guardado en: $(basename "$PLUGIN_BACKUP_FILE")"
            fi
            if ! is_server_running; then
                ask_to_start_server
            fi
        fi

        if [ "$plugin_update_failed" -ne 0 ]; then
            exit 1
        fi
        exit 0
    fi

    print_success "Nuevo build estable disponible: Paper ${target_version} (build ${latest_build_id})"
    echo ""
    print_warning "Se actualizará Paper ${current_version} (build ${current_build}) a ${target_version} (build ${latest_build_id})"
    read -r -p "¿Continuar con la actualización? [s/N]: " confirm
    if [[ ! "$confirm" =~ ^[sS]$ ]]; then
        print_info "Actualización cancelada"
        exit 0
    fi

    if ! stop_server_for_update; then
        exit 1
    fi

    if ! backup_file=$(create_backup "server" "pre-update-backup"); then
        read -r -p "¿Continuar sin backup? [s/N]: " confirm
        if [[ ! "$confirm" =~ ^[sS]$ ]]; then
            print_info "Actualización cancelada"
            exit 1
        fi
    fi

    if ! new_jar=$(download_paper "$target_version" "$build_record" "$SERVER_DIR"); then
        print_error "No se pudo instalar el nuevo JAR de Paper"
        exit 1
    fi

    update_management_script

    if [ -f "${SERVER_DIR}/paper.jar.old" ]; then
        print_info "JAR anterior disponible en: server/paper.jar.old"
    fi

    read -r -p "¿Deseas actualizar los plugins soportados instalados? [s/N]: " update_plugins_confirm
    if [[ "$update_plugins_confirm" =~ ^[sS]$ ]]; then
        if ! update_installed_plugins false; then
            plugin_update_failed=1
        fi
    fi

    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    if [ "$plugin_update_failed" -eq 0 ]; then
        echo "║   ✓ Actualización completada                           ║"
    else
        echo "║   ! Actualización parcial: revisar plugins              ║"
    fi
    echo "╚════════════════════════════════════════════════════════╝"
    print_success "Paper actualizado a ${target_version} (build ${latest_build_id})"

    if [ -n "$backup_file" ]; then
        print_info "Backup guardado en: $(basename "$backup_file")"
    fi
    if [ -n "$PLUGIN_BACKUP_FILE" ]; then
        print_info "Backup de plugins guardado en: $(basename "$PLUGIN_BACKUP_FILE")"
    fi

    echo ""
    print_info "Próximos pasos:"
    echo "  1. Revisa la compatibilidad de los plugins"
    echo "  2. Inicia el servidor: ./server/manage-control.sh start"
    echo "  3. Revisa los logs: ./server/manage-control.sh logs"
    echo ""

    if [ -n "$backup_file" ]; then
        print_warning "Para restaurar el backup: tar -xzf \"$backup_file\" -C \"$PROJECT_DIR\""
    fi

    ask_to_start_server

    if [ "$plugin_update_failed" -ne 0 ]; then
        exit 1
    fi
}

main "$@"
