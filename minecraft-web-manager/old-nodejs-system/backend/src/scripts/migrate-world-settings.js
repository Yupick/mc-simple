import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import ConfigService from '../services/config.service.js';

// Cargar variables de entorno
dotenv.config();

const configService = new ConfigService();
const serverPath = process.env.SERVER_PATH;
const worldsPath = path.join(serverPath, 'worlds');

/**
 * Mapeo de nombres de campos de metadata.json a server.properties
 */
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
  'view-distance': 'view-distance',
  'onlineMode': 'online-mode',
  'online-mode': 'online-mode'
};

async function migrateWorldSettings() {
  console.log('\n🔄 Migración de Configuraciones de Mundos');
  console.log('='.repeat(60));
  console.log('Este script migra los settings de metadata.json a server.properties\n');

  try {
    // Listar mundos
    const entries = await fs.readdir(worldsPath, { withFileTypes: true });
    const worlds = entries.filter(e => e.isDirectory() && e.name !== 'active');

    console.log(`📁 Encontrados ${worlds.length} mundos\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const worldEntry of worlds) {
      const worldId = worldEntry.name;
      const worldPath = path.join(worldsPath, worldId);
      const metadataPath = path.join(worldPath, 'metadata.json');
      const propertiesPath = path.join(worldPath, 'server.properties');

      console.log(`🌍 Procesando: ${worldId}`);

      try {
        // Leer metadata
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataContent);

        // Verificar si tiene settings
        if (!metadata.settings || Object.keys(metadata.settings).length === 0) {
          console.log(`   ⏭️  Sin settings para migrar`);
          skippedCount++;
          continue;
        }

        console.log(`   📋 Settings encontrados: ${Object.keys(metadata.settings).length} campos`);

        // Leer server.properties actuales
        let currentProps = {};
        try {
          currentProps = await configService.readProperties(propertiesPath);
        } catch (error) {
          console.log(`   ⚠️  No existe server.properties, creando uno nuevo`);
          currentProps = {
            'level-name': 'world'
          };
        }

        // Convertir settings a properties
        const newProps = { ...currentProps };
        let propsUpdated = 0;

        for (const [key, value] of Object.entries(metadata.settings)) {
          const propName = propertiesMapping[key] || key;

          // Convertir booleanos a string
          const propValue = typeof value === 'boolean' ? value.toString() : value.toString();

          // Solo actualizar si cambió
          if (newProps[propName] !== propValue) {
            newProps[propName] = propValue;
            propsUpdated++;
            console.log(`   ✓ ${propName} = ${propValue}`);
          }
        }

        // Asegurar que level-name siempre sea 'world'
        newProps['level-name'] = 'world';

        // Guardar server.properties
        if (propsUpdated > 0) {
          await configService.writeProperties(propertiesPath, newProps);
          console.log(`   💾 Server.properties actualizado (${propsUpdated} cambios)`);
        }

        // Eliminar campo settings de metadata
        delete metadata.settings;
        metadata.updated_at = new Date().toISOString();

        // Guardar metadata sin settings
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        console.log(`   🧹 Settings eliminados de metadata.json`);

        migratedCount++;
        console.log(`   ✅ Migración completada\n`);

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
      }
    }

    console.log('='.repeat(60));
    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Mundos migrados: ${migratedCount}`);
    console.log(`   ⏭️  Mundos omitidos: ${skippedCount}`);
    console.log(`   📁 Total procesados: ${worlds.length}`);
    console.log('\n✨ Migración completada con éxito!\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar
migrateWorldSettings();
