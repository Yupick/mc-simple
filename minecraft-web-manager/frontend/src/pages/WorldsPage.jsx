import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';

export default function WorldsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['worlds'],
    queryFn: async () => {
      const response = await api.get('/worlds');
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div className="text-white">Cargando mundos...</div>;
  }

  const worlds = data || [];
  const activeWorld = worlds.find(w => w.active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Gestión de Mundos</h1>
        <p className="text-gray-400 mt-2">
          Administra los mundos del servidor (multi-mundo con symlinks)
        </p>
      </div>

      {activeWorld && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{activeWorld.icon}</div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{activeWorld.name}</h2>
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  ACTIVO
                </span>
              </div>
              <p className="text-gray-300 mt-1">{activeWorld.description || 'Sin descripción'}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-400">
                <span>Tipo: {activeWorld.type}</span>
                <span>Tamaño: {activeWorld.size_mb} MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {worlds.map((world) => (
          <div
            key={world.id}
            className={`bg-gray-800 border rounded-lg p-6 transition-all ${
              world.active
                ? 'border-blue-600 shadow-lg shadow-blue-900/50'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-4xl">{world.icon}</div>
              {world.active && (
                <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                  ACTIVO
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{world.name}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {world.description || 'Sin descripción'}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Tipo:</span>
                <span className="text-white">{world.type}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tamaño:</span>
                <span className="text-white">{world.size_mb} MB</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {!world.active && (
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                  Activar
                </button>
              )}
              <button className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors">
                Editar
                </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-gray-500 text-sm">
        {worlds.length} mundo(s) encontrado(s)
      </div>
    </div>
  );
}
