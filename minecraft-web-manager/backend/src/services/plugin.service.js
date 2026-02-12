import fs from 'fs/promises';
import path from 'path';
import ConfigService from './config.service.js';

class PluginService {
  constructor() {
    this.serverPath = process.env.SERVER_PATH;
    this.pluginsPath = path.join(this.serverPath, 'plugins');
    this.configService = new ConfigService();
  }

  /**
   * Listar plugins instalados
   */
  async listPlugins() {
    try {
      const files = await fs.readdir(this.pluginsPath);
      const plugins = [];

      for (const file of files) {
        if (file.endsWith('.jar')) {
          const pluginPath = path.join(this.pluginsPath, file);
          const stats = await fs.stat(pluginPath);

          plugins.push({
            name: file.replace('.jar', ''),
            filename: file,
            enabled: true,
            size: Math.round(stats.size / 1024), // KB
            modified: stats.mtime
          });
        } else if (file.endsWith('.jar.disabled')) {
          const pluginPath = path.join(this.pluginsPath, file);
          const stats = await fs.stat(pluginPath);

          plugins.push({
            name: file.replace('.jar.disabled', ''),
            filename: file,
            enabled: false,
            size: Math.round(stats.size / 1024),
            modified: stats.mtime
          });
        }
      }

      return plugins;
    } catch (error) {
      throw new Error(`Error al listar plugins: ${error.message}`);
    }
  }

  /**
   * Toggle plugin enabled/disabled
   */
  async togglePlugin(pluginName) {
    try {
      const enabledPath = path.join(this.pluginsPath, `${pluginName}.jar`);
      const disabledPath = path.join(this.pluginsPath, `${pluginName}.jar.disabled`);

      try {
        await fs.access(enabledPath);
        // Está habilitado, deshabilitar
        await fs.rename(enabledPath, disabledPath);
        return { enabled: false, message: 'Plugin deshabilitado' };
      } catch {
        // Está deshabilitado, habilitar
        await fs.access(disabledPath);
        await fs.rename(disabledPath, enabledPath);
        return { enabled: true, message: 'Plugin habilitado' };
      }
    } catch (error) {
      throw new Error(`Error al cambiar estado del plugin: ${error.message}`);
    }
  }

  /**
   * Eliminar plugin
   */
  async deletePlugin(pluginName) {
    try {
      const jarPath = path.join(this.pluginsPath, `${pluginName}.jar`);
      const disabledPath = path.join(this.pluginsPath, `${pluginName}.jar.disabled`);

      try {
        await fs.unlink(jarPath);
      } catch {
        await fs.unlink(disabledPath);
      }

      // Eliminar carpeta de configuración si existe
      const configPath = path.join(this.pluginsPath, pluginName);
      try {
        await fs.rm(configPath, { recursive: true, force: true });
      } catch {
        // No existe, continuar
      }

      return { success: true, message: 'Plugin eliminado' };
    } catch (error) {
      throw new Error(`Error al eliminar plugin: ${error.message}`);
    }
  }

  /**
   * Obtener archivos de configuración de un plugin
   */
  async getPluginConfigFiles(pluginName) {
    try {
      const configPath = path.join(this.pluginsPath, pluginName);

      try {
        const files = await fs.readdir(configPath);
        const configFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml') || f.endsWith('.json'));
        return configFiles;
      } catch {
        return [];
      }
    } catch (error) {
      throw new Error(`Error al obtener archivos de configuración: ${error.message}`);
    }
  }

  /**
   * Leer archivo de configuración de plugin
   */
  async readPluginConfig(pluginName, configFile) {
    try {
      const configPath = path.join(this.pluginsPath, pluginName, configFile);

      if (configFile.endsWith('.yml') || configFile.endsWith('.yaml')) {
        return await this.configService.readYaml(configPath);
      } else if (configFile.endsWith('.json')) {
        return await this.configService.readJson(configPath);
      } else {
        const content = await fs.readFile(configPath, 'utf-8');
        return content;
      }
    } catch (error) {
      throw new Error(`Error al leer configuración: ${error.message}`);
    }
  }

  /**
   * Escribir archivo de configuración de plugin
   */
  async writePluginConfig(pluginName, configFile, content) {
    try {
      const configPath = path.join(this.pluginsPath, pluginName, configFile);

      if (configFile.endsWith('.yml') || configFile.endsWith('.yaml')) {
        await this.configService.writeYaml(configPath, content);
      } else if (configFile.endsWith('.json')) {
        await this.configService.writeJson(configPath, content);
      } else {
        await fs.writeFile(configPath, content, 'utf-8');
      }

      return { success: true, message: 'Configuración actualizada' };
    } catch (error) {
      throw new Error(`Error al escribir configuración: ${error.message}`);
    }
  }
}

export default PluginService;
