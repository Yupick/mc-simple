import jwt from 'jsonwebtoken';
import Session from '../../models/Session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/**
 * Middleware para verificar token JWT
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Verificar que la sesión existe en la base de datos
    const session = Session.findByToken(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    // Verificar que la sesión no ha expirado
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada'
      });
    }

    // Añadir información del usuario al request
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en la autenticación'
    });
  }
};

/**
 * Middleware para verificar roles
 * @param {Array<string>} allowedRoles - Roles permitidos
 */
export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

export default { authMiddleware, roleMiddleware };
