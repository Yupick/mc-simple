# Minecraft Web Manager - Python FastAPI

Sistema de administración web para servidores Minecraft Paper, completamente reescrito en Python FastAPI + Jinja2 Templates.

## 🚀 **Ventajas sobre la versión Node.js**

✅ **Sin compilaciones** - No más Vite, no más `npm build`  
✅ **Sin procesos zombies** - Un solo proceso uvicorn estable  
✅ **Menos dependencias** - Sin node_modules (50MB vs 500MB)  
✅ **Menos memoria** - ~150MB RAM vs ~400MB con Node.js  
✅ **Mismo comportamiento** - Dev = Prod, sin configuraciones especiales  
✅ **Más estable** - Sin pantallas negras ni conflictos de puertos  

---

## 📋 Requisitos

- **Python 3.8+**
- **Servidor Minecraft Paper** en `../server/`
- **Scripts bash** existentes (manage-control.sh, backup.sh, rcon-client.sh)

---

## 🛠️ Instalación

### 1. Instalar Python 3 (si no lo tienes)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-venv python3-pip

# Verificar versión
python3 --version  # Debe ser 3.8 o superior
```

### 2. Setup inicial (primera vez)

```bash
cd /home/mkd/contenedores/mc-simple/minecraft-web-manager
python3 manager.py setup
```

Esto hará:
- ✅ Crear entorno virtual (venv)
- ✅ Instalar dependencias de requirements.txt
- ✅ Crear base de datos SQLite
- ✅ Ejecutar migraciones
- ✅ Crear usuario admin (te pedirá username y password)

### 3. Configurar variables de entorno

Edita el archivo `.env` generado:

```bash
nano backend-python/.env
```

Variables importantes:
```bash
# Ruta al servidor Minecraft
SERVER_PATH=/home/mkd/contenedores/mc-simple/server

# Ruta de backups
BACKUP_PATH=/home/mkd/contenedores/mc-simple

# Secret para JWT (cambia en producción)
SECRET_KEY=tu-secret-key-super-largo-y-seguro-aqui

# RCON password (debe coincidir con server.properties)
RCON_PASSWORD=tu-rcon-password
RCON_PORT=25575
```

---

## 🚀 Uso

### Comandos principales

```bash
# Iniciar servidor (dev y prod son iguales)
python3 manager.py start

# Detener servidor
python3 manager.py stop

# Ver estado
python3 manager.py status
```

### Opciones avanzadas

```bash
# Iniciar en puerto personalizado
python3 manager.py start --port 8080

# Iniciar en host específico
python3 manager.py start --host 127.0.0.1
```

### Acceder al panel web

Una vez iniciado, abre tu navegador:

```
http://localhost:8000
```

O desde otro equipo en la red:
```
http://IP-DEL-SERVIDOR:8000
```

**Credenciales:** Las que configuraste en el setup

---

## 📦 Estructura del Proyecto

```
minecraft-web-manager/
├── manager.py                    # ← Script de administración principal
├── minecraft-manager.service     # ← Archivo systemd para producción
│
└── backend-python/
    ├── main.py                   # Entry point FastAPI
    ├── requirements.txt          # Dependencias Python
    ├── .env                      # Variables de entorno
    │
    ├── app/
    │   ├── api/                  # API REST
    │   │   ├── routes/           # 7 routers (auth, server, worlds, etc.)
    │   │   ├── controllers/      # 7 controladores
    │   │   └── middlewares/      # Auth, errores
    │   ├── core/                 # Security (JWT, bcrypt)
    │   ├── db/                   # Base de datos SQLite
    │   ├── models/               # 6 modelos SQLAlchemy
    │   ├── schemas/              # Pydantic schemas
    │   ├── services/             # 8 servicios (bash, server, worlds, etc.)
    │   └── scripts/              # create_admin.py
    │
    ├── templates/                # HTML Jinja2
    │   ├── base.html
    │   ├── login.html
    │   ├── dashboard.html
    │   ├── server.html           # Control + logs en tiempo real
    │   ├── worlds.html
    │   ├── plugins.html
    │   ├── backups.html
    │   ├── config.html
    │   └── components/
    │
    └── static/                   # CSS + JavaScript
        ├── css/
        │   └── custom.css
        └── js/
            ├── api.js            # Cliente API
            ├── auth.js           # Autenticación
            ├── websocket.js      # WebSocket (logs + status)
            └── components/       # Alpine.js components
```

---

## 🔧 Despliegue en Producción (systemd)

Para que el servidor inicie automáticamente al arrancar el sistema:

### 1. Copiar archivo de servicio

```bash
sudo cp minecraft-manager.service /etc/systemd/system/
```

### 2. Editar rutas si es necesario

```bash
sudo nano /etc/systemd/system/minecraft-manager.service
```

Asegúrate de que las rutas coincidan con tu instalación.

### 3. Habilitar e iniciar servicio

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable minecraft-manager

# Iniciar servicio
sudo systemctl start minecraft-manager

# Ver estado
sudo systemctl status minecraft-manager

# Ver logs
sudo journalctl -u minecraft-manager -f
```

### 4. Detener servicio (si necesitas)

```bash
sudo systemctl stop minecraft-manager
```

---

## 📊 API REST

### Documentación automática

FastAPI genera documentación automática:

```
http://localhost:8000/docs       # Swagger UI
http://localhost:8000/redoc      # ReDoc
```

### Endpoints principales

#### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual

#### Servidor
- `GET /api/server/status` - Estado del servidor
- `POST /api/server/start` - Iniciar
- `POST /api/server/stop` - Detener
- `POST /api/server/restart` - Reiniciar
- `GET /api/server/logs?lines=100` - Logs
- `POST /api/server/command` - Enviar comando RCON
- `GET /api/server/java-memory` - Leer Xms/Xmx (admin)
- `PUT /api/server/java-memory` - Cambiar Xms/Xmx con el servidor detenido (admin)
- `GET /api/server/maintenance/check` - Consultar builds Paper estables (admin)
- `POST /api/server/maintenance` - Iniciar actualización Paper/plugins (admin)
- `GET /api/server/maintenance/{job_id}` - Consultar tarea de actualización (admin)

La memoria Java se guarda en `server/java-memory.conf` (`MIN_RAM=1G` y `MAX_RAM=4G`). Los cambios se aplican en el siguiente inicio. Las actualizaciones crean un backup antes de reemplazar Paper o plugins soportados.

#### Mundos
- `GET /api/worlds` - Listar mundos
- `GET /api/worlds/active` - Mundo activo
- `POST /api/worlds` - Crear mundo
- `POST /api/worlds/{id}/activate` - Activar mundo
- `DELETE /api/worlds/{id}` - Eliminar mundo

#### Plugins
- `GET /api/plugins` - Listar plugins
- `PUT /api/plugins/{name}/toggle` - Enable/Disable
- `DELETE /api/plugins/{name}` - Eliminar

#### Backups
- `GET /api/backups` - Listar backups
- `POST /api/backups` - Crear backup
- `DELETE /api/backups/{id}` - Eliminar

#### Configuración
- `GET /api/config/server-properties` - Leer server.properties
- `PUT /api/config/server-properties` - Actualizar server.properties
- `GET /api/config/whitelist` - Leer whitelist
- `PUT /api/config/whitelist` - Actualizar whitelist

---

## 🔌 WebSocket (Tiempo Real)

### Eventos disponibles

#### Logs del servidor
```javascript
// Cliente se suscribe
socket.emit('start-logs');

// Servidor envía líneas
socket.on('log', (data) => {
  console.log(data.line);
});

// Cliente se desuscribe
socket.emit('stop-logs');
```

#### Estado del servidor (cada 5 segundos)
```javascript
socket.on('server-status-update', (status) => {
  console.log(status.running, status.memory, status.players);
});
```

---

## 🛡️ Seguridad

- ✅ **JWT con cookies HttpOnly** (protección contra XSS)
- ✅ **Bcrypt** para passwords (12 rounds)
- ✅ **Rate limiting** (100 req/15min general, 5 req/15min login)
- ✅ **CORS** configurado
- ✅ **Audit logging** de todas las acciones
- ✅ **Sistema de roles** (admin, moderator, viewer)

---

## 📝 Logs

Los logs del servidor se guardan en:

```
backend-python/logs/server.log
```

Ver logs en tiempo real:
```bash
tail -f backend-python/logs/server.log
```

---

## 🐛 Troubleshooting

### El servidor no inicia

1. Verifica que ejecutaste `python3 manager.py setup`
2. Revisa los logs: `tail backend-python/logs/server.log`
3. Verifica que el puerto 8000 no esté ocupado: `lsof -i :8000`

### Error de permisos

```bash
chmod +x manager.py
chmod -R 755 backend-python/
```

### Puerto ocupado

```bash
# Liberar puerto 8000
lsof -ti :8000 | xargs kill -9

# O iniciar en otro puerto
python3 manager.py start --port 8080
```

### Recrear base de datos

```bash
rm backend-python/data/minecraft-manager.db
python3 manager.py setup
```

---

## 🔄 Migración desde Node.js

Si vienes de la versión Node.js anterior:

### 1. Hacer backup del DB antiguo (opcional)

```bash
cp backend/data/minecraft-manager.db backend/data/minecraft-manager.db.backup
```

### 2. Instalar versión Python

```bash
python3 manager.py setup
```

### 3. Detener versión Node.js

```bash
./web-manager.sh stop
```

### 4. Iniciar versión Python

```bash
python3 manager.py start
```

### Diferencias principales

| Aspecto | Node.js | Python |
|---------|---------|--------|
| **Frontend** | React + Vite | Templates Jinja2 |
| **Compilación** | Necesaria | No necesaria |
| **Puertos** | 3001 (backend) + 5173 (frontend) | 8000 (único) |
| **Memoria** | ~400MB | ~150MB |
| **Dependencias** | node_modules (~500MB) | venv (~50MB) |
| **Estabilidad** | Procesos zombies, pantalla negra | Sin problemas |

---

## 📚 Tecnologías Utilizadas

- **Backend**: FastAPI 0.109 (Python async)
- **Base de datos**: SQLite + SQLAlchemy ORM
- **Autenticación**: JWT + bcrypt
- **WebSocket**: python-socketio
- **Templates**: Jinja2
- **CSS**: Tailwind CSS (CDN)
- **JavaScript**: Alpine.js + vanilla JS
- **Icons**: Lucide Icons

---

## 🤝 Contribuir

Este proyecto es una reescritura completa del sistema Node.js original, diseñado para simplificar el despliegue y eliminar problemas de estabilidad.

---

## 📄 Licencia

MIT

---

## 👤 Autor

Desarrollado para simplificar la administración de servidores Minecraft Paper.
