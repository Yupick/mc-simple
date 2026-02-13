import { runMigrations } from './db.js';

// Script para ejecutar migraciones
console.log('📦 Sistema de Migraciones - Minecraft Manager');
console.log('='.repeat(50));

try {
  runMigrations();
  console.log('\n✨ Base de datos lista para usar');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error en las migraciones:', error);
  process.exit(1);
}
