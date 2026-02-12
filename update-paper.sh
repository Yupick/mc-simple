#!/bin/bash

# Script de actualización de Paper MC
# Actualiza el servidor Paper a la última versión o a una versión específica

set -e

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

# Verificar que existe el servidor
check_server() {
    if [ ! -d "./server" ]; then
        print_error "No se encontró el directorio del servidor"
        print_info "Ejecuta primero ./install-paper.sh"
        exit 1
    fi
}

# Detectar versión actual
detect_current_version() {
    # Buscar paper.jar o paper.jar.old, o cualquier paper-*.jar
    local jar="server/paper.jar"
    
    if [ ! -f "$jar" ]; then
        jar=$(ls server/paper-*.jar 2>/dev/null | head -n 1)
    fi
    
    if [ -z "$jar" ] || [ ! -f "$jar" ]; then
        print_error "No se encontró el JAR de Paper actual"
        print_info "Busca en server/ algún archivo .jar de Paper"
        exit 1
    fi
    
    print_info "Detectando versión desde el servidor..."
    
    # Intentar obtener versión ejecutando el JAR
    local version_info=$(cd server && java -jar $(basename "$jar") --version 2>/dev/null | head -1)
    
    if [ -z "$version_info" ]; then
        # Si no se puede ejecutar, intentar del nombre del archivo si tiene
        if [[ "$jar" =~ paper-([0-9.]+)-([0-9]+)\.jar ]]; then
            local version="${BASH_REMATCH[1]}"
            local build="${BASH_REMATCH[2]}"
            echo "${version}:${build}"
        else
            print_warning "No se pudo detectar la versión automáticamente"
            echo "unknown:0"
        fi
    else
        # Parsear output del --version
        local version=$(echo "$version_info" | grep -oP '\d+\.\d+(\.\d+)?' | head -1)
        local build=$(echo "$version_info" | grep -oP 'git-Paper-\K\d+' | head -1)
        echo "${version}:${build}"
    fi
}

# Obtener último build de una versión
get_latest_build() {
    local version=$1
    
    build=$(curl -s "https://api.papermc.io/v2/projects/paper/versions/$version" | jq -r '.builds[-1]')
    
    if [ -z "$build" ] || [ "$build" = "null" ]; then
        echo ""
    else
        echo "$build"
    fi
}

# Descargar nueva versión
download_paper() {
    local version=$1
    local build=$2
    local dir=$3
    
    local filename="paper-${version}-${build}.jar"
    local url="https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${build}/downloads/${filename}"
    
    print_info "Descargando Paper ${version} (build ${build})..."
    
    if curl -L -o "${dir}/${filename}" --progress-bar "$url"; then
        # Hacer backup del paper.jar actual si existe
        if [ -f "${dir}/paper.jar" ]; then
            mv "${dir}/paper.jar" "${dir}/paper.jar.old"
            print_info "Backup del JAR anterior guardado como paper.jar.old"
        fi
        # Renombrar el nuevo a paper.jar
        mv "${dir}/${filename}" "${dir}/paper.jar"
        echo "paper.jar"
    else
        echo ""
    fi
}

# Crear backup
create_backup() {
    local backup_dir="./backups"
    mkdir -p "$backup_dir"
    
    local date=$(date +%Y%m%d-%H%M%S)
    local backup_file="${backup_dir}/pre-update-backup-${date}.tar.gz"
    
    print_info "Creando backup del servidor..."
    
    if tar -czf "$backup_file" server/ 2>/dev/null; then
        print_success "Backup creado: $(basename $backup_file)"
        echo "$backup_file"
    else
        print_error "Error al crear backup"
        return 1
    fi
}

# Verificar si el servidor está corriendo
is_server_running() {
    screen -list | grep -q "minecraft-server"
}

# Actualizar manage-control.sh con nuevo JAR (ya no es necesario si siempre es paper.jar)
update_management_script() {
    local old_jar=$1
    local new_jar=$2
    
    # Como ahora siempre usamos paper.jar, no necesitamos actualizar nada
    # Pero verificamos que esté configurado correctamente
    if [ -f "./server/manage-control.sh" ]; then
        if ! grep -q 'JAR_FILE="paper.jar"' "./server/manage-control.sh"; then
            sed -i 's|JAR_FILE="[^"]*"|JAR_FILE="paper.jar"|g' "./server/manage-control.sh"
            print_success "Script de gestión actualizado a paper.jar"
        else
            print_info "Script de gestión ya está usando paper.jar"
        fi
    fi
}

# Main
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   Actualizador de Servidor Minecraft Paper             ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    
    # Verificar dependencias
    for cmd in curl jq tar; do
        if ! command -v $cmd &> /dev/null; then
            print_error "Falta dependencia: $cmd"
            exit 1
        fi
    done
    
    # Verificar servidor
    check_server
    
    # Detectar versión actual
    print_info "Detectando versión actual..."
    current=$(detect_current_version)
    current_version=$(echo "$current" | cut -d: -f1)
    current_build=$(echo "$current" | cut -d: -f2)
    
    print_success "Versión actual: Paper $current_version (build $current_build)"
    
    # Preguntar tipo de actualización
    echo ""
    echo "Opciones de actualización:"
    echo "  1) Actualizar a la última versión de la misma serie ($current_version)"
    echo "  2) Cambiar a otra versión de Minecraft"
    echo "  3) Cancelar"
    echo ""
    read -p "Selecciona una opción [1-3]: " option
    
    case $option in
        1)
            target_version="$current_version"
            print_info "Buscando última versión de $target_version..."
            ;;
        2)
            # Obtener versiones disponibles
            versions=$(curl -s "https://api.papermc.io/v2/projects/paper" | jq -r '.versions[]' | awk -F. '{if ($2 >= 19) print}')
            
            echo ""
            print_info "Versiones disponibles:"
            echo "$versions" | nl
            echo ""
            read -p "Ingresa el número de la versión deseada: " ver_num
            
            target_version=$(echo "$versions" | sed -n "${ver_num}p")
            
            if [ -z "$target_version" ]; then
                print_error "Versión inválida"
                exit 1
            fi
            
            print_warning "⚠️  ADVERTENCIA: Cambiar de versión puede causar problemas de compatibilidad"
            print_warning "     Asegúrate de que tus plugins sean compatibles con $target_version"
            echo ""
            read -p "¿Deseas continuar? [s/N]: " confirm
            
            if [[ ! "$confirm" =~ ^[sS]$ ]]; then
                print_info "Actualización cancelada"
                exit 0
            fi
            ;;
        3|*)
            print_info "Actualización cancelada"
            exit 0
            ;;
    esac
    
    # Obtener último build
    latest_build=$(get_latest_build "$target_version")
    
    if [ -z "$latest_build" ]; then
        print_error "No se pudo obtener información de build para $target_version"
        exit 1
    fi
    
    # Verificar si ya está actualizado
    if [ "$target_version" = "$current_version" ] && [ "$latest_build" = "$current_build" ]; then
        print_success "Ya tienes la última versión instalada!"
        exit 0
    fi
    
    print_success "Nueva versión disponible: Paper $target_version (build $latest_build)"
    
    # Confirmar actualización
    echo ""
    print_warning "Se actualizará de:"
    echo "  Paper $current_version (build $current_build)"
    print_warning "A:"
    echo "  Paper $target_version (build $latest_build)"
    echo ""
    read -p "¿Continuar con la actualización? [s/N]: " confirm
    
    if [[ ! "$confirm" =~ ^[sS]$ ]]; then
        print_info "Actualización cancelada"
        exit 0
    fi
    
    # Verificar si el servidor está corriendo
    if is_server_running; then
        print_warning "El servidor está corriendo"
        read -p "¿Deseas detenerlo para actualizar? [s/N]: " stop_confirm
        
        if [[ "$stop_confirm" =~ ^[sS]$ ]]; then
            print_info "Deteniendo servidor..."
            ./server/manage-control.sh stop
            sleep 3
        else
            print_error "No se puede actualizar con el servidor corriendo"
            exit 1
        fi
    fi
    
    # Crear backup
    echo ""
    backup_file=$(create_backup)
    
    if [ -z "$backup_file" ]; then
        print_error "No se pudo crear backup"
        read -p "¿Continuar sin backup? [s/N]: " no_backup
        
        if [[ ! "$no_backup" =~ ^[sS]$ ]]; then
            print_info "Actualización cancelada"
            exit 1
        fi
    fi
    
    # Descargar nueva versión
    echo ""
    new_jar=$(download_paper "$target_version" "$latest_build" "./server")
    
    if [ -z "$new_jar" ]; then
        print_error "Error al descargar la nueva versión"
        exit 1
    fi
    
    # Actualizar script de gestión
    update_management_script "$new_jar" "$new_jar"
    
    # El JAR antiguo ya está respaldado como paper.jar.old
    if [ -f "./server/paper.jar.old" ]; then
        print_info "JAR anterior disponible en: server/paper.jar.old"
        print_info "Puedes eliminarlo si todo funciona correctamente"
    fi
    
    # Resumen
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   ✓ Actualización completada exitosamente             ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    print_success "Servidor actualizado a Paper $target_version (build $latest_build)"
    
    if [ ! -z "$backup_file" ]; then
        print_info "Backup guardado en: $(basename $backup_file)"
    fi
    
    echo ""
    print_info "Próximos pasos:"
    echo "  1. Revisa las notas de la versión en: https://papermc.io/downloads/paper"
    echo "  2. Verifica la compatibilidad de tus plugins"
    echo "  3. Inicia el servidor: cd server && ./manage-control.sh start"
    echo "  4. Revisa los logs por errores: ./manage-control.sh logs"
    echo ""
    
    print_warning "Si algo sale mal, puedes restaurar el backup:"
    if [ ! -z "$backup_file" ]; then
        echo "  tar -xzf $(basename $backup_file)"
    fi
    
    echo ""
    read -p "¿Deseas iniciar el servidor ahora? [s/N]: " start_now
    
    if [[ "$start_now" =~ ^[sS]$ ]]; then
        print_info "Iniciando servidor..."
        cd server
        ./manage-control.sh start
    fi
}

main
