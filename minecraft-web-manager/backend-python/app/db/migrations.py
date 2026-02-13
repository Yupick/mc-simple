"""Script para crear tablas de base de datos"""
from app.db.session import engine
from app.db.base import Base


def init_db():
    """Crear todas las tablas en la base de datos"""
    print("Creando tablas de base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas exitosamente")


if __name__ == "__main__":
    init_db()
