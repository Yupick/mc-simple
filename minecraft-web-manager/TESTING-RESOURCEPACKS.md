# 🧪 Guía de Testing - ResourcePackManager

**Fecha:** 14 de febrero de 2026  
**Branch:** feature/resource-pack-manager  
**Estado:** ✅ Servidor corriendo en http://localhost:8000

---

## ✅ Pre-requisitos completados

- [x] Dependencias instaladas (PyYAML, httpx, mcrcon)
- [x] Archivos backend creados (service, controller, routes)
- [x] Archivos frontend creados (HTML, JS)
- [x] Integración en main.py y sidebar
- [x] Servidor iniciado en puerto 8000

---

## 📋 Checklist de Testing Manual

### 1. Acceso Inicial ⏱️ 2 min

- [ ] Abrir navegador en: http://localhost:8000/login
- [ ] Login con credenciales (admin/password o las configuradas)
- [ ] Verificar que aparece "Resource Packs" en el sidebar (sección Administración)
- [ ] Click en "Resource Packs" en el sidebar
- [ ] URL debe ser: http://localhost:8000/resourcepacks

**Resultado esperado:** Página carga correctamente con aviso amarillo sobre la limitación de multimundo

---

### 2. Estado del Plugin ⏱️ 1 min

**Escenario A: Plugin NO instalado**
- [ ] Ver card superior con estado "● ResourcePackManager"
- [ ] Punto indicador en gris (plugin no instalado)
- [ ] Botón "Instalar Plugin" visible
- [ ] Mensaje: "Plugin no instalado"
- [ ] Tabs NO visibles (solo se muestran con plugin instalado)

**Escenario B: Plugin instalado**
- [ ] Punto indicador en verde
- [ ] Versión del plugin visible (ej: v1.7.3)
- [ ] Botón "Recargar" visible
- [ ] Tabs visibles (6 tabs: Config, Prioridades, Packs, Plugins, Colisiones, Output)

---

### 3. Instalación del Plugin ⏱️ 3-5 min

**Si el plugin NO está instalado:**

- [ ] Click en botón "Instalar Plugin"
- [ ] Aparece confirmación: "¿Descargar e instalar ResourcePackManager desde Modrinth?"
- [ ] Aceptar confirmación
- [ ] Ver notificación: "Plugin instalado. Reinicia el servidor para aplicar cambios."
- [ ] Verificar que el archivo existe: `server/plugins/ResourcePackManager.jar`

**Reiniciar servidor:**

```bash
# En otra terminal:
cd /home/mkd/contenedores/mc-simple
./stop.sh  # o script de parada
./start.sh # o script de inicio
```

- [ ] Esperar a que el servidor Minecraft inicie completamente
- [ ] Actualizar página web (F5)
- [ ] Verificar que ahora el estado muestra "Plugin instalado" en verde
- [ ] Verificar que aparecen los 6 tabs

---

### 4. Tab: Configuración ⏱️ 2 min

- [ ] Click en tab "Configuración"
- [ ] Ver 2 switches:
  - "Auto Host" - Alojar automáticamente el pack final
  - "Forzar Resource Pack" - Obligar a los jugadores a usarlo
- [ ] Ver campo de texto: "Mensaje al Jugador"

**Acciones:**
- [ ] Activar "Auto Host" → Ver notificación "Configuración guardada"
- [ ] Activar "Forzar Resource Pack" → Ver notificación
- [ ] Cambiar mensaje en textarea → Blur (hacer click fuera) → Ver notificación
- [ ] Verificar en `server/plugins/ResourcePackManager/config.yml`:
  ```yaml
  autoHost: true
  forceResourcePack: true
  resourcePackPrompt: "Tu mensaje personalizado"
  ```

---

### 5. Tab: Resource Packs ⏱️ 5 min

- [ ] Click en tab "Resource Packs"
- [ ] Ver mensaje: "No hay resource packs subidos" (si es primera vez)
- [ ] Ver botón "Subir Pack" (verde, con ícono upload)

**Subir un pack:**

Necesitas un archivo .zip de resource pack de prueba. Puedes:
- Crear uno simple con estructura básica
- Descargar uno de ejemplo de internet
- Usar cualquier .zip temporal para probar la validación

- [ ] Click en "Subir Pack"
- [ ] Se abre modal con título "Subir Resource Pack"
- [ ] Selector de archivo visible
- [ ] Nota: "Tamaño máximo: 100 MB"

**Pruebas de validación:**
- [ ] Intentar subir archivo .txt → Ver error: "Solo se permiten archivos .zip"
- [ ] Intentar subir .zip > 100MB → Ver error: "Archivo demasiado grande"
- [ ] Seleccionar .zip válido < 100MB → Ver nombre y tamaño en el modal
- [ ] Click en "Subir" → Ver progress bar (animación rápida si es pequeño)
- [ ] Ver notificación: "Pack subido exitosamente"
- [ ] Modal se cierra automáticamente
- [ ] Ver card con el pack subido:
  - Ícono morado de package
  - Nombre del archivo
  - Tamaño en MB
  - Fecha de modificación
  - Botón rojo de eliminar (trash icon)

**Eliminar un pack:**
- [ ] Click en ícono de papelera en un pack
- [ ] Confirmar eliminación
- [ ] Ver notificación: "Pack eliminado"
- [ ] Card desaparece de la lista
- [ ] Verificar que el archivo fue eliminado de `server/plugins/ResourcePackManager/mixer/`

---

### 6. Tab: Prioridades ⏱️ 3 min

- [ ] Click en tab "Prioridades"
- [ ] Ver mensaje azul explicando el orden de prioridad
- [ ] Ver lista de packs con números de prioridad (1, 2, 3...)

**Si tienes al menos 2 packs subidos:**
- [ ] Ver botones de flecha arriba (↑) y abajo (↓) en cada pack
- [ ] El pack #1 tiene flecha arriba deshabilitada
- [ ] El último pack tiene flecha abajo deshabilitada
- [ ] Click en flecha abajo del pack #1 → Se intercambia con pack #2
- [ ] Ver notificación: "Prioridad actualizada"
- [ ] Los números se actualizan inmediatamente
- [ ] Click en flecha arriba del nuevo pack #2 → Vuelve a su posición original
- [ ] Verificar en `server/plugins/ResourcePackManager/config.yml`:
  ```yaml
  priorityOrder:
    - pack1.zip
    - pack2.zip
  ```

---

### 7. Tab: Plugins Compatibles ⏱️ 2 min

- [ ] Click en tab "Plugins Compatibles"
- [ ] Ver mensaje azul explicando los plugins compatibles
- [ ] Ver lista de plugins detectados (si hay alguno instalado como ItemsAdder, Oraxen, etc.)
- [ ] Si no hay plugins: "No se detectaron plugins compatibles instalados"

**Si hay plugins compatibles:**
- [ ] Ver cards con ícono de plug
- [ ] Color verde = integrado, gris = disponible
- [ ] Estado: "Integrado" o "Disponible"
- [ ] Botón "Habilitar" o "Deshabilitar"
- [ ] Click en botón → Ver notificación con estado cambiado
- [ ] Color y texto del card se actualizan
- [ ] Verificar que se creó/eliminó archivo en `server/plugins/ResourcePackManager/compatible_plugins/`

---

### 8. Tab: Colisiones ⏱️ 2 min

- [ ] Click en tab "Colisiones"
- [ ] Ver mensaje amarillo explicando el log de colisiones
- [ ] Ver área de texto con fondo oscuro (estilo terminal)
- [ ] Si no hay colisiones: "No hay colisiones registradas"
- [ ] Si hay colisiones: Ver contenido del log con rutas de archivos duplicados
- [ ] Botón "Actualizar" visible
- [ ] Click en "Actualizar" → Contenido se recarga
- [ ] Verificar que lee de `server/plugins/ResourcePackManager/collision_log.txt`

---

### 9. Tab: Pack Final ⏱️ 2 min

- [ ] Click en tab "Pack Final"
- [ ] Ver mensaje verde explicando el pack fusionado
- [ ] Si no hay pack generado: "No hay pack final generado aún"

**Si hay pack generado (después de recargar plugin con packs subidos):**
- [ ] Ver card con información:
  - Ícono verde de archivo
  - Nombre: "ResourcePackManager_RSP.zip"
  - Tamaño en MB
  - Última modificación (fecha y hora)
  - SHA-1 Hash (código alfanumérico largo)
- [ ] Verificar que el archivo existe en `server/plugins/ResourcePackManager/output/ResourcePackManager_RSP.zip`

---

### 10. Recarga del Plugin ⏱️ 2 min

**Requisitos:** Servidor Minecraft corriendo, RCON configurado

- [ ] Click en botón "Recargar" (verde, arriba a la derecha)
- [ ] Aparece confirmación: "¿Recargar plugin? Esto regenerará el pack final."
- [ ] Aceptar confirmación
- [ ] Ver notificación: "Plugin recargado exitosamente"
- [ ] En consola del servidor Minecraft debería aparecer: `[ResourcePackManager] Reloading...`
- [ ] Tab "Pack Final" debería mostrar nueva fecha de modificación
- [ ] Si el servidor no tiene RCON: Ver error: "Error al recargar plugin. Verifica RCON."

---

### 11. Verificación de Consola del Servidor ⏱️ 1 min

En la consola del servidor Minecraft deberías ver:

```
[ResourcePackManager] Enabling ResourcePackManager v1.7.3
[ResourcePackManager] Loading configuration...
[ResourcePackManager] Found X resource packs in mixer/
[ResourcePackManager] Merging resource packs...
[ResourcePackManager] Generated final pack: ResourcePackManager_RSP.zip (X.XX MB)
[ResourcePackManager] Auto-hosting enabled: serving at http://...
```

- [ ] Verificar logs del plugin
- [ ] Comprobar que no hay errores en la consola

---

### 12. Prueba con Jugador Real ⏱️ 5 min

**Si tienes el servidor corriendo:**

- [ ] Conectar con cliente Minecraft al servidor
- [ ] Al entrar debería aparecer prompt: "¿Descargar resource pack del servidor?"
- [ ] Si `forceResourcePack: true`: El jugador DEBE aceptar o no podrá entrar
- [ ] Aceptar el pack
- [ ] Verificar que se descarga y aplica correctamente
- [ ] Verificar que los recursos del pack se ven en el juego

---

### 13. Pruebas de Seguridad/Edge Cases ⏱️ 3 min

- [ ] Intentar acceder a /resourcepacks sin login → Redirige a /login
- [ ] Intentar upload de archivo .exe renombrado a .zip → Debería subir (el plugin validará internamente)
- [ ] Intentar upload simultáneo de 2 packs → Ambos deberían subir correctamente
- [ ] Intentar eliminar pack que no existe → Error 404
- [ ] Intentar recargar plugin con servidor apagado → Error de RCON
- [ ] Verificar que archivos .zip quedan en `mixer/` después de upload
- [ ] Verificar que `config.yml` se actualiza correctamente con cada cambio

---

### 14. Pruebas de UI/UX ⏱️ 3 min

- [ ] Los tabs cambian correctamente sin recargar página
- [ ] Los íconos de Lucide se renderizan correctamente
- [ ] El sidebar muestra "Resource Packs" con ícono de package
- [ ] Hover en elementos interactivos muestra efecto visual
- [ ] Botones deshabilitados tienen opacity reducida y cursor not-allowed
- [ ] Notificaciones aparecen y desaparecen correctamente
- [ ] Modal se puede cerrar con X o con click fuera (solo si no está uploading)
- [ ] Progress bar se anima durante upload
- [ ] Responsive: probar en ventana reducida (tabs deberían ajustarse)

---

## 🐛 Bugs Conocidos/Esperados

1. **RCON no configurado:** Si el servidor no tiene RCON habilitado, el botón "Recargar" fallará. Esto es esperado.
2. **Plugin no soporta multimundo:** El aviso amarillo informa correctamente de esta limitación.
3. **Validación de .zip:** El backend solo valida extensión, no contenido. El plugin de Minecraft validará internamente.

---

## 📊 Resultados Esperados

Al finalizar todos los tests:

- ✅ **Backend:** Service, controller y routes funcionando sin errores
- ✅ **Frontend:** HTML renderiza correctamente, Alpine.js funciona
- ✅ **API:** Todos los endpoints responden correctamente
- ✅ **Integración:** Sidebar, rutas y templates conectados
- ✅ **Funcionalidad:** Upload, delete, config, prioridades, reload funcionan
- ✅ **UX:** Interfaz responsiva, notificaciones, validaciones

---

## 🚀 Próximos Pasos (después del testing)

1. **Documentar issues encontrados** (si los hay)
2. **Crear Pull Request:**
   ```bash
   # El enlace ya está generado:
   https://github.com/Yupick/mc-simple/pull/new/feature/resource-pack-manager
   ```
3. **Describir en el PR:**
   - Funcionalidades implementadas
   - Screenshots de la interfaz
   - Resultados de testing
   - Notas sobre limitaciones conocidas

4. **Merge a develop** (después de revisión)

---

## 📝 Notas Adicionales

- **Servidor de desarrollo corriendo en:** http://localhost:8000
- **Terminal ID del servidor:** 64ce8de0-3b42-4495-8afe-4d4eed7c69cf
- **Para detener el servidor:** Ctrl+C en la terminal o `kill_terminal` en Copilot

**Logs del servidor en:**
- Backend: Salida de uvicorn en terminal
- Minecraft: `server/logs/latest.log`
- Plugin: Logs mezclados con los del servidor

---

¡Buena suerte con el testing! 🎉
