import db from '../database/db.js';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

class User {
  /**
   * Crear un nuevo usuario
   */
  static create({ username, password, role = 'viewer' }) {
    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(username, passwordHash, role);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Buscar usuario por ID
   */
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Buscar usuario por username
   */
  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  /**
   * Verificar contraseña
   */
  static verifyPassword(password, passwordHash) {
    return bcrypt.compareSync(password, passwordHash);
  }

  /**
   * Actualizar último login
   */
  static updateLastLogin(userId) {
    const stmt = db.prepare(`
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(userId);
  }

  /**
   * Listar todos los usuarios
   */
  static findAll() {
    const stmt = db.prepare('SELECT id, username, role, created_at, last_login FROM users');
    return stmt.all();
  }

  /**
   * Actualizar usuario
   */
  static update(id, { username, role }) {
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }

    if (updates.length === 0) return false;

    values.push(id);
    const stmt = db.prepare(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    return stmt.run(...values);
  }

  /**
   * Cambiar contraseña
   */
  static changePassword(userId, newPassword) {
    const passwordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
    const stmt = db.prepare(`
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
    `);
    return stmt.run(passwordHash, userId);
  }

  /**
   * Eliminar usuario
   */
  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }

  /**
   * Contar usuarios
   */
  static count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
  }
}

export default User;
