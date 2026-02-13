import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import AuditLog from '../models/AuditLog.js';

const execAsync = promisify(exec);

class SystemService {
  /**
   * Obtener información del sistema
   */
  async getSystemInfo() {
    try {
      const info = {
        // CPU
        cpu: {
          model: os.cpus()[0]?.model || 'Unknown',
          cores: os.cpus().length,
          usage: await this.getCpuUsage()
        },
        // Memoria
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
        },
        // Sistema
        os: {
          platform: os.platform(),
          type: os.type(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname()
        },
        // Uptime
        uptime: os.uptime(),
        // Java version
        javaVersion: await this.getJavaVersion(),
        // Disco
        disk: await this.getDiskInfo()
      };

      return info;
    } catch (error) {
      throw new Error(`Error al obtener información del sistema: ${error.message}`);
    }
  }

  /**
   * Obtener uso de CPU (promedio de 1 segundo)
   */
  async getCpuUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();

      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);

        resolve(percentageCPU);
      }, 1000);
    });
  }

  /**
   * Calcular promedio de CPU
   */
  cpuAverage() {
    const cpus = os.cpus();
    let idleMs = 0;
    let totalMs = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalMs += cpu.times[type];
      }
      idleMs += cpu.times.idle;
    });

    return {
      idle: idleMs / cpus.length,
      total: totalMs / cpus.length
    };
  }

  /**
   * Obtener versión de Java
   */
  async getJavaVersion() {
    try {
      const { stdout } = await execAsync('java -version 2>&1 | head -n 1');
      return stdout.trim();
    } catch (error) {
      return 'Java no encontrado';
    }
  }

  /**
   * Obtener información del disco
   */
  async getDiskInfo() {
    try {
      if (os.platform() === 'linux' || os.platform() === 'darwin') {
        const { stdout } = await execAsync('df -k / | tail -1');
        const parts = stdout.trim().split(/\s+/);

        const total = parseInt(parts[1]) * 1024; // KB to bytes
        const used = parseInt(parts[2]) * 1024;
        const available = parseInt(parts[3]) * 1024;

        return {
          total,
          used,
          available,
          usagePercent: (used / total) * 100
        };
      } else if (os.platform() === 'win32') {
        // Para Windows usar wmic
        const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].trim().split(/\s+/);
          const free = parseInt(parts[1]);
          const total = parseInt(parts[2]);
          const used = total - free;

          return {
            total,
            used,
            available: free,
            usagePercent: (used / total) * 100
          };
        }
      }

      return {
        total: 0,
        used: 0,
        available: 0,
        usagePercent: 0
      };
    } catch (error) {
      return {
        total: 0,
        used: 0,
        available: 0,
        usagePercent: 0
      };
    }
  }

  /**
   * Obtener logs del sistema (últimas entradas del audit log)
   */
  async getLogs(limit = 50, offset = 0) {
    try {
      // AuditLog.findRecent no soporta offset, simplemente ignora el offset
      const logs = AuditLog.findRecent(limit);
      return logs;
    } catch (error) {
      throw new Error(`Error al obtener logs: ${error.message}`);
    }
  }

  /**
   * Obtener logs filtrados por acción
   */
  async getLogsByAction(action, limit = 50) {
    try {
      const logs = AuditLog.findByAction(action, limit);
      return logs;
    } catch (error) {
      throw new Error(`Error al obtener logs por acción: ${error.message}`);
    }
  }

  /**
   * Obtener logs de un usuario específico
   */
  async getLogsByUser(userId, limit = 50) {
    try {
      const logs = AuditLog.findByUserId(userId, limit);
      return logs;
    } catch (error) {
      throw new Error(`Error al obtener logs de usuario: ${error.message}`);
    }
  }
}

export default new SystemService();
