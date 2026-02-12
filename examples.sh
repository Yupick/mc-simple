#!/bin/bash

# Scripts de ejemplo para tareas comunes del servidor Minecraft

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Scripts de Ejemplo - Tareas Comunes               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Usar el cliente de consola del servidor
CONSOLE="./server/manage-control.sh console"

cat << 'EOF'
═════════════════════════════════════════════════════════
📋 GESTIÓN DEL SERVIDOR
═════════════════════════════════════════════════════════

# Iniciar servidor
./server/manage-control.sh start

# Ver logs en tiempo real (Ctrl+A, D para salir)
./server/manage-control.sh logs

# Cliente de consola interactivo
./server/manage-control.sh console

# Detener servidor de forma segura
./server/manage-control.sh stop

# Reiniciar servidor
./server/manage-control.sh restart

# Ver estado del servidor
./server/manage-control.sh status


═════════════════════════════════════════════════════════
🎮 COMANDOS ÚTILES (desde el cliente de consola)
═════════════════════════════════════════════════════════

# Ver jugadores conectados
list

# Guardar el mundo
save-all

# Hacer backup del mundo
save-all flush

# Enviar mensaje a todos
say ¡Hola jugadores!

# Cambiar hora del día
time set day
time set night
time set 1000

# Cambiar clima
weather clear
weather rain
weather thunder

# Cambiar dificultad
difficulty peaceful
difficulty easy
difficulty normal
difficulty hard

# Dar OP a un jugador
op NombreJugador

# Quitar OP a un jugador
deop NombreJugador

# Cambiar modo de juego
gamemode survival NombreJugador
gamemode creative NombreJugador
gamemode adventure NombreJugador
gamemode spectator NombreJugador

# Teletransportar jugador
tp NombreJugador 0 64 0
tp NombreJugador OtroJugador

# Dar items
give NombreJugador diamond 64
give NombreJugador minecraft:enchanted_golden_apple 1

# Whitelist
whitelist on
whitelist add NombreJugador
whitelist remove NombreJugador
whitelist list

# Ver semilla del mundo
seed

# Recargar configuración
reload


═════════════════════════════════════════════════════════
🔧 CLIENTE RCON (Comandos Remotos)
═════════════════════════════════════════════════════════

# Modo interactivo
./rcon-client.sh -i

# Enviar comando único
./rcon-client.sh "list"
./rcon-client.sh "say Servidor se reiniciará en 5 minutos"

# Conectar a servidor remoto
./rcon-client.sh -h 192.168.1.100 -P contraseña "list"


═════════════════════════════════════════════════════════
📦 GESTIÓN DE PLUGINS
═════════════════════════════════════════════════════════

# Ver plugins instalados
plugins

# Recargar plugin específico (si el plugin lo soporta)
# Ejemplo con ViaVersion:
viaver reload

# Instalar nuevo plugin:
# 1. Descarga el .jar del plugin
# 2. Copia a server/plugins/
# 3. Reinicia el servidor o usa reload (si está disponible)

# Ejemplo: Descargar plugin manualmente
cd server/plugins
wget https://url-del-plugin.jar
cd ../..
./server/manage-control.sh restart


═════════════════════════════════════════════════════════
🛡️ ADMINISTRACIÓN Y SEGURIDAD
═════════════════════════════════════════════════════════

# Banear jugador
ban NombreJugador razón
ban-ip 192.168.1.100

# Desbanear
pardon NombreJugador
pardon-ip 192.168.1.100

# Ver lista de baneados
banlist players
banlist ips

# Expulsar jugador
kick NombreJugador razón

# Bloquear/desbloquear servidor
whitelist on
whitelist off


═════════════════════════════════════════════════════════
💾 BACKUP DEL SERVIDOR
═════════════════════════════════════════════════════════

# Crear backup manual (ejecutar desde el directorio principal)

# 1. Guardar el mundo primero (desde consola del servidor)
./server/manage-control.sh console
# Luego escribe: save-all flush

# 2. Crear backup
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz server/

# 3. Backup solo del mundo
tar -czf world-backup-$(date +%Y%m%d-%H%M%S).tar.gz server/world* server/plugins/*/

# Restaurar backup
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz


═════════════════════════════════════════════════════════
📊 SCRIPT DE BACKUP AUTOMÁTICO
═════════════════════════════════════════════════════════

# Crear script de backup (copia y pega en un archivo backup.sh)

cat > backup.sh << 'BACKUPSCRIPT'
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d-%H%M%S)

# Notificar jugadores
./rcon-client.sh "say Creando backup del servidor..."

# Guardar mundo
./rcon-client.sh "save-all flush"
sleep 5

# Crear backup
tar -czf "$BACKUP_DIR/backup-$DATE.tar.gz" server/
echo "Backup creado: backup-$DATE.tar.gz"

# Notificar completado
./rcon-client.sh "say Backup completado!"

# Limpiar backups antiguos (mantener últimos 7 días)
find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +7 -delete
BACKUPSCRIPT

chmod +x backup.sh

# Ejecutar backup
./backup.sh


═════════════════════════════════════════════════════════
⚙️ CONFIGURACIÓN AVANZADA
═════════════════════════════════════════════════════════

# Editar propiedades del servidor
nano server/server.properties

# Ajustar RAM del servidor
nano server/manage-control.sh
# Busca: MIN_RAM="1G" y MAX_RAM="4G"

# Configurar Geyser (si está instalado)
nano server/plugins/Geyser-Spigot/config.yml

# Configurar ViaVersion (si está instalado)
nano server/plugins/ViaVersion/config.yml

# Ver logs del servidor
tail -f server/logs/latest.log


═════════════════════════════════════════════════════════
🔥 SOLUCIÓN DE PROBLEMAS
═════════════════════════════════════════════════════════

# Ver estado del servidor
./server/manage-control.sh status

# Ver logs completos
less server/logs/latest.log

# Verificar Java
java --version

# Ver procesos de Minecraft
ps aux | grep java

# Matar proceso si está colgado
pkill -9 -f "paper.*jar"

# Verificar puertos en uso
sudo lsof -i :25565
sudo lsof -i :19132

# Test de conectividad
telnet localhost 25565


═════════════════════════════════════════════════════════
🌐 ABRIR PUERTOS EN FIREWALL
═════════════════════════════════════════════════════════

# UFW (Ubuntu/Debian)
sudo ufw allow 25565/tcp  # Minecraft Java
sudo ufw allow 19132/udp  # Minecraft Bedrock (si usas Geyser)
sudo ufw allow 25575/tcp  # RCON (opcional, para administración remota)
sudo ufw enable

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=25565/tcp
sudo firewall-cmd --permanent --add-port=19132/udp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 25565 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 19132 -j ACCEPT
sudo iptables-save


═════════════════════════════════════════════════════════
📱 SERVICIO SYSTEMD (Inicio automático)
═════════════════════════════════════════════════════════

# Crear servicio systemd para inicio automático

sudo tee /etc/systemd/system/minecraft.service > /dev/null << SERVICEEOF
[Unit]
Description=Minecraft Paper Server
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$(pwd)/server
ExecStart=$(pwd)/server/manage-control.sh start
ExecStop=$(pwd)/server/manage-control.sh stop
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Habilitar y gestionar servicio
sudo systemctl daemon-reload
sudo systemctl enable minecraft
sudo systemctl start minecraft
sudo systemctl status minecraft

# Comandos del servicio
sudo systemctl stop minecraft
sudo systemctl restart minecraft
sudo systemctl status minecraft


═════════════════════════════════════════════════════════
📝 NOTAS IMPORTANTES
═════════════════════════════════════════════════════════

1. Siempre usa save-all antes de hacer backups
2. No uses Ctrl+C en los logs, usa Ctrl+A + D para salir
3. Guarda el mundo regularmente con save-all
4. Haz backups antes de actualizar o instalar plugins
5. Revisa los logs si algo no funciona: server/logs/latest.log
6. La contraseña RCON por defecto es "minecraft" - ¡cámbiala!
7. Para salir del cliente de consola: escribe "exit"
8. El servidor corre en segundo plano, no cierres la terminal


═════════════════════════════════════════════════════════

EOF

echo ""
echo -e "${GREEN}Estos ejemplos están disponibles en: examples.sh${NC}"
echo -e "${YELLOW}Tip: Ejecuta './examples.sh | less' para navegarlos mejor${NC}"
echo ""
