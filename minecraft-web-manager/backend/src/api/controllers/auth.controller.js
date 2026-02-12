import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import Session from '../../models/Session.js';
import AuditLog from '../../models/AuditLog.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

class AuthController {
  /**
   * POST /api/auth/login
   * Login de usuario
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validar campos requeridos
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username y password son requeridos'
        });
      }

      // Buscar usuario
      const user = User.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const isValidPassword = User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar tokens
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // 2 horas

      // Guardar sesión
      Session.create({
        userId: user.id,
        token,
        refreshToken,
        expiresAt: expiresAt.toISOString(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      // Actualizar último login
      User.updateLastLogin(user.id);

      // Registrar en audit log
      AuditLog.create({
        userId: user.id,
        action: 'login',
        resourceType: 'auth',
        resourceId: null,
        details: { username },
        ipAddress: req.ip
      });

      // Responder
      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout de usuario
   */
  static async logout(req, res) {
    try {
      const token = req.token;
      const userId = req.user.userId;

      // Eliminar sesión
      Session.delete(token);

      // Registrar en audit log
      AuditLog.create({
        userId,
        action: 'logout',
        resourceType: 'auth',
        resourceId: null,
        details: null,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Renovar token con refresh token
   */
  static async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requerido'
        });
      }

      // Verificar refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, JWT_SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido o expirado'
        });
      }

      // Buscar sesión
      const session = Session.findByRefreshToken(refreshToken);
      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Sesión no encontrada'
        });
      }

      // Buscar usuario
      const user = User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Generar nuevo token
      const newToken = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Calcular nueva fecha de expiración
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + 2);

      // Actualizar sesión
      Session.updateToken(refreshToken, newToken, newExpiresAt.toISOString());

      res.json({
        success: true,
        message: 'Token renovado',
        data: {
          token: newToken
        }
      });
    } catch (error) {
      console.error('Error en refresh:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }

  /**
   * GET /api/auth/me
   * Obtener usuario actual
   */
  static async me(req, res) {
    try {
      const userId = req.user.userId;

      // Buscar usuario
      const user = User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      });
    } catch (error) {
      console.error('Error en me:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }

  /**
   * PUT /api/auth/password
   * Cambiar contraseña
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva contraseña requeridas'
        });
      }

      // Validar longitud de contraseña
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Buscar usuario
      const user = User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = User.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Cambiar contraseña
      User.changePassword(userId, newPassword);

      // Registrar en audit log
      AuditLog.create({
        userId,
        action: 'change_password',
        resourceType: 'auth',
        resourceId: null,
        details: null,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });
    } catch (error) {
      console.error('Error en changePassword:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }
}

export default AuthController;
