import readline from 'readline';
import dotenv from 'dotenv';
import { runMigrations } from '../database/db.js';
import User from '../models/User.js';

// Cargar variables de entorno
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  console.log('\n🔐 Crear Usuario Administrador');
  console.log('='.repeat(50));

  try {
    // Ejecutar migraciones
    console.log('\n📦 Verificando base de datos...');
    runMigrations();

    // Verificar si ya existe un usuario admin
    const existingAdmins = User.findAll().filter(u => u.role === 'admin');
    if (existingAdmins.length > 0) {
      console.log('\n⚠️  Ya existen usuarios administradores:');
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.username} (ID: ${admin.id})`);
      });

      const confirm = await question('\n¿Deseas crear otro usuario admin? (s/n): ');
      if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'si') {
        console.log('\n❌ Operación cancelada');
        rl.close();
        return;
      }
    }

    // Solicitar datos del usuario
    console.log('\nIngresa los datos del nuevo usuario administrador:\n');

    const username = await question('Username: ');
    if (!username || username.trim().length === 0) {
      console.log('\n❌ El username no puede estar vacío');
      rl.close();
      return;
    }

    // Verificar si el username ya existe
    const existingUser = User.findByUsername(username);
    if (existingUser) {
      console.log(`\n❌ El usuario "${username}" ya existe`);
      rl.close();
      return;
    }

    const password = await question('Password (mínimo 6 caracteres): ');
    if (!password || password.length < 6) {
      console.log('\n❌ La contraseña debe tener al menos 6 caracteres');
      rl.close();
      return;
    }

    const confirmPassword = await question('Confirmar password: ');
    if (password !== confirmPassword) {
      console.log('\n❌ Las contraseñas no coinciden');
      rl.close();
      return;
    }

    // Crear usuario
    console.log('\n📝 Creando usuario...');
    const user = User.create({
      username,
      password,
      role: 'admin'
    });

    console.log('\n✅ Usuario administrador creado exitosamente!');
    console.log('\nDetalles del usuario:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Creado: ${user.created_at}`);
    console.log('\n✨ Ya puedes iniciar sesión con este usuario');

  } catch (error) {
    console.error('\n❌ Error al crear usuario:', error);
  } finally {
    rl.close();
  }
}

// Ejecutar
createAdminUser();
