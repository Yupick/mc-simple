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
PYTHON_BACKEND_DIR="$WEB_MANAGER_DIR/backend-python"

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

    if [ -f "$WEB_MANAGER_DIR/python-manager.sh" ]; then
        cd "$WEB_MANAGER_DIR"
        ./python-manager.sh stop
        echo ""
    else
        print_message "$YELLOW" "⚠ Script python-manager.sh no encontrado"
    fi
}

# Función para actualizar dependencias Python
update_dependencies() {
    print_message "$BLUE" "=== Actualizando Dependencias Python ==="
    echo ""

    if [ ! -f "$WEB_MANAGER_DIR/python-manager.sh" ]; then
        print_message "$YELLOW" "⚠ Script python-manager.sh no encontrado, omitiendo actualización"
        return 0
    fi

    cd "$PYTHON_BACKEND_DIR"

    # Verificar que existe venv
    if [ ! -d "venv" ]; then
        print_message "$YELLOW" "⚠ Entorno virtual no encontrado"
        print_message "$BLUE" "Ejecutando setup..."
        cd "$WEB_MANAGER_DIR"
        ./python-manager.sh setup
        if [ $? -ne 0 ]; then
            print_message "$RED" "✗ Error en setup del entorno Python"
            return 1
        fi
        return 0
    fi

    # Actualizar dependencias Python
    print_message "$BLUE" "Actualizando dependencias Python..."
    venv/bin/pip install --upgrade pip
    venv/bin/pip install -r requirements.txt --upgrade

    if [ $? -ne 0 ]; then
        print_message "$YELLOW" "⚠ Error al actualizar dependencias Python (no crítico)"
    else
        print_message "$GREEN" "✓ Dependencias Python actualizadas"
    fi

    echo ""
    print_message "$GREEN" "✓ Sistema Python actualizado (no requiere compilación)"
    return 0
}

# Función para reiniciar el sistema
start_system() {
    print_message "$BLUE" "=== Reiniciando Sistema ==="
    echo ""

    if [ ! -f "$WEB_MANAGER_DIR/python-manager.sh" ]; then
        print_message "$YELLOW" "⚠ Script python-manager.sh no encontrado"
        return 1
    fi

    cd "$WEB_MANAGER_DIR"

    print_message "$BLUE" "Iniciando servidor Python FastAPI..."
    ./python-manager.sh start

    if [ $? -eq 0 ]; then
        echo ""
        print_message "$GREEN" "✓ Sistema iniciado correctamente"
        print_message "$BLUE" "  URL: http://localhost:8000"
        print_message "$BLUE" "  Docs: http://localhost:8000/docs"
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
            # Solo actualizar dependencias sin actualizar código
            print_message "$BLUE" "Procediendo solo con actualización de dependencias..."
            echo ""
            stop_system
            update_dependencies
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

    # Actualizar dependencias Python
    if ! update_dependencies; then
        print_message "$RED" "✗ Error actualizando dependencias"
        print_message "$YELLOW" "El código fue actualizado pero la actualización de dependencias falló"
        print_message "$YELLOW" "Revisa los errores e intenta manualmente con:"
        echo "  cd minecraft-web-manager"
        echo "  ./python-manager.sh setup"
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
