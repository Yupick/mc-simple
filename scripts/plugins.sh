#!/bin/bash

# Funciones compartidas para instalar y actualizar los plugins soportados.
# El script que cargue este archivo debe definir print_info/print_success/print_warning.

HANGAR_API_BASE_URL="https://hangar.papermc.io/api/v1"
PLUGIN_API_USER_AGENT="mc-simple/1.0 (https://github.com/Yupick/mc-simple)"

download_plugin_artifact() {
    local plugin_name=$1
    local version=$2
    local download_url=$3
    local plugins_dir=$4
    local destination=$5
    local expected_sha256=$6
    local expected_size=$7
    local temporary_file
    local actual_size
    local actual_sha256
    local installed_sha256

    if [[ "$download_url" != https://* ]]; then
        print_warning "URL HTTPS inválida para ${plugin_name}"
        return 1
    fi

    if ! command -v unzip >/dev/null 2>&1; then
        print_warning "Falta la dependencia unzip para validar ${plugin_name}"
        return 1
    fi

    if ! command -v sha256sum >/dev/null 2>&1; then
        print_warning "Falta sha256sum para verificar ${plugin_name}"
        return 1
    fi

    mkdir -p "$plugins_dir"
    if ! temporary_file=$(mktemp "${plugins_dir}/.${plugin_name}.XXXXXX"); then
        print_warning "No se pudo crear un archivo temporal para ${plugin_name}"
        return 1
    fi

    if ! curl --fail --silent --show-error --location \
        --connect-timeout 10 --max-time 120 \
        --output "$temporary_file" "$download_url"; then
        rm -f -- "$temporary_file"
        print_warning "Falló la descarga de ${plugin_name} ${version}"
        return 1
    fi

    if [ ! -s "$temporary_file" ] || ! unzip -tq "$temporary_file" >/dev/null 2>&1; then
        rm -f -- "$temporary_file"
        print_warning "El archivo descargado de ${plugin_name} no es un JAR válido"
        return 1
    fi

    if [[ "$expected_size" =~ ^[0-9]+$ ]]; then
        actual_size=$(wc -c < "$temporary_file")
        actual_size=${actual_size//[[:space:]]/}
        if [ "$actual_size" != "$expected_size" ]; then
            rm -f -- "$temporary_file"
            print_warning "El tamaño descargado de ${plugin_name} no coincide con Hangar"
            return 1
        fi
    fi

    if [ -n "$expected_sha256" ]; then
        if [[ ! "$expected_sha256" =~ ^[[:xdigit:]]{64}$ ]] ||
            ! command -v sha256sum >/dev/null 2>&1; then
            rm -f -- "$temporary_file"
            print_warning "No se puede verificar el SHA-256 de ${plugin_name}"
            return 1
        fi

        actual_sha256=$(sha256sum "$temporary_file")
        actual_sha256=${actual_sha256%% *}
        if [ "$actual_sha256" != "$expected_sha256" ]; then
            rm -f -- "$temporary_file"
            print_warning "El SHA-256 descargado de ${plugin_name} no coincide con Hangar"
            return 1
        fi
    fi

    actual_sha256=$(sha256sum "$temporary_file")
    actual_sha256=${actual_sha256%% *}
    if [ -f "$destination" ]; then
        installed_sha256=$(sha256sum "$destination")
        installed_sha256=${installed_sha256%% *}
        if [ "$actual_sha256" = "$installed_sha256" ]; then
            rm -f -- "$temporary_file"
            print_info "${plugin_name} ya está en la última versión estable (${version})"
            return 3
        fi
    fi

    if ! chmod 0644 "$temporary_file"; then
        rm -f -- "$temporary_file"
        print_warning "No se pudieron ajustar los permisos de ${plugin_name}"
        return 1
    fi
    if ! mv -f -- "$temporary_file" "$destination"; then
        rm -f -- "$temporary_file"
        print_warning "No se pudo reemplazar el JAR de ${plugin_name}"
        return 1
    fi

    print_success "${plugin_name} ${version} instalado en $(basename "$destination")"
}

download_hangar_plugin() {
    local namespace=$1
    local project=$2
    local plugin_name=$3
    local filename=$4
    local plugins_dir=$5
    local destination=${6:-"${plugins_dir}/${filename}"}
    local metadata
    local release
    local release_count
    local version
    local artifact_data
    local download_url
    local expected_sha256
    local expected_size

    if ! metadata=$(curl --fail --silent --show-error --location \
        --connect-timeout 10 --max-time 30 \
        --header "User-Agent: ${PLUGIN_API_USER_AGENT}" \
        "${HANGAR_API_BASE_URL}/projects/${namespace}/${project}/versions?channel=Release&limit=1"); then
        print_warning "No se pudo consultar la versión estable de ${plugin_name} en Hangar"
        return 1
    fi

    if ! printf '%s' "$metadata" | jq -e \
        '(.result | type == "array") and (.pagination | type == "object")' \
        >/dev/null; then
        print_warning "Hangar devolvió metadatos inválidos para ${plugin_name}"
        return 1
    fi

    release_count=$(printf '%s' "$metadata" | jq -r '.pagination.count // 0')
    if [[ ! "$release_count" =~ ^[0-9]+$ ]]; then
        print_warning "Hangar devolvió un conteo de versiones inválido para ${plugin_name}"
        return 1
    fi

    if [ "$release_count" -eq 0 ]; then
        print_warning "No hay una versión estable de ${plugin_name}; se conserva el archivo actual"
        return 2
    fi

    if ! release=$(printf '%s' "$metadata" | jq -ce \
        '.result[0] | select(.channel.name == "Release")'); then
        print_warning "Hangar no devolvió una versión Release válida para ${plugin_name}"
        return 1
    fi

    if ! version=$(printf '%s' "$release" | jq -er '.name | select(type == "string" and length > 0)'); then
        print_warning "La versión estable de ${plugin_name} no tiene nombre"
        return 1
    fi

    if ! artifact_data=$(printf '%s' "$release" | jq -ce \
        '.downloads.PAPER | {
            url: (.downloadUrl // .externalUrl),
            sha256: (.fileInfo.sha256Hash // ""),
            size: (.fileInfo.sizeBytes // "")
        } | select(.url | type == "string" and startswith("https://"))'); then
        print_warning "La versión estable de ${plugin_name} no tiene una descarga HTTPS de Paper"
        return 1
    fi

    download_url=$(printf '%s' "$artifact_data" | jq -er '.url')
    expected_sha256=$(printf '%s' "$artifact_data" | jq -r '.sha256 // empty')
    expected_size=$(printf '%s' "$artifact_data" | jq -r '.size // empty')

    download_plugin_artifact \
        "$plugin_name" "$version" "$download_url" "$plugins_dir" "$destination" \
        "$expected_sha256" "$expected_size"
}

download_viaversion() {
    local plugins_dir=$1
    local destination=${2:-"${plugins_dir}/ViaVersion.jar"}
    download_hangar_plugin "ViaVersion" "ViaVersion" "ViaVersion" \
        "ViaVersion.jar" "$plugins_dir" "$destination"
}

download_viabackwards() {
    local plugins_dir=$1
    local destination=${2:-"${plugins_dir}/ViaBackwards.jar"}
    download_hangar_plugin "ViaVersion" "ViaBackwards" "ViaBackwards" \
        "ViaBackwards.jar" "$plugins_dir" "$destination"
}

download_protocollib() {
    local plugins_dir=$1
    local destination=${2:-"${plugins_dir}/ProtocolLib.jar"}
    download_hangar_plugin "dmulloy2" "ProtocolLib" "ProtocolLib" \
        "ProtocolLib.jar" "$plugins_dir" "$destination"
}

download_vault() {
    local plugins_dir=$1
    local destination=${2:-"${plugins_dir}/VaultUnlocked.jar"}
    download_hangar_plugin "TNE" "VaultUnlocked" "VaultUnlocked" \
        "VaultUnlocked.jar" "$plugins_dir" "$destination"
}

download_geyser() {
    local plugins_dir=$1
    local destination=${2:-"${plugins_dir}/Geyser-Spigot.jar"}
    download_hangar_plugin "GeyserMC" "Geyser" "Geyser" \
        "Geyser-Spigot.jar" "$plugins_dir" "$destination"
}

download_floodgate() {
    local plugins_dir=$1
    local destination=${2:-"${plugins_dir}/floodgate-spigot.jar"}
    download_hangar_plugin "GeyserMC" "Floodgate" "Floodgate" \
        "floodgate-spigot.jar" "$plugins_dir" "$destination"
}

update_managed_plugin() {
    local plugins_dir=$1
    local plugin_name=$2
    local filename=$3
    local download_function=$4
    local enabled_file="${plugins_dir}/${filename}"
    local disabled_file="${enabled_file}.disabled"
    local destination
    local result

    if [ -f "$enabled_file" ] && [ -f "$disabled_file" ]; then
        print_warning "Hay dos archivos de ${plugin_name}; se omite para evitar sobrescribir uno"
        PLUGIN_UPDATE_FAILURES=$((PLUGIN_UPDATE_FAILURES + 1))
        return 0
    fi

    if [ -f "$enabled_file" ]; then
        destination=$enabled_file
    elif [ -f "$disabled_file" ]; then
        destination=$disabled_file
    else
        print_info "${plugin_name} no está instalado; se omite"
        PLUGIN_UPDATE_SKIPPED=$((PLUGIN_UPDATE_SKIPPED + 1))
        return 0
    fi

    if "$download_function" "$plugins_dir" "$destination"; then
        PLUGIN_UPDATE_UPDATED=$((PLUGIN_UPDATE_UPDATED + 1))
    else
        result=$?
        if [ "$result" -eq 2 ]; then
            PLUGIN_UPDATE_SKIPPED=$((PLUGIN_UPDATE_SKIPPED + 1))
        elif [ "$result" -eq 3 ]; then
            PLUGIN_UPDATE_UNCHANGED=$((PLUGIN_UPDATE_UNCHANGED + 1))
        else
            PLUGIN_UPDATE_FAILURES=$((PLUGIN_UPDATE_FAILURES + 1))
        fi
    fi
}

has_managed_plugins() {
    local plugins_dir=${1:-./server/plugins}
    local filename

    for filename in \
        "ViaVersion.jar" \
        "ViaBackwards.jar" \
        "ProtocolLib.jar" \
        "VaultUnlocked.jar" \
        "Geyser-Spigot.jar" \
        "floodgate-spigot.jar"; do
        if [ -f "${plugins_dir}/${filename}" ] ||
            [ -f "${plugins_dir}/${filename}.disabled" ]; then
            return 0
        fi
    done

    return 1
}

update_plugins() {
    local plugins_dir=${1:-./server/plugins}

    PLUGIN_UPDATE_UPDATED=0
    PLUGIN_UPDATE_SKIPPED=0
    PLUGIN_UPDATE_UNCHANGED=0
    PLUGIN_UPDATE_FAILURES=0

    if ! has_managed_plugins "$plugins_dir"; then
        print_info "No hay plugins soportados instalados en ${plugins_dir}"
        return 0
    fi

    print_info "Actualizando plugins soportados instalados en: ${plugins_dir}"
    update_managed_plugin "$plugins_dir" "ViaVersion" "ViaVersion.jar" download_viaversion
    update_managed_plugin "$plugins_dir" "ViaBackwards" "ViaBackwards.jar" download_viabackwards
    update_managed_plugin "$plugins_dir" "ProtocolLib" "ProtocolLib.jar" download_protocollib
    update_managed_plugin "$plugins_dir" "VaultUnlocked" "VaultUnlocked.jar" download_vault
    update_managed_plugin "$plugins_dir" "Geyser" "Geyser-Spigot.jar" download_geyser
    update_managed_plugin "$plugins_dir" "Floodgate" "floodgate-spigot.jar" download_floodgate

    if [ "$PLUGIN_UPDATE_FAILURES" -gt 0 ]; then
        print_warning "Actualización de plugins incompleta: ${PLUGIN_UPDATE_UPDATED} actualizados, ${PLUGIN_UPDATE_UNCHANGED} sin cambios, ${PLUGIN_UPDATE_SKIPPED} omitidos, ${PLUGIN_UPDATE_FAILURES} fallidos"
        return 1
    fi

    if [ "$PLUGIN_UPDATE_UPDATED" -eq 0 ]; then
        if [ "$PLUGIN_UPDATE_UNCHANGED" -gt 0 ]; then
            print_success "Plugins ya actualizados: ${PLUGIN_UPDATE_UNCHANGED}; omitidos: ${PLUGIN_UPDATE_SKIPPED}"
        else
            print_warning "No se actualizó ningún plugin; ${PLUGIN_UPDATE_SKIPPED} se omitieron"
        fi
        return 0
    fi

    print_success "Plugins actualizados: ${PLUGIN_UPDATE_UPDATED}; sin cambios: ${PLUGIN_UPDATE_UNCHANGED}; omitidos: ${PLUGIN_UPDATE_SKIPPED}"
}
