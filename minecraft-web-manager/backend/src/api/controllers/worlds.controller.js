import WorldService from '../../services/world.service.js';
import AuditLog from '../../models/AuditLog.js';

const worldService = new WorldService();

class WorldsController {
  /**
   * GET /api/worlds
   * Listar todos los mundos
   */
  static async list(req, res) {
    try {
      const worlds = await worldService.listWorlds();
      res.json({
        success: true,
        data: worlds
      });
    } catch (error) {
      console.error('Error al listar mundos:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/worlds/active
   * Obtener mundo activo
   */
  static async getActive(req, res) {
    try {
      const activeWorldId = await worldService.getActiveWorld();
      const world = await worldService.getWorld(activeWorldId);
      res.json({
        success: true,
        data: world
      });
    } catch (error) {
      console.error('Error al obtener mundo activo:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/worlds/:id
   * Obtener mundo por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const world = await worldService.getWorld(id);
      res.json({
        success: true,
        data: world
      });
    } catch (error) {
      console.error('Error al obtener mundo:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/worlds
   * Crear nuevo mundo
   */
  static async create(req, res) {
    try {
      const worldData = req.body;

      // Separar campos entre metadata y properties
      const { metadataUpdates, propertiesUpdates } = WorldsController._separateWorldFields(worldData);

      // Combinar datos para crear el mundo
      const worldCreateData = {
        ...metadataUpdates,
        settings: propertiesUpdates // Las properties se pasan como settings para createWorld
      };

      const world = await worldService.createWorld(worldCreateData);

      // Registrar en audit log
      AuditLog.logWorldAction(
        req.user.userId,
        'world_create',
        world.id,
        { name: world.name, type: world.type },
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Mundo creado correctamente',
        data: world
      });
    } catch (error) {
      console.error('Error al crear mundo:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/worlds/:id
   * Actualizar metadata y properties del mundo
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // No permitir cambiar el ID
      delete updates.id;
      delete updates.created_at;

      // Separar campos entre metadata y server.properties
      const { metadataUpdates, propertiesUpdates } = WorldsController._separateWorldFields(updates);

      let updatedWorld = null;

      // Actualizar metadata si hay cambios
      if (Object.keys(metadataUpdates).length > 0) {
        updatedWorld = await worldService.updateWorldMetadata(id, metadataUpdates);
      }

      // Actualizar server.properties si hay cambios
      if (Object.keys(propertiesUpdates).length > 0) {
        await worldService.updateWorldProperties(id, propertiesUpdates);
      }

      // Si no se actualizó metadata, obtener el mundo actual
      if (!updatedWorld) {
        updatedWorld = await worldService.getWorld(id);
      }

      // Registrar en audit log
      AuditLog.logWorldAction(
        req.user.userId,
        'world_update',
        id,
        {
          metadataUpdates: Object.keys(metadataUpdates),
          propertiesUpdates: Object.keys(propertiesUpdates)
        },
        req.ip
      );

      res.json({
        success: true,
        message: 'Mundo actualizado correctamente',
        data: updatedWorld
      });
    } catch (error) {
      console.error('Error al actualizar mundo:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Separar campos entre metadata.json y server.properties
   * @private
   */
  static _separateWorldFields(updates) {
    // Campos que van a metadata.json (información descriptiva)
    const metadataFieldsWhitelist = [
      'name', 'description', 'type', 'icon', 'custom_tags'
    ];

    // Campos que van a server.properties (configuración del servidor)
    // Mapeo: nombre frontend → nombre en server.properties
    const propertiesMapping = {
      'gamemode': 'gamemode',
      'difficulty': 'difficulty',
      'pvp': 'pvp',
      'maxPlayers': 'max-players',
      'max-players': 'max-players',
      'allowFlight': 'allow-flight',
      'allow-flight': 'allow-flight',
      'allowNether': 'allow-nether',
      'allow-nether': 'allow-nether',
      'motd': 'motd',
      'seed': 'level-seed',
      'level-seed': 'level-seed',
      'spawnProtection': 'spawn-protection',
      'spawn-protection': 'spawn-protection',
      'viewDistance': 'view-distance',
      'view-distance': 'view-distance'
    };

    const metadataUpdates = {};
    const propertiesUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
      if (metadataFieldsWhitelist.includes(key)) {
        // Campo va a metadata.json
        metadataUpdates[key] = value;
      } else if (propertiesMapping[key]) {
        // Campo va a server.properties
        const propName = propertiesMapping[key];
        // Convertir booleanos a string 'true'/'false' para server.properties
        if (typeof value === 'boolean') {
          propertiesUpdates[propName] = value.toString();
        } else {
          propertiesUpdates[propName] = value;
        }
      }
      // Si no está en ninguna lista, se ignora silenciosamente
    }

    return { metadataUpdates, propertiesUpdates };
  }

  /**
   * DELETE /api/worlds/:id
   * Eliminar mundo
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await worldService.deleteWorld(id);

      // Registrar en audit log
      AuditLog.logWorldAction(
        req.user.userId,
        'world_delete',
        id,
        null,
        req.ip
      );

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error al eliminar mundo:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/worlds/:id/activate
   * Cambiar al mundo activo
   */
  static async activate(req, res) {
    try {
      const { id } = req.params;

      const result = await worldService.switchWorld(id);

      // Registrar en audit log
      AuditLog.logWorldAction(
        req.user.userId,
        'world_switch',
        id,
        { worldId: id },
        req.ip
      );

      res.json({
        success: true,
        message: 'Mundo cambiado correctamente',
        data: result
      });
    } catch (error) {
      console.error('Error al cambiar mundo:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/worlds/:id/properties
   * Obtener server.properties del mundo
   */
  static async getProperties(req, res) {
    try {
      const { id } = req.params;
      const properties = await worldService.getWorldProperties(id);
      res.json({
        success: true,
        data: properties
      });
    } catch (error) {
      console.error('Error al obtener properties:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/worlds/:id/properties
   * Actualizar server.properties del mundo
   */
  static async updateProperties(req, res) {
    try {
      const { id } = req.params;
      const properties = req.body;

      const updatedProps = await worldService.updateWorldProperties(id, properties);

      // Registrar en audit log
      AuditLog.logWorldAction(
        req.user.userId,
        'world_update_properties',
        id,
        { properties: Object.keys(properties) },
        req.ip
      );

      res.json({
        success: true,
        message: 'Propiedades actualizadas correctamente',
        data: updatedProps
      });
    } catch (error) {
      console.error('Error al actualizar properties:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default WorldsController;
