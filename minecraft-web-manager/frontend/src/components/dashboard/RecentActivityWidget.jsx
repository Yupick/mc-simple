import { Activity, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../common';

const ACTION_ICONS = {
  login: '🔐',
  server_start: '▶️',
  server_stop: '⏹️',
  server_restart: '🔄',
  world_switch: '🌍',
  world_create: '✨',
  plugin_upload: '📦',
  plugin_toggle: '🔌',
  backup_create: '💾',
  backup_restore: '♻️',
  config_update: '⚙️'
};

const ACTION_COLORS = {
  login: 'bg-blue-100 text-blue-800',
  server_start: 'bg-green-100 text-green-800',
  server_stop: 'bg-red-100 text-red-800',
  server_restart: 'bg-yellow-100 text-yellow-800',
  world_switch: 'bg-purple-100 text-purple-800',
  world_create: 'bg-primary-100 text-primary-800',
  plugin_upload: 'bg-orange-100 text-orange-800',
  plugin_toggle: 'bg-slate-100 text-slate-800',
  backup_create: 'bg-indigo-100 text-indigo-800',
  backup_restore: 'bg-pink-100 text-pink-800',
  config_update: 'bg-teal-100 text-teal-800'
};

const ACTION_LABELS = {
  login: 'Inicio de sesión',
  server_start: 'Servidor iniciado',
  server_stop: 'Servidor detenido',
  server_restart: 'Servidor reiniciado',
  world_switch: 'Mundo cambiado',
  world_create: 'Mundo creado',
  plugin_upload: 'Plugin subido',
  plugin_toggle: 'Plugin activado/desactivado',
  backup_create: 'Backup creado',
  backup_restore: 'Backup restaurado',
  config_update: 'Configuración actualizada'
};

export default function RecentActivityWidget({ activities, onViewAll }) {
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="text-2xl">{ACTION_ICONS[activity.action] || '📝'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${ACTION_COLORS[activity.action] || 'bg-slate-200 text-slate-800'}`}>
                      {ACTION_LABELS[activity.action] || activity.action}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Clock className="w-3 h-3" />
                      {formatTime(activity.created_at)}
                    </div>
                  </div>
                  {activity.resource_id && (
                    <p className="text-sm text-text-secondary mt-1 truncate">
                      {activity.resource_id}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {onViewAll && (
              <button
                onClick={onViewAll}
                className="w-full px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-sm"
              >
                Ver Historial Completo
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-text-secondary">No hay actividad reciente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
