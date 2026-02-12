# Guía de Despliegue en Producción

Este documento describe cómo desplegar el Minecraft Web Manager en un servidor de producción.

## Arquitectura de Producción

En producción, el sistema funciona de manera diferente a desarrollo:

- **Desarrollo**: Frontend (puerto 5173) y Backend (puerto 3001) como procesos separados
- **Producción**: Solo Backend (puerto 3001) sirve tanto la API como el frontend compilado

### Ventajas del Modo Producción

- Un solo proceso, un solo puerto
- Sin problemas de CORS (mismo origen)
- URLs relativas funcionan en cualquier dominio
- Más eficiente y simple de administrar

## Preparación Inicial (Primera Vez)

Si aún no has configurado el sistema, ejecuta:

```bash
cd /ruta/a/minecraft-web-manager
./web-manager.sh setup
```

Esto instalará dependencias y creará los archivos de configuración necesarios.

## Despliegue en Producción

### 1. Compilar el Frontend

Antes de iniciar en producción, debes compilar el frontend:

```bash
./web-manager.sh build
```

Esto:
- Instala dependencias del frontend (si es necesario)
- Compila el frontend en modo producción
- Genera archivos optimizados en `frontend/dist/`
- Verifica que el backend esté listo

### 2. Iniciar en Modo Producción

Una vez compilado, inicia el sistema en producción:

```bash
./web-manager.sh start-prod
```

El sistema estará disponible en: **http://mc.nightslayer.com.ar:3001**

### 3. Verificar Estado

Para verificar que el sistema está corriendo:

```bash
./web-manager.sh status
```

### 4. Ver Logs

Para ver los logs en tiempo real:

```bash
./web-manager.sh logs backend
```

## Desarrollo Local

Para trabajar en desarrollo con hot reload:

```bash
./web-manager.sh start
```

Esto iniciará:
- Frontend en `http://localhost:5173` (con hot reload)
- Backend en `http://localhost:3001`

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `./web-manager.sh setup` | Configuración inicial (primera vez) |
| `./web-manager.sh start` | Modo desarrollo (frontend + backend separados) |
| `./web-manager.sh build` | Compila frontend para producción |
| `./web-manager.sh start-prod` | Modo producción (backend sirve todo) |
| `./web-manager.sh stop` | Detiene todos los servicios |
| `./web-manager.sh restart` | Reinicia el sistema |
| `./web-manager.sh status` | Muestra el estado actual |
| `./web-manager.sh logs backend` | Ver logs del backend |

## Actualizar Cambios en Producción

Cuando hagas cambios en el código del frontend:

```bash
# 1. Detener el sistema
./web-manager.sh stop

# 2. Recompilar el frontend
./web-manager.sh build

# 3. Reiniciar en producción
./web-manager.sh start-prod
```

Para cambios en el backend, solo necesitas reiniciar:

```bash
./web-manager.sh restart
```

## Variables de Entorno

### Frontend (.env)

Para desarrollo local, puedes crear un archivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

En producción, estas variables se dejan vacías para usar URLs relativas (automático).

### Backend (.env)

El archivo `backend/.env` contiene la configuración del servidor:

```env
PORT=3001
NODE_ENV=production
SERVER_PATH=/ruta/al/servidor/minecraft
BACKUP_PATH=/ruta/a/backups
# ... otras configuraciones
```

## Resolución de Problemas

### El navegador pide acceso a localhost

Esto significa que el frontend no fue compilado correctamente o el backend no está sirviendo los archivos estáticos.

**Solución**:
1. Detener el sistema: `./web-manager.sh stop`
2. Recompilar: `./web-manager.sh build`
3. Iniciar en producción: `./web-manager.sh start-prod`

### Error "No existe build del frontend"

Debes compilar el frontend antes de iniciar en producción:

```bash
./web-manager.sh build
```

### El WebSocket no conecta

Verifica en la consola del navegador (F12) que Socket.IO intenta conectarse a la URL correcta. Debe ser la misma URL del dominio, no localhost.

### Errores de CORS

En producción no debería haber errores de CORS porque frontend y backend están en el mismo origen. Si ves errores de CORS, verifica que:

1. Estás accediendo por el puerto correcto (3001)
2. El sistema está en modo producción (`NODE_ENV=production`)
3. El build del frontend existe en `frontend/dist/`

## Verificación Post-Despliegue

Después de desplegar, verifica:

1. **Network Tab (F12)**: Las peticiones van a `http://mc.nightslayer.com.ar:3001/api/*`
2. **Console Tab**: Sin errores de conexión o CORS
3. **Login**: Funciona sin pedir acceso a localhost
4. **WebSocket**: Los logs en tiempo real aparecen correctamente
5. **Navegación**: Refrescar en `/dashboard` no da 404

## Notas Importantes

- En producción, el backend sirve tanto la API como el frontend
- Las URLs son relativas, funcionan en cualquier dominio automáticamente
- Para cambios en el frontend, es necesario recompilar (`build`)
- El modo desarrollo sigue disponible para trabajar localmente con hot reload
- Rebuild si cambias el dominio o necesitas actualizar el frontend
