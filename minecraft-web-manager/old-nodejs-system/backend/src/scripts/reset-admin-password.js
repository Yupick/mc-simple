import dotenv from 'dotenv';
import { runMigrations } from '../database/db.js';
import User from '../models/User.js';

// Cargar variables de entorno
dotenv.config();

async function resetAdminPassword() {
  console.log('\n🔐 Resetear Contraseña de Admin');
  console.log('='.repeat(50));

  try {
    // Ejecutar migraciones
    console.log('\n📦 Verificando base de datos...');
    runMigrations();

    // Buscar usuario admin
    const adminUser = User.findByUsername('admin');

    if (!adminUser) {
      console.log('\n❌ No existe un usuario "admin"');
      console.log('💡 Crea uno con: npm run create-admin');
      return;
    }

    // Nueva contraseña: minecraft123
    const newPassword = 'minecraft123';

    // Actualizar contraseña
    User.changePassword(adminUser.id, newPassword);

    console.log('\n✅ Contraseña reseteada exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log(`   Username: admin`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña después de iniciar sesión');

  } catch (error) {
    console.error('\n❌ Error al resetear contraseña:', error);
  }
}

// Ejecutar
resetAdminPassword();
