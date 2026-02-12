import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import ConfigService from './config.service.js';
import ServerService from './server.service.js';

const execPromise = promisify(exec);

class WorldService {
  constructor() {
    this.serverPath = process.env.SERVER_PATH;
    this.worldsPath = path.join(this.serverPath, 'worlds');
    this.configService = new ConfigService();
    this.serverService = new ServerService();
  }

  /**
   * Obtener mundo activo (lee el symlink)
   */
  async getActiveWorld() {
    try {
      const activeLink = path.join(this.worldsPath, 'active');
      const target = await fs.readlink(activeLink);
      return path.basename(target);
    } catch (error) {
      throw new Error('No se pudo leer el mundo activo');
    }
  }

  /**
   * Listar todos los mundos
   */
  async listWorlds() {
    try {
      await fs.mkdir(this.worldsPath, { recursive: true });

      const entries = await fs.readdir(this.worldsPath, { withFileTypes: true });
      const activeWorld = await this.getActiveWorld().catch(() => null);

      const worlds = [];

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'active') {
          const worldPath = path.join(this.worldsPath, entry.name);
          const metadataPath = path.join(worldPath, 'metadata.json');

          let metadata;
          try {
            metadata = await this.configService.readJson(metadataPath);
            if (!metadata) {
              // Si readJson devuelve null (archivo no existe), crear metadata por defecto
              metadata = await this.createDefaultMetadata(entry.name);
            }
          } catch {
            // Crear metadata por defecto si hay error
            metadata = await this.createDefaultMetadata(entry.name);
          }

          // Calcular tamaño del mundo
          try {
            const { stdout } = await execPromise(`du -sb "${worldPath}" | cut -f1`);
            const sizeBytes = parseInt(stdout.trim());
            metadata.size_mb = Math.round(sizeBytes / 1024 / 1024);
          } catch {
            metadata.size_mb = 0;
          }

          metadata.active = entry.name === activeWorld;

          worlds.push(metadata);
        }
      }

      return worlds;
    } catch (error) {
      throw new Error(`Error al listar mundos: ${error.message}`);
    }
  }

  /**
   * Obtener mundo por ID
   */
  async getWorld(worldId) {
    try {
      const worldPath = path.join(this.worldsPath, worldId);
      const metadataPath = path.join(worldPath, 'metadata.json');

      const metadata = await this.configService.readJson(metadataPath);
      if (!metadata) {
        throw new Error('Mundo no encontrado');
      }

      // Calcular tamaño
      const { stdout } = await execPromise(`du -sb "${worldPath}" | cut -f1`);
      const sizeBytes = parseInt(stdout.trim());
      metadata.size_mb = Math.round(sizeBytes / 1024 / 1024);

      // Verificar si es el activo
      const activeWorld = await this.getActiveWorld().catch(() => null);
      metadata.active = worldId === activeWorld;

      return metadata;
    } catch (error) {
      throw new Error(`Error al obtener mundo: ${error.message}`);
    }
  }

  /**
   * Crear nuevo mundo
   */
  async createWorld(worldData) {
    try {
      const { name, description, type, settings } = worldData;

      if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
        throw new Error('Nombre de mundo inválido. Solo letras, números, guiones y guiones bajos');
      }

      const worldPath = path.join(this.worldsPath, name);

      // Verificar que no existe
      try {
        await fs.access(worldPath);
        throw new Error('Ya existe un mundo con ese nombre');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      // Crear directorio del mundo
      await fs.mkdir(worldPath, { recursive: true });

      // Crear subdirectorios de dimensiones
      await fs.mkdir(path.join(worldPath, 'world'), { recursive: true });
      await fs.mkdir(path.join(worldPath, 'world_nether'), { recursive: true });
      await fs.mkdir(path.join(worldPath, 'world_the_end'), { recursive: true });

      // Crear metadata.json
      const metadata = {
        id: name,
        name,
        description: description || '',
        type: type || 'survival',
        icon: this.getIconForType(type),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_played: null,
        size_mb: 0,
        playerdata_count: 0,
        settings: settings || {},
        custom_tags: []
      };

      await this.configService.writeJson(
        path.join(worldPath, 'metadata.json'),
        metadata
      );

      // Copiar server.properties del mundo activo o crear uno nuevo
      let templateProps;
      try {
        const activeWorld = await this.getActiveWorld();
        const activePropsPath = path.join(this.worldsPath, activeWorld, 'server.properties');
        templateProps = await this.configService.readProperties(activePropsPath);
      } catch {
        // Usar propiedades por defecto
        templateProps = {
          'level-name': 'world',
          'gamemode': settings?.gamemode || 'survival',
          'difficulty': settings?.difficulty || 'easy',
          'pvp': settings?.pvp !== undefined ? settings.pvp : 'true',
          'max-players': '20',
          'allow-nether': 'true',
          'spawn-protection': '16'
        };
      }

      // Actualizar con settings específicos si se proporcionaron
      if (settings) {
        Object.assign(templateProps, settings);
      }

      templateProps['level-name'] = 'world'; // Siempre debe ser 'world'

      await this.configService.writeProperties(
        path.join(worldPath, 'server.properties'),
        templateProps
      );

      return metadata;
    } catch (error) {
      throw new Error(`Error al crear mundo: ${error.message}`);
    }
  }

  /**
   * Cambiar mundo activo (requiere servidor detenido)
   */
  async switchWorld(worldId) {
    try {
      // Verificar que el servidor esté detenido
      const status = await this.serverService.getStatus();
      if (status.running) {
        throw new Error('El servidor debe estar detenido para cambiar de mundo');
      }

      // Verificar que el mundo existe
      const worldPath = path.join(this.worldsPath, worldId);
      try {
        await fs.access(worldPath);
      } catch {
        throw new Error(`El mundo "${worldId}" no existe`);
      }

      // Actualizar symlink 'active'
      const activeLink = path.join(this.worldsPath, 'active');

      try {
        await fs.unlink(activeLink);
      } catch {
        // Puede que no exista, continuar
      }

      // Crear nuevo symlink
      await fs.symlink(worldId, activeLink);

      // Actualizar metadata del mundo (last_played)
      await this.updateWorldMetadata(worldId, {
        last_played: new Date().toISOString()
      });

      return { success: true, activeWorld: worldId };
    } catch (error) {
      throw new Error(`Error al cambiar mundo: ${error.message}`);
    }
  }

  /**
   * Actualizar metadata de un mundo
   */
  async updateWorldMetadata(worldId, updates) {
    try {
      const metadataPath = path.join(this.worldsPath, worldId, 'metadata.json');
      let metadata = await this.configService.readJson(metadataPath);

      if (!metadata) {
        throw new Error('Mundo no encontrado');
      }

      metadata = {
        ...metadata,
        ...updates,
        updated_at: new Date().toISOString()
      };

      await this.configService.writeJson(metadataPath, metadata);

      return metadata;
    } catch (error) {
      throw new Error(`Error al actualizar metadata: ${error.message}`);
    }
  }

  /**
   * Obtener properties de un mundo
   */
  async getWorldProperties(worldId) {
    try {
      const propsPath = path.join(this.worldsPath, worldId, 'server.properties');
      return await this.configService.readProperties(propsPath);
    } catch (error) {
      throw new Error(`Error al obtener properties: ${error.message}`);
    }
  }

  /**
   * Actualizar properties de un mundo
   */
  async updateWorldProperties(worldId, properties) {
    try {
      const propsPath = path.join(this.worldsPath, worldId, 'server.properties');

      // Leer properties actuales
      const currentProps = await this.configService.readProperties(propsPath);

      // Merge con nuevas properties
      const updatedProps = { ...currentProps, ...properties };

      // Asegurar que level-name siempre sea 'world'
      updatedProps['level-name'] = 'world';

      // Guardar
      await this.configService.writeProperties(propsPath, updatedProps);

      return updatedProps;
    } catch (error) {
      throw new Error(`Error al actualizar properties: ${error.message}`);
    }
  }

  /**
   * Eliminar mundo
   */
  async deleteWorld(worldId) {
    try {
      // Verificar que no sea el mundo activo
      const activeWorld = await this.getActiveWorld();
      if (worldId === activeWorld) {
        throw new Error('No se puede eliminar el mundo activo. Cambia a otro mundo primero');
      }

      // Verificar que el servidor esté detenido
      const status = await this.serverService.getStatus();
      if (status.running) {
        throw new Error('El servidor debe estar detenido para eliminar un mundo');
      }

      const worldPath = path.join(this.worldsPath, worldId);

      // Eliminar directorio completo
      await fs.rm(worldPath, { recursive: true, force: true });

      return { success: true, message: 'Mundo eliminado correctamente' };
    } catch (error) {
      throw new Error(`Error al eliminar mundo: ${error.message}`);
    }
  }

  /**
   * Crear metadata por defecto
   */
  async createDefaultMetadata(worldId) {
    const metadata = {
      id: worldId,
      name: worldId,
      description: 'Mundo sin descripción',
      type: 'survival',
      icon: '🌍',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_played: null,
      size_mb: 0,
      playerdata_count: 0,
      settings: {},
      custom_tags: []
    };

    const metadataPath = path.join(this.worldsPath, worldId, 'metadata.json');
    await this.configService.writeJson(metadataPath, metadata);

    return metadata;
  }

  /**
   * Obtener ícono según tipo de mundo
   */
  getIconForType(type) {
    const icons = {
      survival: '🌍',
      creative: '🎨',
      rpg: '⚔️',
      minigames: '🎮',
      adventure: '🗺️',
      custom: '🔧'
    };
    return icons[type] || '🌍';
  }
}

export default WorldService;
