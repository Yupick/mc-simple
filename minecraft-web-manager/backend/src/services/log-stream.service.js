import { spawn } from 'child_process';
import path from 'path';

class LogStreamService {
  constructor() {
    this.serverPath = process.env.SERVER_PATH;
    this.activeStreams = new Map();
  }

  /**
   * Iniciar stream de logs para un socket
   */
  startStream(socketId, socket) {
    // Si ya existe un stream para este socket, detenerlo
    if (this.activeStreams.has(socketId)) {
      this.stopStream(socketId);
    }

    const logsPath = path.join(this.serverPath, 'logs/latest.log');

    // Usar tail -f para seguir el archivo de logs
    const tailProcess = spawn('tail', ['-f', '-n', '100', logsPath]);

    tailProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        socket.emit('log', {
          timestamp: new Date().toISOString(),
          message: line
        });
      });
    });

    tailProcess.stderr.on('data', (data) => {
      console.error('Error en tail:', data.toString());
    });

    tailProcess.on('error', (error) => {
      console.error('Error al iniciar tail:', error);
      socket.emit('log-error', { message: 'Error al leer logs' });
    });

    tailProcess.on('close', (code) => {
      console.log(`Tail process cerrado con código ${code}`);
      this.activeStreams.delete(socketId);
    });

    this.activeStreams.set(socketId, tailProcess);
  }

  /**
   * Detener stream de logs para un socket
   */
  stopStream(socketId) {
    const tailProcess = this.activeStreams.get(socketId);
    if (tailProcess) {
      tailProcess.kill();
      this.activeStreams.delete(socketId);
    }
  }

  /**
   * Detener todos los streams
   */
  stopAllStreams() {
    this.activeStreams.forEach((tailProcess, socketId) => {
      tailProcess.kill();
    });
    this.activeStreams.clear();
  }

  /**
   * Obtener número de streams activos
   */
  getActiveStreamsCount() {
    return this.activeStreams.size;
  }
}

export default LogStreamService;
