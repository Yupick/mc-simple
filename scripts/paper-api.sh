#!/bin/bash

PAPER_API_BASE_URL="https://fill.papermc.io/v3/projects/paper"
PAPER_API_USER_AGENT="mc-simple/1.0 (https://github.com/Yupick/mc-simple)"

paper_api_request() {
    local url=$1

    curl --fail --silent --show-error --location \
        --connect-timeout 10 --max-time 120 \
        --header "User-Agent: ${PAPER_API_USER_AGENT}" \
        "$url"
}

paper_api_list_versions() {
    local response
    local candidates
    local supported_versions

    if ! response=$(paper_api_request "$PAPER_API_BASE_URL"); then
        printf '[ERROR] No se pudieron consultar las versiones de Paper.\n' >&2
        return 1
    fi

    if ! candidates=$(printf '%s' "$response" | jq -er \
        '.versions | to_entries[] | .value[] | select(type == "string" and test("^[0-9]+\\.[0-9]+(\\.[0-9]+)?$"))'); then
        printf '[ERROR] La respuesta de Paper no contiene versiones válidas.\n' >&2
        return 1
    fi

    supported_versions=$(printf '%s\n' "$candidates" |
        awk -F. '($1 + 0 > 1) || (($1 + 0 == 1) && ($2 + 0 >= 19))' |
        sort -Vu)

    if [ -z "$supported_versions" ]; then
        printf '[ERROR] No se encontraron versiones de Paper desde Minecraft 1.19.\n' >&2
        return 1
    fi

    printf '%s\n' "$supported_versions"
}

paper_api_latest_stable_build() {
    local version=$1
    local response
    local build

    if [[ ! "$version" =~ ^[0-9]+(\.[0-9]+)*$ ]]; then
        printf '[ERROR] Versión de Paper inválida: %s\n' "$version" >&2
        return 1
    fi

    if ! response=$(paper_api_request "${PAPER_API_BASE_URL}/versions/${version}/builds"); then
        printf '[ERROR] No se pudieron consultar los builds de Paper %s.\n' "$version" >&2
        return 1
    fi

    if ! build=$(printf '%s' "$response" | jq -ce \
        '[.[] | select(.channel == "STABLE")][0] // empty'); then
        printf '[ERROR] No hay un build estable de Paper para %s.\n' "$version" >&2
        return 1
    fi

    if ! printf '%s' "$build" | jq -e \
        '(.id | type == "number") and
         (.downloads["server:default"].name | type == "string" and length > 0) and
         (.downloads["server:default"].url | type == "string" and startswith("https://"))' \
        >/dev/null; then
        printf '[ERROR] El build de Paper %s no contiene un artefacto descargable válido.\n' "$version" >&2
        return 1
    fi

    printf '%s\n' "$build"
}

paper_api_download_build() {
    local build=$1
    local destination_dir=$2
    local filename
    local url
    local expected_sha256
    local expected_size
    local actual_size
    local actual_sha256
    local temporary_file

    if ! filename=$(printf '%s' "$build" | jq -er '.downloads["server:default"].name'); then
        printf '[ERROR] El build no contiene el nombre del JAR de Paper.\n' >&2
        return 1
    fi

    if [[ "$filename" != paper-*.jar || "$filename" == */* ]]; then
        printf '[ERROR] Nombre de JAR de Paper inesperado: %s\n' "$filename" >&2
        return 1
    fi

    if ! url=$(printf '%s' "$build" | jq -er '.downloads["server:default"].url'); then
        printf '[ERROR] El build no contiene una URL de descarga de Paper.\n' >&2
        return 1
    fi

    if [[ "$url" != https://* ]]; then
        printf '[ERROR] La URL de descarga de Paper no usa HTTPS.\n' >&2
        return 1
    fi

    expected_sha256=$(printf '%s' "$build" | jq -r \
        '.downloads["server:default"].checksums.sha256 // empty')
    expected_size=$(printf '%s' "$build" | jq -r \
        '.downloads["server:default"].size // empty')

    if ! command -v unzip >/dev/null 2>&1; then
        printf '[ERROR] Falta la dependencia unzip para validar el JAR de Paper.\n' >&2
        return 1
    fi

    mkdir -p "$destination_dir"
    if ! temporary_file=$(mktemp "${destination_dir}/.${filename}.XXXXXX"); then
        printf '[ERROR] No se pudo crear un archivo temporal para Paper.\n' >&2
        return 1
    fi

    if ! curl --fail --silent --show-error --location \
        --connect-timeout 10 --max-time 180 \
        --output "$temporary_file" "$url"; then
        rm -f -- "$temporary_file"
        printf '[ERROR] Falló la descarga de %s.\n' "$filename" >&2
        return 1
    fi

    if [ ! -s "$temporary_file" ] || ! unzip -tq "$temporary_file" >/dev/null 2>&1; then
        rm -f -- "$temporary_file"
        printf '[ERROR] El archivo descargado de Paper está vacío o no es un JAR válido.\n' >&2
        return 1
    fi

    if [[ "$expected_size" =~ ^[0-9]+$ ]]; then
        actual_size=$(wc -c < "$temporary_file")
        actual_size=${actual_size//[[:space:]]/}
        if [ "$actual_size" != "$expected_size" ]; then
            rm -f -- "$temporary_file"
            printf '[ERROR] El tamaño del JAR de Paper no coincide con los metadatos.\n' >&2
            return 1
        fi
    fi

    if [ -n "$expected_sha256" ]; then
        if [[ ! "$expected_sha256" =~ ^[[:xdigit:]]{64}$ ]] ||
            ! command -v sha256sum >/dev/null 2>&1; then
            rm -f -- "$temporary_file"
            printf '[ERROR] No se puede verificar el SHA-256 del JAR de Paper.\n' >&2
            return 1
        fi

        actual_sha256=$(sha256sum "$temporary_file")
        actual_sha256=${actual_sha256%% *}
        if [ "$actual_sha256" != "$expected_sha256" ]; then
            rm -f -- "$temporary_file"
            printf '[ERROR] El SHA-256 del JAR de Paper no coincide.\n' >&2
            return 1
        fi
    fi

    if ! chmod 0644 "$temporary_file"; then
        rm -f -- "$temporary_file"
        printf '[ERROR] No se pudieron ajustar los permisos del JAR de Paper.\n' >&2
        return 1
    fi
    printf '%s\n' "$temporary_file"
}
