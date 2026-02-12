import LogStreamService from '../services/log-stream.service.js';

const logStreamService = new LogStreamService();

export function setupLogsSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // Cliente solicita stream de logs
    socket.on('start-logs', () => {
      console.log(`Iniciando stream de logs para socket ${socket.id}`);
      logStreamService.startStream(socket.id, socket);
      socket.emit('logs-started', { message: 'Stream de logs iniciado' });
    });

    // Cliente solicita detener stream
    socket.on('stop-logs', () => {
      console.log(`Deteniendo stream de logs para socket ${socket.id}`);
      logStreamService.stopStream(socket.id);
      socket.emit('logs-stopped', { message: 'Stream de logs detenido' });
    });

    // Desconexión del cliente
    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
      logStreamService.stopStream(socket.id);
    });
  });
}

export default { setupLogsSocket };
