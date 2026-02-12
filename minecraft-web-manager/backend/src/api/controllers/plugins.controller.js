import PluginService from '../../services/plugin.service.js';
import AuditLog from '../../models/AuditLog.js';

const pluginService = new PluginService();

class PluginsController {
  static async list(req, res) {
    try {
      const plugins = await pluginService.listPlugins();
      res.json({ success: true, data: plugins });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async toggle(req, res) {
    try {
      const { name } = req.params;
      const result = await pluginService.togglePlugin(name);

      AuditLog.logPluginAction(req.user.userId, 'plugin_toggle', name, result, req.ip);

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { name } = req.params;
      const result = await pluginService.deletePlugin(name);

      AuditLog.logPluginAction(req.user.userId, 'plugin_delete', name, null, req.ip);

      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getConfigFiles(req, res) {
    try {
      const { name } = req.params;
      const files = await pluginService.getPluginConfigFiles(name);
      res.json({ success: true, data: files });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default PluginsController;
