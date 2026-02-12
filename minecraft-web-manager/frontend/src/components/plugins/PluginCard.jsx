import { Plug, Settings, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent } from '../common';

export default function PluginCard({ plugin, onToggle, onConfigure, onDelete }) {
  // Extraer versión del nombre del archivo si está disponible
  const getVersion = (filename) => {
    const match = filename.match(/[-_]v?(\d+\.\d+(\.\d+)?)/i);
    return match ? match[1] : null;
  };

  const version = getVersion(plugin.filename);
  const sizeKB = plugin.size;
  const sizeMB = (sizeKB / 1024).toFixed(2);

  return (
    <Card hover className="relative">
      <CardContent className="p-6">
        {/* Header con estado */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              plugin.enabled
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}>
              <Plug className={`w-6 h-6 ${
                plugin.enabled
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {plugin.name}
              </h3>
              {version && (
                <p className="text-xs text-text-secondary">
                  Versión {version}
                </p>
              )}
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={() => onToggle(plugin)}
            className={`p-2 rounded-lg transition-colors ${
              plugin.enabled
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={plugin.enabled ? 'Deshabilitar' : 'Habilitar'}
          >
            {plugin.enabled ? (
              <ToggleRight className="w-6 h-6" />
            ) : (
              <ToggleLeft className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Estado:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              plugin.enabled
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {plugin.enabled ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Tamaño:</span>
            <span className="text-text-primary font-medium">
              {sizeKB > 1024 ? `${sizeMB} MB` : `${sizeKB} KB`}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Archivo:</span>
            <span className="text-text-primary font-mono text-xs">
              {plugin.filename}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={() => onConfigure(plugin)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </button>
          <button
            onClick={() => onDelete(plugin)}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Advertencia si está deshabilitado */}
        {!plugin.enabled && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            Este plugin está deshabilitado. Habilítalo para que funcione.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
