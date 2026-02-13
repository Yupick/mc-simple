"""
Script para crear usuario administrador
"""
import sys
import os
from getpass import getpass

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.db.session import SessionLocal, init_db
from app.models.user import User
from app.core.security import get_password_hash


def create_admin():
    """Crear usuario administrador interactivamente"""
    
    print("\n" + "="*50)
    print("  Crear Usuario Administrador")
    print("="*50 + "\n")
    
    # Inicializar DB primero
    init_db()
    
    # Solicitar datos
    username = input("Username: ").strip()
    
    if not username:
        print("❌ El username no puede estar vacío")
        sys.exit(1)
    
    # Verificar si ya existe
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            print(f"❌ El usuario '{username}' ya existe")
            sys.exit(1)
        
        # Solicitar password
        while True:
            password = getpass("Password: ")
            password_confirm = getpass("Confirmar password: ")
            
            if not password:
                print("❌ El password no puede estar vacío")
                continue
            
            if password != password_confirm:
                print("❌ Los passwords no coinciden, intenta de nuevo")
                continue
            
            if len(password) < 6:
                print("❌ El password debe tener al menos 6 caracteres")
                continue
            
            # Bcrypt tiene límite de 72 bytes
            if len(password.encode('utf-8')) > 72:
                print("⚠️  Password muy largo, se truncará a 72 bytes")
                password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
            
            break
        
        # Crear usuario
        user = User(
            username=username,
            password_hash=get_password_hash(password),
            role="admin"
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"\n✅ Usuario admin '{username}' creado exitosamente!")
        print(f"   ID: {user.id}")
        print(f"   Role: {user.role}")
        print(f"   Creado: {user.created_at}\n")
        
    except Exception as e:
        print(f"\n❌ Error al crear usuario: {e}\n")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
