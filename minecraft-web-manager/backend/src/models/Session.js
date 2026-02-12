import db from '../database/db.js';

class Session {
  /**
   * Crear una nueva sesión
   */
  static create({ userId, token, refreshToken, expiresAt, ipAddress, userAgent }) {
    const stmt = db.prepare(`
      INSERT INTO sessions (user_id, token, refresh_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(userId, token, refreshToken, expiresAt, ipAddress, userAgent);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Buscar sesión por ID
   */
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Buscar sesión por token
   */
  static findByToken(token) {
    const stmt = db.prepare('SELECT * FROM sessions WHERE token = ?');
    return stmt.get(token);
  }

  /**
   * Buscar sesión por refresh token
   */
  static findByRefreshToken(refreshToken) {
    const stmt = db.prepare('SELECT * FROM sessions WHERE refresh_token = ?');
    return stmt.get(refreshToken);
  }

  /**
   * Buscar sesiones activas de un usuario
   */
  static findByUserId(userId) {
    const stmt = db.prepare(`
      SELECT * FROM sessions
      WHERE user_id = ?
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  }

  /**
   * Eliminar sesión (logout)
   */
  static delete(token) {
    const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
    return stmt.run(token);
  }

  /**
   * Eliminar todas las sesiones de un usuario
   */
  static deleteByUserId(userId) {
    const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
    return stmt.run(userId);
  }

  /**
   * Limpiar sesiones expiradas
   */
  static cleanExpired() {
    const stmt = db.prepare('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
    return stmt.run();
  }

  /**
   * Actualizar token y expiración (refresh)
   */
  static updateToken(refreshToken, newToken, newExpiresAt) {
    const stmt = db.prepare(`
      UPDATE sessions
      SET token = ?, expires_at = ?
      WHERE refresh_token = ?
    `);
    return stmt.run(newToken, newExpiresAt, refreshToken);
  }

  /**
   * Contar sesiones activas
   */
  static countActive() {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM sessions
      WHERE expires_at > CURRENT_TIMESTAMP
    `);
    return stmt.get().count;
  }
}

export default Session;
