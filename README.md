# 🎮 Instalador de Servidor Minecraft Paper

Sistema completo para instalar y gestionar un servidor de Minecraft Paper con interfaz de línea de comandos.

## 📋 Requisitos

Antes de ejecutar el instalador, asegúrate de tener instalados:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install curl jq unzip openjdk-21-jre-headless

# O verifica qué tienes instalado
curl --version
jq --version
java --version
unzip -v
sha256sum --version
```

## 🚀 Instalación Rápida

1. **Ejecuta el instalador:**
   ```bash
   ./install-paper.sh
   ```

2. **Sigue el asistente interactivo:**
   - Selecciona la versión de Minecraft (desde 1.19 en adelante)
   - Decide si instalar plugins de compatibilidad:
     - **ViaVersion**: permite que jugadores con versiones anteriores/posteriores se conecten
     - **ViaBackwards**: se instala junto con ViaVersion para versiones anteriores
     - **ProtocolLib**: biblioteca usada por algunos plugins
     - **VaultUnlocked**: API compatible con plugins que requieren Vault
     - **Geyser + Floodgate**: permite que jugadores de Bedrock Edition se conecten

3. **El instalador creará:**
   - ✅ Carpeta `server/` con el servidor
   - ✅ Carpeta `server/plugins/` para plugins
   - ✅ Script `server/manage-control.sh` para gestionar el servidor
   - ✅ Archivos de configuración (`eula.txt`, `server.properties`)

## 🎛️ Gestión del Servidor

Una vez instalado, navega a la carpeta del servidor:

```bash
cd server
```

### Comandos Disponibles

```bash
# Iniciar el servidor (se ejecuta en segundo plano)
./manage-control.sh start

# Detener el servidor de forma segura
./manage-control.sh stop

# Reiniciar el servidor
./manage-control.sh restart

# Ver los logs en tiempo real
./manage-control.sh logs
# Presiona Ctrl+C para volver; el servidor seguirá ejecutándose

# Abrir cliente de consola para enviar comandos
./manage-control.sh console

# Ver estado del servidor
./manage-control.sh status

# Ver ayuda
./manage-control.sh help
```

## 💻 Cliente de Consola

El cliente de consola te permite enviar comandos al servidor sin usar un cliente gráfico:

```bash
./manage-control.sh console
```

Una vez dentro:
- Escribe comandos **sin** el `/` inicial
- Ejemplos:
  ```
  minecraft> list
  minecraft> give Player diamond 64
  minecraft> tp Player 0 64 0
  minecraft> say ¡Hola a todos!
  minecraft> weather clear
  ```
- Escribe `exit` o `quit` para salir (el servidor sigue corriendo)

## 📊 Características

### ✨ Servidor
- **Ejecución en segundo plano**: El servidor corre continuamente
- **Optimización**: Flags de Aikar para mejor rendimiento
- **RAM configurable**: 1GB mín, 4GB máx (editable en manage-control.sh)
- **RCON habilitado**: Puerto 25575, contraseña: `minecraft`

### 🔌 Plugins Opcionales
1. **ViaVersion**
   - Permite compatibilidad entre diferentes versiones de Minecraft
   - Los jugadores con versiones anteriores o posteriores pueden conectarse

2. **Geyser + Floodgate**
   - Permite que jugadores de Bedrock Edition (consolas, móviles) se conecten
   - Puerto Bedrock predeterminado: 19132 (UDP)

3. **ViaBackwards**
   - Complementa ViaVersion para compatibilidad con versiones anteriores

4. **ProtocolLib**
   - Biblioteca de protocolos utilizada por algunos plugins

5. **VaultUnlocked**
   - Implementación compatible con plugins que requieren la API de Vault

### Actualizar Paper y los plugins soportados

Desde el directorio del proyecto, ejecuta:

```bash
./update-paper.sh
```

El actualizador consulta la API actual de Paper y solo instala builds estables. También permite actualizar plugins aunque Paper ya esté al día. Solo actualiza los plugins soportados que ya existan en `server/plugins`; no instala los plugins opcionales que falten ni modifica plugins ajenos a esta lista:

- ViaVersion
- ViaBackwards
- ProtocolLib
- VaultUnlocked
- Geyser
- Floodgate

Si el proveedor no ofrece una versión estable o la descarga no supera las validaciones, se conserva el JAR instalado y se informa el resultado. Antes de reemplazar archivos, el script pide detener el servidor y crea un backup.

### 🎮 Gestión Avanzada
- **Logs en tiempo real**: Ve qué sucede en el servidor sin interferir
- **Detención segura**: Guarda el mundo antes de cerrar
- **Reinicio rápido**: Para aplicar cambios de configuración

## 📝 Configuración

### Editar propiedades del servidor
```bash
nano server/server.properties
```

Propiedades importantes:
- `server-port=25565` - Puerto del servidor
- `max-players=20` - Máximo de jugadores
- `gamemode=survival` - Modo de juego predeterminado
- `difficulty=easy` - Dificultad
- `online-mode=true` - Verificación de cuentas de Mojang
- `rcon.password=minecraft` - Contraseña RCON

### Ajustar RAM del servidor
```bash
nano server/manage-control.sh
```

Busca y modifica:
```bash
MIN_RAM="1G"    # RAM mínima
MAX_RAM="4G"    # RAM máxima
```

## 🔧 Solución de Problemas

### El servidor no inicia
```bash
# Verifica que Java esté instalado
java --version

# Revisa los logs
cd server
./manage-control.sh logs
```

### unzip no encontrado
```bash
sudo apt install unzip
```

### Puerto ya en uso
```bash
# Verifica qué usa el puerto 25565
sudo lsof -i :25565

# Cambia el puerto en server.properties
nano server/server.properties
# Modifica: server-port=25566
```

### Problemas con Geyser (Bedrock)
- Asegúrate de que el puerto UDP 19132 esté abierto
- Verifica la configuración en `server/plugins/Geyser-Spigot/config.yml`

## 🌐 Conectarse al Servidor

### Java Edition
1. Abre Minecraft Java Edition
2. Multijugador → Añadir servidor
3. Dirección: `tu-ip:25565` (o tu puerto configurado)

### Bedrock Edition (si Geyser está instalado)
1. Abre Minecraft Bedrock
2. Servidores → Añadir servidor
3. Dirección: `tu-ip`
4. Puerto: `19132`

## 📁 Estructura de Archivos

```
mc-paper/
├── install-paper.sh          # Script de instalación
├── update-paper.sh           # Actualizador de Paper y plugins soportados
├── scripts/
│   ├── paper-api.sh          # Funciones de Paper Fill API v3
│   └── plugins.sh            # Descargas de plugins soportados
├── README.md                 # Este archivo
└── server/                   # Carpeta del servidor (creada al instalar)
    ├── paper.jar            # Servidor Paper
    ├── paper.jar.old        # JAR anterior tras una actualización (opcional)
    ├── manage-control.sh     # Script de gestión
    ├── eula.txt             # EULA aceptado
    ├── server.properties    # Configuración del servidor
    ├── plugins/             # Carpeta de plugins
    │   ├── ViaVersion.jar   # (opcional)
    │   ├── ViaBackwards.jar # (opcional)
    │   ├── ProtocolLib.jar  # (opcional)
    │   ├── VaultUnlocked.jar # (opcional)
    │   ├── Geyser-Spigot.jar # (opcional)
    │   └── floodgate-spigot.jar # (opcional)
    ├── world/               # Mundo principal (generado)
    ├── world_nether/        # Nether (generado)
    ├── world_the_end/       # End (generado)
    └── logs/                # Logs del servidor (generado)
```

## 🔐 Seguridad

- **Cambia la contraseña de RCON** en `server.properties`
- **Configura el firewall** para permitir solo puertos necesarios:
  ```bash
  sudo ufw allow 25565/tcp  # Java
  sudo ufw allow 19132/udp  # Bedrock (si usas Geyser)
  ```
- **Habilita whitelist** si es un servidor privado:
  ```
  ./manage-control.sh console
  minecraft> whitelist on
  minecraft> whitelist add NombreJugador
  ```

## 📚 Recursos Útiles

- [Paper MC](https://papermc.io/) - Sitio oficial
- [ViaVersion](https://viaversion.com/) - Compatibilidad de versiones
- [GeyserMC](https://geysermc.org/) - Compatibilidad Bedrock/Java
- [Aikar's Flags](https://docs.papermc.io/paper/aikars-flags) - Optimización JVM

## 📄 Licencia

Este script es de código abierto. El servidor Paper y los plugins tienen sus propias licencias.

---

## 🌿 Flujo de Desarrollo (GitFlow)

Este proyecto usa **GitFlow** para gestión ordenada de versiones y desarrollo.

### 📌 Estructura de Ramas

- **`main`**: Código en producción, 100% estable
- **`develop`**: Rama de integración, último código desarrollado
- **`feature/*`**: Nuevas funcionalidades
- **`release/*`**: Preparación de versiones  
- **`hotfix/*`**: Correcciones urgentes en producción

### 🚀 Contribuir

1. **Fork** del repositorio
2. **Crear feature branch**:
   ```bash
   git checkout develop
   git checkout -b feature/mi-funcionalidad
   ```
3. **Commits con convención**:
   ```bash
   git commit -m "feat(scope): descripción"
   ```
4. **Push y Pull Request**:
   ```bash
   git push origin feature/mi-funcionalidad
   ```
   Crear PR hacia `develop` en GitHub

### 📝 Convención de Commits

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato, estilos
- `refactor`: Refactorización
- `perf`: Mejora de rendimiento
- `test`: Tests
- `chore`: Mantenimiento, configuración

### 📦 Versionado

Usamos [Semantic Versioning](https://semver.org/lang/es/): `vMAJOR.MINOR.PATCH`

- **MAJOR**: Cambios incompatibles
- **MINOR**: Nueva funcionalidad compatible
- **PATCH**: Correcciones de bugs

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo.

---

**¿Necesitas ayuda?** Revisa los logs del servidor con `./manage-control.sh logs` o ejecuta `./manage-control.sh status` para ver el estado actual.
