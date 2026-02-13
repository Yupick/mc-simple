import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { runMigrations } from './database/db.js';
import Session from './models/Session.js';
import { setupLogsSocket } from './sockets/logs.socket.js';
import { setupStatusSocket } from './sockets/status.socket.js';

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3001;

// Ejecutar migraciones al iniciar
console.log('🚀 Iniciando servidor...');
console.log('📦 Ejecutando migraciones de base de datos...');
try {
  runMigrations();
  console.log('✅ Migraciones completadas');
} catch (error) {
  console.error('❌ Error en migraciones:', error);
  process.exit(1);
}

// Limpiar sesiones expiradas al iniciar
console.log('🧹 Limpiando sesiones expiradas...');
const cleaned = Session.cleanExpired();
console.log(`✅ ${cleaned.changes} sesiones expiradas eliminadas`);

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Guardar instancia de Socket.IO en app para uso en controladores
app.set('io', io);

// Configurar sockets
setupLogsSocket(io);
const cleanupStatus = setupStatusSocket(io);

// Iniciar servidor
server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`✨ Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔐 API Auth: http://localhost:${PORT}/api/auth`);
  console.log(`🖥️  API Server: http://localhost:${PORT}/api/server`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('='.repeat(50));
});

// Limpiar sesiones expiradas cada hora
setInterval(() => {
  const cleaned = Session.cleanExpired();
  if (cleaned.changes > 0) {
    console.log(`🧹 ${cleaned.changes} sesiones expiradas limpiadas`);
  }
}, 60 * 60 * 1000); // 1 hora

// Manejo de señales de terminación
const gracefulShutdown = () => {
  console.log('\n🛑 Deteniendo servidor...');

  // Limpiar sockets
  cleanupStatus();
  io.close();

  server.close(() => {
    console.log('✅ Servidor detenido correctamente');
    process.exit(0);
  });

  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    console.error('❌ No se pudo cerrar el servidor correctamente. Forzando cierre...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
