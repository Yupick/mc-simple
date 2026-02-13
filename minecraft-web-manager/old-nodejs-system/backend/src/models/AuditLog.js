import db from '../database/db.js';

class AuditLog {
  /**
   * Crear un nuevo registro de auditoría
   */
  static create({ userId, action, resourceType, resourceId, details, ipAddress }) {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const detailsJson = details ? JSON.stringify(details) : null;
    const result = stmt.run(userId, action, resourceType, resourceId, detailsJson, ipAddress);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Buscar log por ID
   */
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM audit_logs WHERE id = ?');
    const log = stmt.get(id);
    if (log && log.details) {
      log.details = JSON.parse(log.details);
    }
    return log;
  }

  /**
   * Obtener logs recientes
   */
  static findRecent(limit = 50) {
    const stmt = db.prepare(`
      SELECT
        al.*,
        u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `);

    const logs = stmt.all(limit);
    return logs.map(log => {
      if (log.details) {
        log.details = JSON.parse(log.details);
      }
      return log;
    });
  }

  /**
   * Obtener logs por usuario
   */
  static findByUserId(userId, limit = 50) {
    const stmt = db.prepare(`
      SELECT * FROM audit_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const logs = stmt.all(userId, limit);
    return logs.map(log => {
      if (log.details) {
        log.details = JSON.parse(log.details);
      }
      return log;
    });
  }

  /**
   * Obtener logs por tipo de recurso
   */
  static findByResourceType(resourceType, limit = 50) {
    const stmt = db.prepare(`
      SELECT
        al.*,
        u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.resource_type = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `);

    const logs = stmt.all(resourceType, limit);
    return logs.map(log => {
      if (log.details) {
        log.details = JSON.parse(log.details);
      }
      return log;
    });
  }

  /**
   * Obtener logs por acción
   */
  static findByAction(action, limit = 50) {
    const stmt = db.prepare(`
      SELECT
        al.*,
        u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `);

    const logs = stmt.all(action, limit);
    return logs.map(log => {
      if (log.details) {
        log.details = JSON.parse(log.details);
      }
      return log;
    });
  }

  /**
   * Buscar logs con filtros
   */
  static search({ userId, action, resourceType, startDate, endDate, limit = 50 }) {
    let query = `
      SELECT
        al.*,
        u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    if (resourceType) {
      query += ' AND al.resource_type = ?';
      params.push(resourceType);
    }

    if (startDate) {
      query += ' AND al.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const logs = stmt.all(...params);

    return logs.map(log => {
      if (log.details) {
        log.details = JSON.parse(log.details);
      }
      return log;
    });
  }

  /**
   * Eliminar logs antiguos
   */
  static deleteOlderThan(days) {
    const stmt = db.prepare(`
      DELETE FROM audit_logs
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `);
    return stmt.run(days);
  }

  /**
   * Contar total de logs
   */
  static count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM audit_logs');
    return stmt.get().count;
  }

  /**
   * Helper: Log de acción de servidor
   */
  static logServerAction(userId, action, details, ipAddress) {
    return this.create({
      userId,
      action,
      resourceType: 'server',
      resourceId: null,
      details,
      ipAddress
    });
  }

  /**
   * Helper: Log de acción de mundo
   */
  static logWorldAction(userId, action, worldId, details, ipAddress) {
    return this.create({
      userId,
      action,
      resourceType: 'world',
      resourceId: worldId,
      details,
      ipAddress
    });
  }

  /**
   * Helper: Log de acción de plugin
   */
  static logPluginAction(userId, action, pluginName, details, ipAddress) {
    return this.create({
      userId,
      action,
      resourceType: 'plugin',
      resourceId: pluginName,
      details,
      ipAddress
    });
  }

  /**
   * Helper: Log de acción de backup
   */
  static logBackupAction(userId, action, backupId, details, ipAddress) {
    return this.create({
      userId,
      action,
      resourceType: 'backup',
      resourceId: backupId ? backupId.toString() : null,
      details,
      ipAddress
    });
  }

  /**
   * Helper: Log de acción genérica
   */
  static logAction(userId, action, resourceType, resourceId, details, ipAddress) {
    return this.create({
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress
    });
  }
}

export default AuditLog;
