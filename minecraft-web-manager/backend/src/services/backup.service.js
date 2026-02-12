import fs from 'fs/promises';
import path from 'path';
import BashService from './bash.service.js';
import db from '../database/db.js';

class BackupService {
  constructor() {
    this.serverPath = process.env.SERVER_PATH;
    this.backupPath = process.env.BACKUP_PATH || path.join(path.dirname(this.serverPath), 'backups');
    this.bashService = new BashService(this.serverPath);
  }

  /**
   * Crear backup
   */
  async createBackup(type, userId) {
    try {
      await fs.mkdir(this.backupPath, { recursive: true });

      const result = await this.bashService.createBackup(type);

      // Buscar el archivo de backup creado (el más reciente)
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files.filter(f => f.startsWith(`backup-${type}`)).sort().reverse();

      if (backupFiles.length > 0) {
        const filename = backupFiles[0];
        const filePath = path.join(this.backupPath, filename);
        const stats = await fs.stat(filePath);

        // Registrar en base de datos
        const stmt = db.prepare(`
          INSERT INTO backup_history (filename, type, size_bytes, path, created_by, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const dbResult = stmt.run(filename, type, stats.size, filePath, userId, 'completed');

        return {
          success: true,
          backup: {
            id: dbResult.lastInsertRowid,
            filename,
            type,
            size_mb: Math.round(stats.size / 1024 / 1024),
            path: filePath
          }
        };
      }

      return { success: true, message: 'Backup creado' };
    } catch (error) {
      throw new Error(`Error al crear backup: ${error.message}`);
    }
  }

  /**
   * Listar backups
   */
  async listBackups(type = null, limit = 50) {
    try {
      let query = 'SELECT * FROM backup_history';
      const params = [];

      if (type) {
        query += ' WHERE type = ?';
        params.push(type);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const stmt = db.prepare(query);
      const backups = stmt.all(...params);

      return backups.map(backup => ({
        ...backup,
        size_mb: Math.round(backup.size_bytes / 1024 / 1024)
      }));
    } catch (error) {
      throw new Error(`Error al listar backups: ${error.message}`);
    }
  }

  /**
   * Eliminar backup
   */
  async deleteBackup(backupId) {
    try {
      const stmt = db.prepare('SELECT * FROM backup_history WHERE id = ?');
      const backup = stmt.get(backupId);

      if (!backup) {
        throw new Error('Backup no encontrado');
      }

      // Eliminar archivo
      try {
        await fs.unlink(backup.path);
      } catch {
        // Archivo ya no existe
      }

      // Eliminar de base de datos
      const deleteStmt = db.prepare('DELETE FROM backup_history WHERE id = ?');
      deleteStmt.run(backupId);

      return { success: true, message: 'Backup eliminado' };
    } catch (error) {
      throw new Error(`Error al eliminar backup: ${error.message}`);
    }
  }
}

export default BackupService;
