#!/bin/bash

# Script de actualización del sistema desde GitHub
# Uso: ./update-system.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_MANAGER_DIR="$SCRIPT_DIR/minecraft-web-manager"

# Función para imprimir mensajes
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Función para verificar si hay cambios remotos
check_remote_changes() {
    print_message "$BLUE" "=== Verificando Cambios Remotos ==="
    echo ""

    cd "$SCRIPT_DIR"

    # Fetch sin merge
    print_message "$BLUE" "Descargando información del repositorio remoto..."
    git fetch origin

    # Ver si hay cambios
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})

    if [ "$LOCAL" = "$REMOTE" ]; then
        print_message "$GREEN" "✓ El sistema ya está actualizado (no hay cambios remotos)"
        echo ""
        echo "Versión actual: $(git log -1 --format='%h - %s')"
        return 1
    else
        print_message "$YELLOW" "⚠ Hay cambios disponibles en GitHub"
        echo ""
        print_message "$BLUE" "Cambios a aplicar:"
        git log --oneline $LOCAL..$REMOTE
        echo ""
        return 0
    fi
}

# Función para actualizar el código
update_code() {
    print_message "$BLUE" "=== Actualizando Código ==="
    echo ""

    cd "$SCRIPT_DIR"

    # Guardar cambios locales si existen
    if ! git diff-index --quiet HEAD --; then
        print_message "$YELLOW" "⚠ Hay cambios locales sin guardar"
        print_message "$YELLOW" "  Guardando cambios locales temporalmente..."
        git stash
        local stashed=true
    else
        local stashed=false
    fi

    # Pull
    print_message "$BLUE" "Descargando cambios desde GitHub..."
    git pull origin master

    if [ $? -ne 0 ]; then
        print_message "$RED" "✗ Error al actualizar el código"

        # Restaurar cambios guardados si los había
        if [ "$stashed" = true ]; then
            print_message "$YELLOW" "Restaurando cambios locales..."
            git stash pop
        fi

        return 1
    fi

    print_message "$GREEN" "✓ Código actualizado correctamente"
    echo ""
    print_message "$BLUE" "Versión actual: $(git log -1 --format='%h - %s')"

    # Restaurar cambios guardados si los había
    if [ "$stashed" = true ]; then
        print_message "$YELLOW" "Restaurando cambios locales..."
        git stash pop
    fi

    return 0
}

# Función para detener el sistema
stop_system() {
    print_message "$BLUE" "=== Deteniendo Sistema ==="
    echo ""

    if [ -f "$WEB_MANAGER_DIR/web-manager.sh" ]; then
        cd "$WEB_MANAGER_DIR"
        ./web-manager.sh stop
        echo ""
    else
        print_message "$YELLOW" "⚠ Script web-manager.sh no encontrado"
    fi
}

# Función para actualizar dependencias y rebuild
update_and_rebuild() {
    print_message "$BLUE" "=== Actualizando Dependencias y Rebuild ==="
    echo ""

    if [ ! -f "$WEB_MANAGER_DIR/web-manager.sh" ]; then
        print_message "$YELLOW" "⚠ Script web-manager.sh no encontrado, omitiendo rebuild"
        return 0
    fi

    cd "$WEB_MANAGER_DIR"

    # Instalar/actualizar dependencias del backend
    print_message "$BLUE" "Actualizando dependencias del backend..."
    if [ -d "backend" ]; then
        cd backend
        npm install
        if [ $? -ne 0 ]; then
            print_message "$YELLOW" "⚠ Error al actualizar dependencias del backend (no crítico)"
        else
            print_message "$GREEN" "✓ Dependencias del backend actualizadas"
        fi
        cd ..
    fi

    echo ""

    # Instalar/actualizar dependencias del frontend y rebuild
    print_message "$BLUE" "Actualizando dependencias del frontend y recompilando..."
    if [ -d "frontend" ]; then
        cd frontend
        npm install
        if [ $? -ne 0 ]; then
            print_message "$YELLOW" "⚠ Error al actualizar dependencias del frontend"
        else
            print_message "$GREEN" "✓ Dependencias del frontend actualizadas"
        fi
        cd ..
    fi

    echo ""

    # Rebuild para producción
    print_message "$BLUE" "Recompilando frontend para producción..."
    ./web-manager.sh build

    if [ $? -ne 0 ]; then
        print_message "$RED" "✗ Error al recompilar el frontend"
        return 1
    fi

    print_message "$GREEN" "✓ Frontend recompilado correctamente"
    return 0
}

# Función para reiniciar el sistema
start_system() {
    print_message "$BLUE" "=== Reiniciando Sistema ==="
    echo ""

    if [ ! -f "$WEB_MANAGER_DIR/web-manager.sh" ]; then
        print_message "$YELLOW" "⚠ Script web-manager.sh no encontrado"
        return 1
    fi

    cd "$WEB_MANAGER_DIR"

    # Preguntar modo
    print_message "$YELLOW" "¿Cómo deseas iniciar el sistema?"
    echo "  1) Producción (recomendado para servidor)"
    echo "  2) Desarrollo (para trabajar localmente)"
    echo ""
    read -p "Selecciona [1-2] (default: 1): " mode

    mode=${mode:-1}

    echo ""

    case $mode in
        1)
            print_message "$BLUE" "Iniciando en modo producción..."
            ./web-manager.sh start-prod
            ;;
        2)
            print_message "$BLUE" "Iniciando en modo desarrollo..."
            ./web-manager.sh start
            ;;
        *)
            print_message "$RED" "✗ Opción inválida"
            return 1
            ;;
    esac

    if [ $? -eq 0 ]; then
        echo ""
        print_message "$GREEN" "✓ Sistema iniciado correctamente"
        return 0
    else
        print_message "$RED" "✗ Error al iniciar el sistema"
        return 1
    fi
}

# Script principal
main() {
    print_message "$BLUE" "╔════════════════════════════════════════════╗"
    print_message "$BLUE" "║   Actualización del Sistema MC Manager    ║"
    print_message "$BLUE" "╚════════════════════════════════════════════╝"
    echo ""

    # Verificar que estamos en un repositorio git
    if [ ! -d "$SCRIPT_DIR/.git" ]; then
        print_message "$RED" "✗ Error: Este directorio no es un repositorio git"
        exit 1
    fi

    # Verificar si hay cambios remotos
    if ! check_remote_changes; then
        read -p "¿Deseas rebuild de todas formas? [s/N]: " rebuild
        if [[ ! $rebuild =~ ^[Ss]$ ]]; then
            print_message "$BLUE" "No hay nada que hacer. ¡Hasta luego!"
            exit 0
        else
            # Solo rebuild sin actualizar código
            print_message "$BLUE" "Procediendo solo con rebuild..."
            echo ""
            stop_system
            update_and_rebuild
            start_system
            exit 0
        fi
    fi

    # Confirmar actualización
    echo ""
    read -p "¿Deseas actualizar el sistema ahora? [S/n]: " confirm

    if [[ $confirm =~ ^[Nn]$ ]]; then
        print_message "$YELLOW" "Actualización cancelada"
        exit 0
    fi

    echo ""

    # Proceso de actualización
    if ! update_code; then
        print_message "$RED" "✗ Actualización fallida"
        exit 1
    fi

    echo ""

    # Detener sistema
    stop_system

    # Actualizar dependencias y rebuild
    if ! update_and_rebuild; then
        print_message "$RED" "✗ Error durante el rebuild"
        print_message "$YELLOW" "El código fue actualizado pero el rebuild falló"
        print_message "$YELLOW" "Revisa los errores e intenta manualmente con:"
        echo "  cd minecraft-web-manager"
        echo "  ./web-manager.sh build"
        exit 1
    fi

    echo ""

    # Reiniciar sistema
    start_system

    echo ""
    print_message "$GREEN" "╔════════════════════════════════════════════╗"
    print_message "$GREEN" "║   ✓ Actualización Completada Con Éxito   ║"
    print_message "$GREEN" "╚════════════════════════════════════════════╝"
    echo ""
}

# Ejecutar script principal
main
