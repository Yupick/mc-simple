import { Globe, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../common';

export default function ActiveWorldWidget({ activeWorld, onChangeWorld }) {
  if (!activeWorld) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Mundo Activo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-text-secondary">No hay mundo activo</p>
            <button
              onClick={onChangeWorld}
              className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Seleccionar Mundo
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Mundo Activo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* World Info */}
        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg">
          <span className="text-4xl">{activeWorld.icon || '🌍'}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">{activeWorld.name}</h3>
            <p className="text-sm text-text-secondary">{activeWorld.description || 'Sin descripción'}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-primary-200 text-primary-800 rounded">
                {activeWorld.type}
              </span>
              <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded">
                {activeWorld.size_mb || 0} MB
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-text-secondary">Modo</p>
            <p className="text-sm font-semibold text-text-primary">
              {activeWorld.settings?.gamemode || 'survival'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-text-secondary">Dificultad</p>
            <p className="text-sm font-semibold text-text-primary">
              {activeWorld.settings?.difficulty || 'normal'}
            </p>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onChangeWorld}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Cambiar Mundo
        </button>
      </CardContent>
    </Card>
  );
}
