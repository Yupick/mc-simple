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
}

export default BackupsController;
