import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, RotateCw, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../common';

export default function ServerProperties() {
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    world: false,
    network: false,
    advanced: false
  });
  const [properties, setProperties] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Query: Obtener server.properties
  const { isLoading } = useQuery({
    queryKey: ['server-properties'],
    queryFn: async () => {
      const response = await api.get('/config/server-properties');
      const data = response.data.data;
      setProperties(data);
      return data;
    }
  });

  // Mutation: Guardar properties
  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/config/server-properties', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['server-properties']);
      setHasChanges(false);
    }
  });

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleChange = (key, value) => {
    setProperties({
      ...properties,
      [key]: value
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(properties);
    } catch (error) {
      console.error('Error al guardar properties:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: 'general',
      title: 'General',
      icon: '⚙️',
      fields: [
        { key: 'motd', label: 'MOTD (Mensaje del Día)', type: 'text', placeholder: 'Un servidor de Minecraft' },
        { key: 'max-players', label: 'Jugadores Máximos', type: 'number', min: 1, max: 1000 },
        { key: 'gamemode', label: 'Modo de Juego', type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'] },
        { key: 'force-gamemode', label: 'Forzar Modo de Juego', type: 'boolean' },
        { key: 'hardcore', label: 'Modo Hardcore', type: 'boolean' },
        { key: 'white-list', label: 'Whitelist Activada', type: 'boolean' },
        { key: 'pvp', label: 'PvP Activado', type: 'boolean' }
      ]
    },
    {
      id: 'world',
      title: 'Mundo',
      icon: '🌍',
      fields: [
        { key: 'difficulty', label: 'Dificultad', type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'] },
        { key: 'spawn-protection', label: 'Protección de Spawn (bloques)', type: 'number', min: 0, max: 100 },
        { key: 'view-distance', label: 'Distancia de Visión (chunks)', type: 'number', min: 3, max: 32 },
        { key: 'simulation-distance', label: 'Distancia de Simulación (chunks)', type: 'number', min: 3, max: 32 },
        { key: 'spawn-monsters', label: 'Generar Monstruos', type: 'boolean' },
        { key: 'spawn-animals', label: 'Generar Animales', type: 'boolean' },
        { key: 'spawn-npcs', label: 'Generar NPCs (Aldeanos)', type: 'boolean' },
        { key: 'allow-nether', label: 'Permitir Nether', type: 'boolean' }
      ]
    },
    {
      id: 'network',
      title: 'Red',
      icon: '🌐',
      fields: [
        { key: 'server-port', label: 'Puerto del Servidor', type: 'number', min: 1, max: 65535 },
        { key: 'server-ip', label: 'IP del Servidor', type: 'text', placeholder: '0.0.0.0' },
        { key: 'online-mode', label: 'Modo Online (Autenticación Mojang)', type: 'boolean' },
        { key: 'enable-rcon', label: 'Habilitar RCON', type: 'boolean' },
        { key: 'rcon.port', label: 'Puerto RCON', type: 'number', min: 1, max: 65535 },
        { key: 'enable-query', label: 'Habilitar Query', type: 'boolean' }
      ]
    },
    {
      id: 'advanced',
      title: 'Avanzado',
      icon: '🔧',
      fields: [
        { key: 'allow-flight', label: 'Permitir Volar', type: 'boolean' },
        { key: 'max-world-size', label: 'Tamaño Máximo del Mundo', type: 'number', min: 1, max: 29999984 },
        { key: 'max-build-height', label: 'Altura Máxima de Construcción', type: 'number', min: 0, max: 256 },
        { key: 'enable-command-block', label: 'Habilitar Command Blocks', type: 'boolean' },
        { key: 'function-permission-level', label: 'Nivel de Permisos de Funciones', type: 'number', min: 1, max: 4 },
        { key: 'op-permission-level', label: 'Nivel de Permisos de Operadores', type: 'number', min: 1, max: 4 }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Server Properties</h2>
          <p className="text-text-secondary mt-1">
            Configuración del archivo server.properties
          </p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </div>

      {/* Advertencia */}
      {hasChanges && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <RotateCw className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">Reinicio requerido</p>
              <p className="text-sm text-yellow-700 mt-1">
                Los cambios en server.properties solo se aplicarán tras reiniciar el servidor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Secciones con accordion */}
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader
              className="cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{section.icon}</span>
                  <span>{section.title}</span>
                </CardTitle>
                {expandedSections[section.id] ? (
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-text-secondary" />
                )}
              </div>
            </CardHeader>

            {expandedSections[section.id] && (
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {field.label}
                      </label>

                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={properties[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}

                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={properties[field.key] || ''}
                          onChange={(e) => handleChange(field.key, parseInt(e.target.value) || 0)}
                          min={field.min}
                          max={field.max}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}

                      {field.type === 'select' && (
                        <select
                          value={properties[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}

                      {field.type === 'boolean' && (
                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={properties[field.key] === 'true' || properties[field.key] === true}
                            onChange={(e) => handleChange(field.key, e.target.checked ? 'true' : 'false')}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-sm text-text-primary">
                            {properties[field.key] === 'true' || properties[field.key] === true ? 'Activado' : 'Desactivado'}
                          </span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
