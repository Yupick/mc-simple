import path from 'path';
import ConfigService from '../../services/config.service.js';
import AuditLog from '../../models/AuditLog.js';

const configService = new ConfigService();

class ConfigController {
  /**
   * GET /config/server-properties
   * Obtener server.properties del mundo activo
   */
  static async getServerProperties(req, res) {
    try {
      const serverPath = process.env.SERVER_PATH || '../server';
      const propertiesPath = path.join(serverPath, 'worlds', 'active', 'server.properties');

      const properties = await configService.readProperties(propertiesPath);

      return res.json({
        success: true,
        data: properties
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /config/server-properties
   * Actualizar server.properties
   */
  static async updateServerProperties(req, res) {
    try {
      const properties = req.body;
      const serverPath = process.env.SERVER_PATH || '../server';
      const propertiesPath = path.join(serverPath, 'worlds', 'active', 'server.properties');

      await configService.writeProperties(propertiesPath, properties);

      // Audit log
      AuditLog.logAction(
        req.user.userId,
        'config_update',
        'server',
        'properties',
        { properties: Object.keys(properties) },
        req.ip
      );

      return res.json({
        success: true,
        message: 'Server properties actualizadas correctamente'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /config/whitelist
   * Obtener whitelist.json
   */
  static async getWhitelist(req, res) {
    try {
      const serverPath = process.env.SERVER_PATH || '../server';
      const whitelistPath = path.join(serverPath, 'whitelist.json');

      const whitelist = await configService.readJson(whitelistPath);

      return res.json({
        success: true,
        data: whitelist || []
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /config/whitelist
   * Añadir jugador a la whitelist
   */
  static async addToWhitelist(req, res) {
    try {
      const { username } = req.body;

      if (!username || !/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
        return res.status(400).json({
          success: false,
          message: 'Nombre de usuario inválido'
        });
      }

      const serverPath = process.env.SERVER_PATH || '../server';
      const whitelistPath = path.join(serverPath, 'whitelist.json');

      let whitelist = await configService.readJson(whitelistPath) || [];

      // Verificar si ya existe
      if (whitelist.some(player => player.name === username)) {
        return res.status(400).json({
          success: false,
          message: 'El jugador ya está en la whitelist'
        });
      }

      // Añadir nuevo jugador
      whitelist.push({
        name: username,
        uuid: '' // Se llenará cuando el jugador se conecte
      });

      await configService.writeJson(whitelistPath, whitelist);

      // Audit log
      AuditLog.logAction(
        req.user.userId,
        'whitelist_add',
        'player',
        username,
        null,
        req.ip
      );

      return res.json({
        success: true,
        message: `${username} añadido a la whitelist`,
        data: whitelist
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /config/whitelist/:username
   * Eliminar jugador de la whitelist
   */
  static async removeFromWhitelist(req, res) {
    try {
      const { username } = req.params;

      const serverPath = process.env.SERVER_PATH || '../server';
      const whitelistPath = path.join(serverPath, 'whitelist.json');

      let whitelist = await configService.readJson(whitelistPath) || [];

      const initialLength = whitelist.length;
      whitelist = whitelist.filter(player => player.name !== username);

      if (whitelist.length === initialLength) {
        return res.status(404).json({
          success: false,
          message: 'Jugador no encontrado en la whitelist'
        });
      }

      await configService.writeJson(whitelistPath, whitelist);

      // Audit log
      AuditLog.logAction(
        req.user.userId,
        'whitelist_remove',
        'player',
        username,
        null,
        req.ip
      );

      return res.json({
        success: true,
        message: `${username} eliminado de la whitelist`,
        data: whitelist
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /config/ops
   * Obtener ops.json
   */
  static async getOps(req, res) {
    try {
      const serverPath = process.env.SERVER_PATH || '../server';
      const opsPath = path.join(serverPath, 'ops.json');

      const ops = await configService.readJson(opsPath);

      return res.json({
        success: true,
        data: ops || []
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /config/ops
   * Añadir operador
   */
  static async addOp(req, res) {
    try {
      const { username, level = 4 } = req.body;

      if (!username || !/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
        return res.status(400).json({
          success: false,
          message: 'Nombre de usuario inválido'
        });
      }

      if (!Number.isInteger(level) || level < 1 || level > 4) {
        return res.status(400).json({
          success: false,
          message: 'Nivel debe ser entre 1 y 4'
        });
      }

      const serverPath = process.env.SERVER_PATH || '../server';
      const opsPath = path.join(serverPath, 'ops.json');

      let ops = await configService.readJson(opsPath) || [];

      // Verificar si ya existe
      if (ops.some(op => op.name === username)) {
        return res.status(400).json({
          success: false,
          message: 'El jugador ya es operador'
        });
      }

      // Añadir nuevo operador
      ops.push({
        name: username,
        uuid: '',
        level: level,
        bypassesPlayerLimit: false
      });

      await configService.writeJson(opsPath, ops);

      // Audit log
      AuditLog.logAction(
        req.user.userId,
        'op_add',
        'player',
        username,
        { level },
        req.ip
      );

      return res.json({
        success: true,
        message: `${username} añadido como operador (nivel ${level})`,
        data: ops
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /config/ops/:username
   * Eliminar operador
   */
  static async removeOp(req, res) {
    try {
      const { username } = req.params;

      const serverPath = process.env.SERVER_PATH || '../server';
      const opsPath = path.join(serverPath, 'ops.json');

      let ops = await configService.readJson(opsPath) || [];

      const initialLength = ops.length;
      ops = ops.filter(op => op.name !== username);

      if (ops.length === initialLength) {
        return res.status(404).json({
          success: false,
          message: 'Operador no encontrado'
        });
      }

      await configService.writeJson(opsPath, ops);

      // Audit log
      AuditLog.logAction(
        req.user.userId,
        'op_remove',
        'player',
        username,
        null,
        req.ip
      );

      return res.json({
        success: true,
        message: `${username} eliminado de operadores`,
        data: ops
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default ConfigController;
