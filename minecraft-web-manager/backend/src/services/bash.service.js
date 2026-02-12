import { spawn, exec } from 'child_process';
import path from 'path';

class BashService {
  constructor(serverPath) {
    this.serverPath = serverPath || process.env.SERVER_PATH;
    this.scriptsPath = path.dirname(this.serverPath);
  }

  /**
   * Ejecutar script bash y retornar promesa
   */
  executeScript(scriptName, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.scriptsPath, scriptName);

      const process = spawn(scriptPath, args, {
        cwd: options.cwd || this.scriptsPath,
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (options.onData) options.onData(chunk);
      });

      process.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (options.onError) options.onError(chunk);
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr, code });
        } else {
          reject(new Error(`Script exited with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Ejecutar comando en el directorio del servidor
   */
  async serverCommand(command, ...args) {
    const scriptPath = path.join(this.serverPath, 'manage-control.sh');
    return this.executeScript(scriptPath, [command, ...args], {
      cwd: this.serverPath
    });
  }

  /**
   * Ejecutar comando y obtener output
   */
  execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, {
        cwd: options.cwd || this.scriptsPath,
        maxBuffer: 1024 * 1024 * 10 // 10MB
      }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  /**
   * Crear backup
   */
  async createBackup(type = 'full') {
    const scriptPath = path.join(this.scriptsPath, 'backup.sh');
    return this.executeScript(scriptPath, [type]);
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(backupFile) {
    const scriptPath = path.join(this.scriptsPath, 'backup.sh');
    return this.executeScript(scriptPath, ['restore', backupFile]);
  }

  /**
   * Comando RCON
   */
  async rconCommand(command) {
    const scriptPath = path.join(this.scriptsPath, 'rcon-client.sh');
    return this.executeScript(scriptPath, [command]);
  }

  /**
   * Actualizar servidor Paper
   */
  async updatePaper() {
    const scriptPath = path.join(this.scriptsPath, 'update-paper.sh');
    return this.executeScript(scriptPath, []);
  }
}

export default BashService;
