#!/usr/bin/env python3
"""
Script de administración para Minecraft Web Manager (Python)
Uso: python manager.py {setup|start|stop|status}
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

# Colores para output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

# Rutas
BASE_DIR = Path(__file__).parent
BACKEND_DIR = BASE_DIR / "backend-python"
VENV_DIR = BACKEND_DIR / "venv"
PID_FILE = BACKEND_DIR / ".pid"
LOG_FILE = BACKEND_DIR / "logs" / "server.log"
PYTHON_BIN = VENV_DIR / "bin" / "python"
UVICORN_BIN = VENV_DIR / "bin" / "uvicorn"

def print_color(message, color):
    """Imprimir mensaje con color"""
    print(f"{color}{message}{Colors.NC}")

def print_info(message):
    print_color(f"ℹ️  {message}", Colors.BLUE)

def print_success(message):
    print_color(f"✅ {message}", Colors.GREEN)

def print_error(message):
    print_color(f"❌ {message}", Colors.RED)

def print_warning(message):
    print_color(f"⚠️  {message}", Colors.YELLOW)

def check_venv():
    """Verificar si existe el entorno virtual"""
    return VENV_DIR.exists() and PYTHON_BIN.exists()

def create_venv():
    """Crear entorno virtual"""
    print_info("Creando entorno virtual...")
    subprocess.run([sys.executable, "-m", "venv", str(VENV_DIR)], check=True)
    print_success("Entorno virtual creado")

def install_dependencies():
    """Instalar dependencias de requirements.txt"""
    print_info("Instalando dependencias...")
    requirements_file = BACKEND_DIR / "requirements.txt"
    
    if not requirements_file.exists():
        print_error("No se encontró requirements.txt")
        sys.exit(1)
    
    subprocess.run([
        str(PYTHON_BIN),
        "-m",
        "pip",
        "install",
        "--upgrade",
        "pip"
    ], check=True)
    
    subprocess.run([
        str(PYTHON_BIN),
        "-m",
        "pip",
        "install",
        "-r",
        str(requirements_file)
    ], check=True)
    
    print_success("Dependencias instaladas")

def create_directories():
    """Crear directorios necesarios"""
    print_info("Creando directorios...")
    dirs = [
        BACKEND_DIR / "data",
        BACKEND_DIR / "logs"
    ]
    for dir_path in dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
    print_success("Directorios creados")

def check_env_file():
    """Verificar y crear archivo .env si no existe"""
    env_file = BACKEND_DIR / ".env"
    env_example = BACKEND_DIR / ".env.example"
    
    if not env_file.exists():
        if env_example.exists():
            print_info("Copiando .env.example a .env...")
            import shutil
            shutil.copy(env_example, env_file)
            print_warning("⚠️  IMPORTANTE: Edita el archivo .env con tus configuraciones")
        else:
            print_warning("No se encontró .env ni .env.example")
    else:
        print_success("Archivo .env encontrado")

def run_migrations():
    """Ejecutar migraciones de base de datos"""
    print_info("Ejecutando migraciones de base de datos...")
    
    # Cambiar al directorio backend-python
    os.chdir(BACKEND_DIR)
    
    # Ejecutar script de inicialización de DB
    result = subprocess.run([
        str(PYTHON_BIN),
        "-c",
        "from app.db.session import init_db; init_db()"
    ])
    
    if result.returncode == 0:
        print_success("Migraciones completadas")
    else:
        print_warning("Hubo un problema con las migraciones")

def create_admin():
    """Crear usuario admin"""
    print_info("Creando usuario administrador...")
    
    os.chdir(BACKEND_DIR)
    
    result = subprocess.run([
        str(PYTHON_BIN),
        "-m",
        "app.scripts.create_admin"
    ])
    
    if result.returncode == 0:
        print_success("Usuario admin creado")
    else:
        print_warning("Hubo un problema al crear el admin")

def get_pid():
    """Obtener PID del proceso si existe"""
    if not PID_FILE.exists():
        return None
    
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
        
        # Verificar si el proceso existe
        try:
            os.kill(pid, 0)
            return pid
        except OSError:
            # Proceso no existe, eliminar PID file
            PID_FILE.unlink()
            return None
    except (ValueError, FileNotFoundError):
        return None

def is_running():
    """Verificar si el servidor está corriendo"""
    return get_pid() is not None

def setup():
    """Setup inicial del proyecto"""
    print_color("\n=== SETUP INICIAL ===\n", Colors.BLUE)
    
    # 1. Verificar/crear venv
    if not check_venv():
        create_venv()
    else:
        print_success("Entorno virtual ya existe")
    
    # 2. Instalar dependencias
    install_dependencies()
    
    # 3. Crear directorios
    create_directories()
    
    # 4. Verificar .env
    check_env_file()
    
    # 5. Ejecutar migraciones
    run_migrations()
    
    # 6. Crear admin
    create_admin()
    
    print_color("\n✅ Setup completado exitosamente!\n", Colors.GREEN)
    print_info("Para iniciar el servidor ejecuta: python manager.py start")

def start(port=8000, host="0.0.0.0"):
    """Iniciar servidor"""
    if is_running():
        print_error("El servidor ya está corriendo")
        print_info(f"PID: {get_pid()}")
        sys.exit(1)
    
    if not check_venv():
        print_error("Entorno virtual no encontrado. Ejecuta: python manager.py setup")
        sys.exit(1)
    
    print_info(f"Iniciando servidor en {host}:{port}...")
    
    # Asegurar que existe el directorio de logs
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # Cambiar al directorio backend-python
    os.chdir(BACKEND_DIR)
    
    # Abrir archivo de log
    log_file = open(LOG_FILE, 'a')
    
    # Iniciar proceso
    process = subprocess.Popen(
        [
            str(UVICORN_BIN),
            "main:app_socketio",
            "--host", host,
            "--port", str(port),
            "--reload"  # Hot reload para desarrollo
        ],
        stdout=log_file,
        stderr=subprocess.STDOUT
    )
    
    # Guardar PID
    with open(PID_FILE, 'w') as f:
        f.write(str(process.pid))
    
    # Esperar un momento para verificar que inició correctamente
    time.sleep(2)
    
    if process.poll() is None:
        print_success(f"Servidor iniciado correctamente (PID: {process.pid})")
        print_info(f"URL: http://{host}:{port}")
        print_info(f"Docs: http://{host}:{port}/docs")
        print_info(f"Logs: {LOG_FILE}")
    else:
        print_error("Error al iniciar el servidor")
        print_info("Revisa los logs para más detalles")
        sys.exit(1)

def stop():
    """Detener servidor"""
    pid = get_pid()
    
    if not pid:
        print_warning("El servidor no está corriendo")
        return
    
    print_info(f"Deteniendo servidor (PID: {pid})...")
    
    try:
        # Enviar SIGTERM
        os.kill(pid, signal.SIGTERM)
        
        # Esperar hasta 10 segundos
        for _ in range(10):
            try:
                os.kill(pid, 0)
                time.sleep(1)
            except OSError:
                break
        
        # Si todavía está corriendo, SIGKILL
        try:
            os.kill(pid, 0)
            print_warning("Proceso no respondió, forzando cierre...")
            os.kill(pid, signal.SIGKILL)
        except OSError:
            pass
        
        # Eliminar PID file
        if PID_FILE.exists():
            PID_FILE.unlink()
        
        print_success("Servidor detenido")
    
    except Exception as e:
        print_error(f"Error al detener servidor: {e}")
        sys.exit(1)

def status():
    """Mostrar estado del servidor"""
    print_color("\n=== ESTADO DEL SERVIDOR ===\n", Colors.BLUE)
    
    pid = get_pid()
    
    if pid:
        print_success(f"Servidor corriendo (PID: {pid})")
        
        # Intentar obtener info del proceso
        try:
            import psutil
            p = psutil.Process(pid)
            print_info(f"CPU: {p.cpu_percent(interval=1)}%")
            print_info(f"RAM: {p.memory_info().rss / 1024 / 1024:.2f} MB")
            print_info(f"Iniciado: {time.ctime(p.create_time())}")
        except ImportError:
            print_info("Instala psutil para ver más detalles: pip install psutil")
        except Exception as e:
            print_warning(f"No se pudo obtener info del proceso: {e}")
    else:
        print_warning("Servidor detenido")
    
    print()

def show_usage():
    """Mostrar uso del script"""
    print("""
Minecraft Web Manager - Script de Administración

Uso: python manager.py {comando} [opciones]

Comandos:
  setup         Instalación inicial (venv, deps, DB, admin)
  start         Iniciar servidor (dev y prod son iguales)
  stop          Detener servidor
  status        Mostrar estado del servidor

Opciones para 'start':
  --port PORT   Puerto del servidor (default: 8000)
  --host HOST   Host del servidor (default: 0.0.0.0)

Ejemplos:
  python manager.py setup
  python manager.py start
  python manager.py start --port 8080
  python manager.py stop
  python manager.py status
""")

def main():
    if len(sys.argv) < 2:
        show_usage()
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "setup":
        setup()
    
    elif command == "start":
        # Parsear argumentos opcionales
        port = 8000
        host = "0.0.0.0"
        
        for i, arg in enumerate(sys.argv[2:], start=2):
            if arg == "--port" and i + 1 < len(sys.argv):
                port = int(sys.argv[i + 1])
            elif arg == "--host" and i + 1 < len(sys.argv):
                host = sys.argv[i + 1]
        
        start(port, host)
    
    elif command == "stop":
        stop()
    
    elif command == "status":
        status()
    
    else:
        print_error(f"Comando desconocido: {command}")
        show_usage()
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n")
        print_warning("Operación cancelada por el usuario")
        sys.exit(0)
    except Exception as e:
        print_error(f"Error inesperado: {e}")
        sys.exit(1)
