import systemService from '../../services/system.service.js';

class SystemController {
  /**
   * GET /system/info
   * Obtener información del sistema
   */
  static async getSystemInfo(req, res) {
    try {
      const info = await systemService.getSystemInfo();

      return res.json({
        success: true,
        data: info
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /system/logs
   * Obtener logs del sistema
   */
  static async getLogs(req, res) {
    try {
      const { limit = 50, offset = 0, action, userId } = req.query;

      let logs;

      if (action) {
        logs = await systemService.getLogsByAction(action, parseInt(limit));
      } else if (userId) {
        logs = await systemService.getLogsByUser(parseInt(userId), parseInt(limit));
      } else {
        logs = await systemService.getLogs(parseInt(limit), parseInt(offset));
      }

      return res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default SystemController;
