import ServerService from '../../services/server.service.js';
import AuditLog from '../../models/AuditLog.js';

const serverService = new ServerService();

class ServerController {
  /**
   * GET /api/server/status
   * Obtener estado del servidor
   */
  static async getStatus(req, res) {
    try {
      const status = await serverService.getStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error al obtener estado:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/server/start
   * Iniciar servidor
   */
  static async start(req, res) {
    try {
      const result = await serverService.start();

      // Registrar en audit log
      AuditLog.logServerAction(
        req.user.userId,
        'server_start',
        { message: result.message },
        req.ip
      );

      // Emitir evento via Socket.IO
      if (req.app.get('io')) {
        req.app.get('io').emit('server-status', { action: 'started' });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error al iniciar servidor:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/server/stop
   * Detener servidor
   */
  static async stop(req, res) {
    try {
      const result = await serverService.stop();

      // Registrar en audit log
      AuditLog.logServerAction(
        req.user.userId,
        'server_stop',
        { message: result.message },
        req.ip
      );

      // Emitir evento via Socket.IO
      if (req.app.get('io')) {
        req.app.get('io').emit('server-status', { action: 'stopped' });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error al detener servidor:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/server/restart
   * Reiniciar servidor
   */
  static async restart(req, res) {
    try {
      const result = await serverService.restart();

      // Registrar en audit log
      AuditLog.logServerAction(
        req.user.userId,
        'server_restart',
        { message: result.message },
        req.ip
      );

      // Emitir evento via Socket.IO
      if (req.app.get('io')) {
        req.app.get('io').emit('server-status', { action: 'restarted' });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error al reiniciar servidor:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/server/logs
   * Obtener logs del servidor
   */
  static async getLogs(req, res) {
    try {
      const lines = parseInt(req.query.lines) || 100;
      const logs = await serverService.getLogs(lines);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('Error al obtener logs:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/server/info
   * Obtener información del servidor
   */
  static async getInfo(req, res) {
    try {
      const info = await serverService.getInfo();

      res.json({
        success: true,
        data: info
      });
    } catch (error) {
      console.error('Error al obtener información:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/server/command
   * Enviar comando RCON
   */
  static async sendCommand(req, res) {
    try {
      const { command } = req.body;

      if (!command) {
        return res.status(400).json({
          success: false,
          message: 'Comando requerido'
        });
      }

      const result = await serverService.sendCommand(command);

      // Registrar en audit log
      AuditLog.logServerAction(
        req.user.userId,
        'rcon_command',
        { command, output: result.output },
        req.ip
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error al enviar comando:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default ServerController;
