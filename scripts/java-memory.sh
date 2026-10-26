#!/bin/bash

java_memory_value_to_mb() {
    local value=$1
    local amount
    local unit

    [[ "$value" =~ ^([1-9][0-9]{0,3})([MG])$ ]] || return 1
    amount=${BASH_REMATCH[1]}
    unit=${BASH_REMATCH[2]}

    if [ "$unit" = G ]; then
        [ "$amount" -le 1024 ] || return 1
        printf '%s\n' "$((amount * 1024))"
    else
        [ "$amount" -le 9999 ] || return 1
        printf '%s\n' "$amount"
    fi
}

load_java_memory_config() {
    local config_file=$1
    local key
    local value
    local min_mb
    local max_mb

    JAVA_MIN_RAM="1G"
    JAVA_MAX_RAM="4G"

    if [ -r "$config_file" ]; then
        while IFS='=' read -r key value || [ -n "$key$value" ]; do
            case "$key" in
                MIN_RAM) JAVA_MIN_RAM=$value ;;
                MAX_RAM) JAVA_MAX_RAM=$value ;;
                ''|\#*) ;;
                *) return 1 ;;
            esac
        done < "$config_file"
    fi

    min_mb=$(java_memory_value_to_mb "$JAVA_MIN_RAM") || return 1
    max_mb=$(java_memory_value_to_mb "$JAVA_MAX_RAM") || return 1
    [ "$min_mb" -le "$max_mb" ]
}