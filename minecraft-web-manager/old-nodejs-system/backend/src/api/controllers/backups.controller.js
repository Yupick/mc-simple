import BackupService from '../../services/backup.service.js';
import AuditLog from '../../models/AuditLog.js';

const backupService = new BackupService();

class BackupsController {
  static async list(req, res) {
    try {
      const { type, limit } = req.query;
      const backups = await backupService.listBackups(type, parseInt(limit) || 50);
      res.json({ success: true, data: backups });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { type } = req.body;

      if (!['full', 'world', 'plugins', 'config'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Tipo de backup inválido' });
      }

      const result = await backupService.createBackup(type, req.user.userId);

      AuditLog.logBackupAction(req.user.userId, 'backup_create', result.backup?.id, { type }, req.ip);

      res.json({ success: true, message: 'Backup creado correctamente', data: result.backup });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await backupService.deleteBackup(parseInt(id));

      AuditLog.logBackupAction(req.user.userId, 'backup_delete', id, null, req.ip);

      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async restore(req, res) {
    try {
      const { id } = req.params;
      const result = await backupService.restoreBackup(parseInt(id), req.user.userId);

      AuditLog.logBackupAction(req.user.userId, 'backup_restore', id, null, req.ip);

      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async download(req, res) {
    try {
      const { id } = req.params;
      const backupPath = await backupService.getBackupPath(parseInt(id));

      res.download(backupPath);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Backups programados
  static async listScheduled(req, res) {
    try {
      const schedules = await backupService.listScheduledBackups();
      res.json({ success: true, data: schedules });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createScheduled(req, res) {
    try {
      const { name, type, cron_expression, enabled } = req.body;

      const schedule = await backupService.createScheduledBackup({
        name,
        type,
        cron_expression,
        enabled
      });

      AuditLog.logBackupAction(req.user.userId, 'backup_schedule_create', schedule.id, { name, type }, req.ip);

      res.json({ success: true, message: 'Backup programado creado', data: schedule });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteScheduled(req, res) {
    try {
      const { id } = req.params;
      const result = await backupService.deleteScheduledBackup(parseInt(id));

      AuditLog.logBackupAction(req.user.userId, 'backup_schedule_delete', id, null, req.ip);

      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateScheduled(req, res) {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      const result = await backupService.updateScheduledBackup(parseInt(id), { enabled });

      AuditLog.logBackupAction(req.user.userId, 'backup_schedule_update', id, { enabled }, req.ip);

      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default BackupsController;
