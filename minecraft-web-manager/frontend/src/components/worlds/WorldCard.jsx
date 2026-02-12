import { Globe, Edit, Trash2, Play } from 'lucide-react';
import { Card, CardContent, Badge } from '../common';

export default function WorldCard({ world, onActivate, onEdit, onDelete }) {
  const getTypeColor = (type) => {
    const colors = {
      survival: 'bg-green-100 text-green-700',
      creative: 'bg-purple-100 text-purple-700',
      rpg: 'bg-red-100 text-red-700',
      minigames: 'bg-yellow-100 text-yellow-700',
      adventure: 'bg-blue-100 text-blue-700',
      custom: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.custom;
  };

  return (
    <Card hover className="relative">
      {world.active && (
        <div className="absolute top-4 right-4">
          <Badge variant="success" dot>ACTIVO</Badge>
        </div>
      )}

      <CardContent className="p-6">
        {/* Icon y Nombre */}
        <div className="flex items-start gap-4 mb-4">
          <div className="text-5xl">{world.icon || '🌍'}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-text-primary mb-1">
              {world.name}
            </h3>
            <p className="text-sm text-text-secondary line-clamp-2">
              {world.description || 'Sin descripción'}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Tipo:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(world.type)}`}>
              {world.type}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Tamaño:</span>
            <span className="text-text-primary font-medium">{world.size_mb} MB</span>
          </div>
          {world.playerdata_count > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Jugadores:</span>
              <span className="text-text-primary font-medium">{world.playerdata_count}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          {!world.active ? (
            <button
              onClick={() => onActivate(world)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Activar
            </button>
          ) : (
            <div className="flex-1 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center border border-green-200">
              Mundo Activo
            </div>
          )}
          <button
            onClick={() => onEdit(world)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          {!world.active && (
            <button
              onClick={() => onDelete(world)}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
