# 🔧 Administración del Web Manager

Script de administración del sistema web para gestionar el servidor Minecraft.

## 📋 Uso del Script

### Comandos Disponibles

```bash
./web-manager.sh {start|stop|restart|status|logs}
```

### 1. Iniciar el Sistema

```bash
./web-manager.sh start
```

Este comando:
- Instala automáticamente las dependencias si no están instaladas
- Inicia el backend (API en puerto 3001)
- Inicia el frontend (UI en puerto 5173)
- Guarda los PIDs en `.pids/`
- Redirige los logs a `logs/`

**Output esperado:**
```
=== Iniciando Web Manager ===

Iniciando backend...
✓ Backend iniciado correctamente (PID: 12345)
  API disponible en: http://localhost:3001/api

Iniciando frontend...
✓ Frontend iniciado correctamente (PID: 12346)
  Panel web disponible en: http://localhost:5173

=== Sistema iniciado correctamente ===

Accede al panel web en: http://localhost:5173
API disponible en: http://localhost:3001/api
```

### 2. Detener el Sistema

```bash
./web-manager.sh stop
```

Detiene ambos servicios de forma limpia.

### 3. Reiniciar el Sistema

```bash
./web-manager.sh restart
```

Detiene y vuelve a iniciar ambos servicios.

### 4. Ver Estado

```bash
./web-manager.sh status
```

Muestra el estado actual del sistema:

```
=== Estado del Web Manager ===

✓ Backend: CORRIENDO (PID: 12345)
  Puerto: 3001
  Log: /path/to/logs/backend.log

✓ Frontend: CORRIENDO (PID: 12346)
  URL: http://localhost:5173
  Log: /path/to/logs/frontend.log

Estado: SISTEMA OPERATIVO

Accede al panel web en: http://localhost:5173
```

### 5. Ver Logs en Tiempo Real

**Ver logs del backend:**
```bash
./web-manager.sh logs backend
```

**Ver logs del frontend:**
```bash
./web-manager.sh logs frontend
```

Presiona `Ctrl+C` para salir del visor de logs.

## 📁 Estructura de Archivos Generados

```
minecraft-web-manager/
├── .pids/                    # PIDs de los procesos
│   ├── backend.pid
│   └── frontend.pid
├── logs/                     # Logs de los servicios
│   ├── backend.log
│   └── frontend.log
└── web-manager.sh           # Script de administración
```

## 🔍 Verificación del Sistema

### Verificar que el backend está corriendo

```bash
curl http://localhost:3001/health
```

Deberías ver:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-02-11T..."
}
```

### Verificar que el frontend está corriendo

Abre tu navegador en: http://localhost:5173

Deberías ver la página de login del sistema.

## 🐛 Solución de Problemas

### El backend no inicia

1. **Verificar permisos:**
   ```bash
   cd minecraft-web-manager/backend
   ls -la
   ```

2. **Ver logs:**
   ```bash
   cat logs/backend.log
   ```

3. **Verificar variables de entorno:**
   ```bash
   cat backend/.env
   ```

   Asegúrate de que `.env` existe y tiene las rutas correctas.

4. **Verificar que el puerto 3001 no está en uso:**
   ```bash
   lsof -i :3001
   ```

### El frontend no inicia

1. **Ver logs:**
   ```bash
   cat logs/frontend.log
   ```

2. **Verificar que el puerto 5173 no está en uso:**
   ```bash
   lsof -i :5173
   ```

### Dependencias no se instalan

Si las dependencias no se instalan automáticamente, instálalas manualmente:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Proceso zombie (PID guardado pero proceso no existe)

El script detecta y limpia automáticamente PIDs obsoletos. Si tienes problemas:

```bash
# Limpiar PIDs manualmente
rm -rf .pids/

# Verificar procesos corriendo
ps aux | grep node
ps aux | grep vite

# Matar procesos manualmente si es necesario
kill <PID>
```

## ⚙️ Configuración Inicial Requerida

Antes de usar el script por primera vez:

### 1. Configurar Variables de Entorno

```bash
cd minecraft-web-manager/backend
cp .env.example .env
nano .env
```

Edita estas variables:
```env
SERVER_PATH=/home/mkd/contenedores/mc-simple/server
BACKUP_PATH=/home/mkd/contenedores/mc-simple/backups
JWT_SECRET=cambiar-por-secreto-largo-y-seguro
RCON_PASSWORD=tu-password-rcon
```

### 2. Inicializar Base de Datos

```bash
cd minecraft-web-manager/backend
npm install  # Solo la primera vez
npm run migrate
```

### 3. Crear Usuario Administrador

```bash
npm run create-admin
```

### 4. Iniciar el Sistema

```bash
cd ..  # Volver a minecraft-web-manager/
./web-manager.sh start
```

## 🚀 Uso en Producción

### Iniciar al arrancar el sistema (systemd)

Crea un servicio systemd:

```bash
sudo nano /etc/systemd/system/minecraft-web-manager.service
```

Contenido:
```ini
[Unit]
Description=Minecraft Web Manager
After=network.target

[Service]
Type=forking
User=mkd
WorkingDirectory=/home/mkd/contenedores/mc-simple/minecraft-web-manager
ExecStart=/home/mkd/contenedores/mc-simple/minecraft-web-manager/web-manager.sh start
ExecStop=/home/mkd/contenedores/mc-simple/minecraft-web-manager/web-manager.sh stop
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Habilitar e iniciar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable minecraft-web-manager
sudo systemctl start minecraft-web-manager
```

### Rotar logs

Crea un archivo de configuración logrotate:

```bash
sudo nano /etc/logrotate.d/minecraft-web-manager
```

Contenido:
```
/home/mkd/contenedores/mc-simple/minecraft-web-manager/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 mkd mkd
}
```

## 📊 Monitoreo

### Ver uso de recursos

```bash
# Ver procesos del web manager
ps aux | grep -E "(node|vite)" | grep -v grep

# Ver uso de memoria
top -p $(cat .pids/backend.pid) -p $(cat .pids/frontend.pid)
```

### Logs en tiempo real de ambos servicios

Terminal 1:
```bash
./web-manager.sh logs backend
```

Terminal 2:
```bash
./web-manager.sh logs frontend
```

## ℹ️ Información Adicional

- **Backend:** Node.js + Express en puerto 3001
- **Frontend:** React + Vite en puerto 5173
- **Logs:** Se guardan en `logs/` con rotación manual
- **PIDs:** Se guardan en `.pids/` para control de procesos
- **Dependencias:** Se instalan automáticamente en el primer inicio

## 🔗 Enlaces Rápidos

- Panel web: http://localhost:5173
- API: http://localhost:3001/api
- Health check: http://localhost:3001/health
- Documentación completa: [README.md](README.md)
