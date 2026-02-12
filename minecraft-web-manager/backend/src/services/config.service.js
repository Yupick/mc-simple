import fs from 'fs/promises';
import yaml from 'js-yaml';

class ConfigService {
  /**
   * Leer archivo de propiedades (formato .properties)
   */
  async readProperties(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const properties = {};

      content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key) {
            properties[key.trim()] = valueParts.join('=').trim();
          }
        }
      });

      return properties;
    } catch (error) {
      throw new Error(`Error al leer properties: ${error.message}`);
    }
  }

  /**
   * Escribir archivo de propiedades
   */
  async writeProperties(filePath, properties) {
    try {
      // Leer archivo original para preservar comentarios
      let content = '';
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch {
        // Archivo nuevo, no hay contenido previo
      }

      const lines = content.split('\n');
      const newLines = [];
      const updatedKeys = new Set();

      // Actualizar líneas existentes
      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
          // Preservar comentarios y líneas vacías
          newLines.push(line);
        } else {
          const [key] = trimmed.split('=');
          const cleanKey = key.trim();

          if (properties.hasOwnProperty(cleanKey)) {
            newLines.push(`${cleanKey}=${properties[cleanKey]}`);
            updatedKeys.add(cleanKey);
          } else {
            newLines.push(line);
          }
        }
      }

      // Añadir propiedades nuevas no encontradas
      for (const [key, value] of Object.entries(properties)) {
        if (!updatedKeys.has(key)) {
          newLines.push(`${key}=${value}`);
        }
      }

      await fs.writeFile(filePath, newLines.join('\n'), 'utf-8');
    } catch (error) {
      throw new Error(`Error al escribir properties: ${error.message}`);
    }
  }

  /**
   * Leer archivo YAML
   */
  async readYaml(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return yaml.load(content);
    } catch (error) {
      throw new Error(`Error al leer YAML: ${error.message}`);
    }
  }

  /**
   * Escribir archivo YAML
   */
  async writeYaml(filePath, data) {
    try {
      const content = yaml.dump(data, {
        indent: 2,
        lineWidth: -1
      });
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Error al escribir YAML: ${error.message}`);
    }
  }

  /**
   * Leer archivo JSON
   */
  async readJson(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // Archivo no existe
      }
      throw new Error(`Error al leer JSON: ${error.message}`);
    }
  }

  /**
   * Escribir archivo JSON
   */
  async writeJson(filePath, data) {
    try {
      const content = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Error al escribir JSON: ${error.message}`);
    }
  }
}

export default ConfigService;
