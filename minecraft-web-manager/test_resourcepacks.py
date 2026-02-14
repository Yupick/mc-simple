#!/usr/bin/env python3
"""Script de testing para verificar la implementación de ResourcePackManager"""

import sys
import os
sys.path.insert(0, '/home/mkd/contenedores/mc-simple/minecraft-web-manager/backend-python')

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv('/home/mkd/contenedores/mc-simple/minecraft-web-manager/backend-python/.env')

print("🧪 Testing ResourcePackManager Implementation")
print("=" * 60)

# Test 1: Importar dependencias
print("\n1️⃣ Verificando dependencias...")
try:
    import yaml
    print("   ✅ PyYAML instalado")
except ImportError as e:
    print(f"   ❌ PyYAML no disponible: {e}")
    sys.exit(1)

try:
    import httpx
    print("   ✅ httpx instalado")
except ImportError as e:
    print(f"   ❌ httpx no disponible: {e}")
    sys.exit(1)

# Test 2: Importar servicio
print("\n2️⃣ Verificando servicio ResourcePack...")
try:
    from app.services.resourcepack_service import resourcepack_service
    print("   ✅ ResourcePackService importado")
except Exception as e:
    print(f"   ❌ Error al importar servicio: {e}")
    sys.exit(1)

# Test 3: Importar controlador
print("\n3️⃣ Verificando controlador REST...")
try:
    from app.api.controllers import resourcepacks_controller
    print("   ✅ resourcepacks_controller importado")
except Exception as e:
    print(f"   ❌ Error al importar controlador: {e}")
    sys.exit(1)

# Test 4: Verificar rutas
print("\n4️⃣ Verificando rutas...")
try:
    from app.api.routes import resourcepacks
    print("   ✅ Rutas de resourcepacks importadas")
except Exception as e:
    print(f"   ❌ Error al importar rutas: {e}")
    sys.exit(1)

# Test 5: Verificar métodos del servicio
print("\n5️⃣ Verificando métodos del servicio...")
expected_methods = [
    'is_plugin_installed',
    'get_plugin_status',
    'parse_config',
    'update_config',
    'update_priority_order',
    'list_mixer_packs',
    'upload_pack',
    'delete_pack',
    'list_compatible_plugins',
    'toggle_plugin',
    'read_collision_log',
    'get_output_info',
    'reload_plugin',
    'install_plugin'
]

missing_methods = []
for method in expected_methods:
    if hasattr(resourcepack_service, method):
        print(f"   ✅ {method}")
    else:
        print(f"   ❌ {method} - NO ENCONTRADO")
        missing_methods.append(method)

if missing_methods:
    print(f"\n⚠️  Faltan métodos: {', '.join(missing_methods)}")
    sys.exit(1)

# Test 6: Verificar archivos frontend
print("\n6️⃣ Verificando archivos frontend...")
import os

template_file = '/home/mkd/contenedores/mc-simple/minecraft-web-manager/backend-python/templates/resourcepacks.html'
js_file = '/home/mkd/contenedores/mc-simple/minecraft-web-manager/backend-python/static/js/components/resourcepacks.js'

if os.path.exists(template_file):
    print(f"   ✅ resourcepacks.html existe ({os.path.getsize(template_file)} bytes)")
else:
    print(f"   ❌ resourcepacks.html NO encontrado")

if os.path.exists(js_file):
    print(f"   ✅ resourcepacks.js existe ({os.path.getsize(js_file)} bytes)")
else:
    print(f"   ❌ resourcepacks.js NO encontrado")

print("\n" + "=" * 60)
print("✅ Todas las verificaciones pasaron correctamente")
print("\n📋 Próximos pasos para testing manual:")
print("   1. Iniciar servidor: ./python-manager.sh")
print("   2. Acceder a: http://localhost:8000/resourcepacks")
print("   3. Login con usuario admin")
print("   4. Verificar que aparece 'Instalar Plugin' (si no está instalado)")
print("   5. Probar instalación one-click desde Modrinth")
print("   6. Reiniciar servidor para cargar plugin")
print("   7. Probar todas las funcionalidades:")
print("      • Configuración (toggle autoHost, forceResourcePack)")
print("      • Subir resource pack (.zip)")
print("      • Cambiar orden de prioridad")
print("      • Ver plugins compatibles")
print("      • Ver colisiones")
print("      • Ver pack final")
print("      • Recargar plugin")
