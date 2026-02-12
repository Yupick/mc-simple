import fs from 'fs/promises';
import path from 'path';
import BashService from './bash.service.js';

class ServerService {
  constructor() {
    this.serverPath = process.env.SERVER_PATH;
    this.bashService = new BashService(this.serverPath);
  }

  /**
   * Obtener estado del servidor
   */
  async getStatus() {
    try {
      const pidPath = path.join(this.serverPath, 'server.pid');

      // Verificar si existe el archivo PID
      try {
        const pidContent = await fs.readFile(pidPath, 'utf-8');
        const pid = parseInt(pidContent.trim());

        // Verificar si el proceso está corriendo
        try {
          process.kill(pid, 0); // Signal 0 solo verifica si el proceso existe

          // Obtener información del proceso
          const { stdout: memInfo } = await this.bashService.execCommand(
            `ps -p ${pid} -o rss,vsz,pcpu --no-headers`
          );
          const [rss, vsz, cpu] = memInfo.trim().split(/\s+/);

          // Obtener uptime
          const { stdout: startTime } = await this.bashService.execCommand(
            `ps -p ${pid} -o lstart --no-headers`
          );
          const startDate = new Date(startTime.trim());
          const uptimeMs = Date.now() - startDate.getTime();
          const uptimeSeconds = Math.floor(uptimeMs / 1000); // Convertir a segundos

          // Intentar obtener jugadores via RCON
          let players = { online: 0, max: 20 };
          try {
            const rconResult = await this.bashService.rconCommand('list');
            const match = rconResult.stdout.match(/There are (\d+) of a max of (\d+) players online/);
            if (match) {
              players = {
                online: parseInt(match[1]),
                max: parseInt(match[2])
              };
            }
          } catch (error) {
            // RCON no disponible o servidor no responde
          }

          // Memoria: convertir de KB a bytes para el frontend
          const rssKB = parseInt(rss);
          const vszKB = parseInt(vsz);

          return {
            running: true,
            pid,
            memory: {
              used: rssKB * 1024, // Convertir KB a bytes
              max: vszKB * 1024    // Convertir KB a bytes
            },
            cpu: parseFloat(cpu),
            uptime: uptimeSeconds, // En segundos
            players
          };
        } catch (error) {
          // Proceso no existe, archivo PID obsoleto
          await fs.unlink(pidPath).catch(() => {});
          return { running: false };
        }
      } catch (error) {
        // Archivo PID no existe
        return { running: false };
      }
    } catch (error) {
      console.error('Error al obtener estado:', error);
      throw error;
    }
  }

  /**
   * Iniciar servidor
   */
  async start() {
    try {
      const status = await this.getStatus();
      if (status.running) {
        throw new Error('El servidor ya está corriendo');
      }

      const result = await this.bashService.serverCommand('start');

      // Esperar un momento para que el servidor inicie
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        message: 'Servidor iniciado correctamente',
        output: result.stdout
      };
    } catch (error) {
      throw new Error(`Error al iniciar servidor: ${error.message}`);
    }
  }

  /**
   * Detener servidor
   */
  async stop() {
    try {
      const status = await this.getStatus();
      if (!status.running) {
        throw new Error('El servidor no está corriendo');
      }

      const result = await this.bashService.serverCommand('stop');

      return {
        success: true,
        message: 'Servidor detenido correctamente',
        output: result.stdout
      };
    } catch (error) {
      throw new Error(`Error al detener servidor: ${error.message}`);
    }
  }

  /**
   * Reiniciar servidor
   */
  async restart() {
    try {
      const status = await this.getStatus();
      if (!status.running) {
        // Si no está corriendo, solo iniciarlo
        return await this.start();
      }

      const result = await this.bashService.serverCommand('restart');

      // Esperar un momento para que el servidor reinicie
      await new Promise(resolve => setTimeout(resolve, 3000));

      return {
        success: true,
        message: 'Servidor reiniciado correctamente',
        output: result.stdout
      };
    } catch (error) {
      throw new Error(`Error al reiniciar servidor: ${error.message}`);
    }
  }

  /**
   * Obtener logs del servidor
   */
  async getLogs(lines = 100) {
    try {
      const logsPath = path.join(this.serverPath, 'logs/latest.log');
      const { stdout } = await this.bashService.execCommand(
        `tail -n ${lines} "${logsPath}"`
      );
      return stdout;
    } catch (error) {
      throw new Error(`Error al obtener logs: ${error.message}`);
    }
  }

  /**
   * Obtener información del servidor
   */
  async getInfo() {
    try {
      // Leer versión de Paper
      const versionHistoryPath = path.join(this.serverPath, 'version_history.json');
      let paperVersion = 'Desconocida';
      try {
        const versionData = await fs.readFile(versionHistoryPath, 'utf-8');
        const versionHistory = JSON.parse(versionData);
        if (versionHistory.currentVersion) {
          paperVersion = versionHistory.currentVersion;
        }
      } catch (error) {
        // Archivo no existe o es inválido
      }

      // Obtener versión de Java
      const { stdout: javaVersion } = await this.bashService.execCommand('java -version 2>&1 | head -n 1');

      // Leer server.properties
      const propsPath = path.join(this.serverPath, 'server.properties');
      let serverPort = 25565;
      let maxPlayers = 20;
      try {
        const propsContent = await fs.readFile(propsPath, 'utf-8');
        const portMatch = propsContent.match(/server-port=(\d+)/);
        const maxPlayersMatch = propsContent.match(/max-players=(\d+)/);
        if (portMatch) serverPort = parseInt(portMatch[1]);
        if (maxPlayersMatch) maxPlayers = parseInt(maxPlayersMatch[1]);
      } catch (error) {
        // Usar valores por defecto
      }

      return {
        paperVersion,
        javaVersion: javaVersion.trim(),
        serverPort,
        maxPlayers,
        serverPath: this.serverPath
      };
    } catch (error) {
      throw new Error(`Error al obtener información: ${error.message}`);
    }
  }

  /**
   * Enviar comando via RCON
   */
  async sendCommand(command) {
    try {
      const status = await this.getStatus();
      if (!status.running) {
        throw new Error('El servidor no está corriendo');
      }

      const result = await this.bashService.rconCommand(command);
      return {
        success: true,
        output: result.stdout.trim()
      };
    } catch (error) {
      throw new Error(`Error al enviar comando: ${error.message}`);
    }
  }
}

export default ServerService;
