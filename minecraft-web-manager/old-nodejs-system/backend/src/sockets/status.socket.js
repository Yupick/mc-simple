import ServerService from '../services/server.service.js';

const serverService = new ServerService();

export function setupStatusSocket(io) {
  // Emitir estado del servidor cada 5 segundos a todos los clientes conectados
  const statusInterval = setInterval(async () => {
    try {
      const status = await serverService.getStatus();
      io.emit('server-status-update', status);
    } catch (error) {
      console.error('Error al obtener estado para socket:', error);
    }
  }, 5000);

  io.on('connection', (socket) => {
    // Enviar estado inmediatamente al conectar
    serverService.getStatus()
      .then(status => {
        socket.emit('server-status-update', status);
      })
      .catch(error => {
        console.error('Error al enviar estado inicial:', error);
      });
  });

  // Limpiar interval al cerrar
  return () => {
    clearInterval(statusInterval);
  };
}

export default { setupStatusSocket };
