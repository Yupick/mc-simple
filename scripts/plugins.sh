#!/bin/bash

# Funciones compartidas para descargar/actualizar plugins (no ejecuta nada por sí mismo)
# Estas funciones esperan que el script que las sourcee defina `print_info`/`print_success`/`print_warning`.

download_viaversion() {
    local plugins_dir=$1
    print_info "Descargando ViaVersion desde Hangar..."
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/ViaVersion/ViaVersion/versions" | jq -r '.result[0].downloads.PAPER.downloadUrl' 2>/dev/null)
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de ViaVersion desde Hangar"
        return 1
    fi
    curl -L -o "${plugins_dir}/ViaVersion.jar" --progress-bar "$download_url" 2>/dev/null && print_success "ViaVersion actualizado" || print_warning "Fallo al descargar ViaVersion"
}

download_viabackwards() {
    local plugins_dir=$1
    print_info "Descargando ViaBackwards desde Hangar..."
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/ViaVersion/ViaBackwards/versions" | jq -r '.result[0].downloads.PAPER.downloadUrl' 2>/dev/null)
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de ViaBackwards desde Hangar"
        return 1
    fi
    curl -L -o "${plugins_dir}/ViaBackwards.jar" --progress-bar "$download_url" 2>/dev/null && print_success "ViaBackwards actualizado" || print_warning "Fallo al descargar ViaBackwards"
}

download_protocollib() {
    local plugins_dir=$1
    print_info "Descargando ProtocolLib desde Hangar/GitHub..."
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/dmulloy2/ProtocolLib/versions" | jq -r '.result[0].downloads.PAPER.externalUrl' 2>/dev/null)
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de ProtocolLib desde Hangar"
        return 1
    fi
    curl -L -o "${plugins_dir}/ProtocolLib.jar" --progress-bar "$download_url" 2>/dev/null && print_success "ProtocolLib actualizado" || print_warning "Fallo al descargar ProtocolLib"
}

download_vault() {
    local plugins_dir=$1
    print_info "Descargando VaultUnlocked desde Hangar..."
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/TNE/VaultUnlocked/versions" | jq -r '.result[0].downloads.PAPER.downloadUrl' 2>/dev/null)
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de VaultUnlocked desde Hangar"
        return 1
    fi
    curl -L -o "${plugins_dir}/VaultUnlocked.jar" --progress-bar "$download_url" 2>/dev/null && print_success "VaultUnlocked actualizado" || print_warning "Fallo al descargar VaultUnlocked"
}

download_geyser() {
    local plugins_dir=$1
    print_info "Descargando Geyser desde Hangar..."
    local download_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/GeyserMC/Geyser/versions" | jq -r '.result[0].downloads.PAPER.externalUrl' 2>/dev/null)
    if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de Geyser desde Hangar"
    else
        curl -L -o "${plugins_dir}/Geyser-Spigot.jar" --progress-bar "$download_url" 2>/dev/null && print_success "Geyser actualizado" || print_warning "Fallo al descargar Geyser"
    fi
    # Floodgate
    print_info "Descargando Floodgate desde Hangar..."
    local floodgate_url=$(curl -s "https://hangar.papermc.io/api/v1/projects/GeyserMC/Floodgate/versions" | jq -r '.result[0].downloads.PAPER.externalUrl' 2>/dev/null)
    if [ -z "$floodgate_url" ] || [ "$floodgate_url" = "null" ]; then
        print_warning "No se pudo obtener la URL de Floodgate desde Hangar"
    else
        curl -L -o "${plugins_dir}/floodgate-spigot.jar" --progress-bar "$floodgate_url" 2>/dev/null && print_success "Floodgate actualizado" || print_warning "Fallo al descargar Floodgate"
    fi
}

# Actualiza todos los plugins soportados en el directorio dado
update_plugins() {
    local plugins_dir=${1:-./server/plugins}
    mkdir -p "$plugins_dir"
    print_info "Actualizando plugins en: ${plugins_dir}"
    download_viaversion "$plugins_dir"
    download_viabackwards "$plugins_dir"
    download_protocollib "$plugins_dir"
    download_vault "$plugins_dir"
    download_geyser "$plugins_dir"
    print_success "Actualización de plugins completada (revisa compatibilidad)"
}
