# 🔧 Solución al Problema de Pantalla Negra

## 🐛 Problema Detectado

La pantalla negra se debió a múltiples factores:

### 1. **Procesos Zombies de Vite**
Había múltiples procesos de Vite corriendo en diferentes puertos (5173, 5174, 5175, 5176, 5177) que causaban conflictos.

### 2. **Dashboard Complejo**
El componente `DashboardHome.jsx` complejo con todas las importaciones de componentes nuevos puede estar causando errores en tiempo de ejecución.

---

## ✅ Soluciones Implementadas

### 1. **Limpieza de Procesos Zombies**
```bash
pkill -9 -f "vite"
./web-manager.sh stop
./web-manager.sh start
```

### 2. **Dashboard Simplificado (Temporal)**
Se reemplazó temporalmente el dashboard complejo con una versión simple para diagnosticar:

**Archivo:** `frontend/src/pages/DashboardHome.jsx`

```jsx
import { useAuth } from '../hooks/useAuth.jsx';

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          ¡Bienvenido, {user?.username}!
        </h1>
        <p className="text-text-secondary mt-2">
          Panel de administración de servidor Minecraft Paper
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Sistema Operativo
        </h2>
        <p className="text-text-secondary">
          El panel web se está cargando correctamente con el nuevo diseño Azure Clean.
        </p>
      </div>
    </div>
  );
}
```

### 3. **Script web-manager.sh Actualizado**
Se agregó verificación e instalación automática de las nuevas dependencias del diseño:

```bash
# Instalar dependencias adicionales del diseño (si no están instaladas)
print_message "$BLUE" "Verificando dependencias del diseño..."
cd "$FRONTEND_DIR"
if ! npm list lucide-react > /dev/null 2>&1; then
    print_message "$YELLOW" "Instalando dependencias del diseño Azure Clean..."
    npm install lucide-react @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-avatar framer-motion
    print_message "$GREEN" "✓ Dependencias del diseño instaladas"
else
    print_message "$GREEN" "✓ Dependencias del diseño ya instaladas"
fi
```

---

## 🔍 Diagnóstico del Problema Original

El dashboard complejo incluye:
- Importaciones de componentes personalizados (Card, Badge, Button)
- Hook `useServerStatus` que hace llamadas API
- Múltiples íconos de lucide-react
- Animaciones y efectos

**Posibles causas del error:**
1. ❌ Componente no encuentra datos del servidor (API no responde)
2. ❌ Error en el hook `useServerStatus`
3. ❌ Problema con las animaciones CSS personalizadas
4. ❌ Error en los componentes Card/Badge/Button

---

## 🚀 Estado Actual del Sistema

**Sistema:** ✅ Operativo
- Backend: Puerto 3001 (PID: 101835)
- Frontend: Puerto 5173 (PID: 101881)
- Dashboard: Versión simplificada funcionando

---

## 📋 Próximos Pasos Recomendados

### Paso 1: Prueba el Panel Actual
Accede a http://localhost:5173 y verifica que:
- ✅ La página de login carga correctamente (diseño blanco/celeste)
- ✅ Puedes hacer login con usuario `admin`
- ✅ El dashboard simple muestra "¡Bienvenido, admin!"
- ✅ El sidebar está visible con categorías expandibles
- ✅ El header muestra breadcrumbs

### Paso 2: Revisar Errores en el Navegador
Abre la consola del navegador (F12) y busca errores JavaScript:
- Errores de importación
- Errores de API
- Errores de componentes

### Paso 3: Restaurar Dashboard Completo (Cuando esté listo)
Una vez confirmado que todo funciona:

```bash
cd /home/mkd/contenedores/mc-simple/minecraft-web-manager/frontend/src/pages
mv DashboardHome.jsx DashboardHome.simple.jsx
mv DashboardHome.complex.jsx DashboardHome.jsx
```

**Pero ANTES:**
1. Verifica que el endpoint `/api/server/status` funciona:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/server/status
   ```

2. Revisa que todos los componentes se importen correctamente

3. Asegúrate de que no haya errores en la consola del navegador

---

## 🛠️ Scripts de Verificación

### Verificar dependencias instaladas
```bash
cd frontend
npm list lucide-react @radix-ui/react-tabs @radix-ui/react-dropdown-menu
```

### Limpiar y reinstalar dependencias
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm install lucide-react @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-avatar framer-motion
```

### Reiniciar sistema limpiamente
```bash
./web-manager.sh stop
pkill -9 -f "vite"
pkill -9 -f "node.*backend"
sleep 2
./web-manager.sh start
```

---

## 📁 Archivos Importantes

**Dashboard Simple (Actual):**
`frontend/src/pages/DashboardHome.jsx`

**Dashboard Completo (Backup):**
`frontend/src/pages/DashboardHome.complex.jsx`

**Script Actualizado:**
`web-manager.sh` - Ahora incluye instalación automática de dependencias del diseño

---

## ✨ Recomendación Final

**Para debugging:**
1. Mantén la versión simple del dashboard
2. Ve agregando componentes uno por uno desde el complejo
3. Prueba después de cada adición
4. Identifica exactamente qué componente causa el error

**Orden de prueba sugerido:**
1. ✅ Dashboard simple (funcionando ahora)
2. ➡️ Agregar solo el widget de estado del servidor
3. ➡️ Agregar solo las cards de estadísticas (sin useServerStatus)
4. ➡️ Agregar el useServerStatus
5. ➡️ Agregar acciones rápidas
6. ➡️ Completar con todos los elementos

Esto ayudará a identificar exactamente dónde está el problema.

---

## 🎯 Estado de las Dependencias

**Instaladas y Verificadas:**
- ✅ lucide-react@0.563.0
- ✅ @radix-ui/react-tabs@1.1.13
- ✅ @radix-ui/react-dropdown-menu
- ✅ @radix-ui/react-avatar
- ✅ framer-motion

**Actualizado en web-manager.sh:**
- ✅ Setup ahora instala automáticamente las dependencias del diseño
- ✅ Verifica si lucide-react está instalado antes de instalar
