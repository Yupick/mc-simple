import { Server, Circle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../common';

export default function ServerStatusWidget({ serverStatus, onStart, onStop }) {
  const isRunning = serverStatus?.running || false;
  const players = serverStatus?.players || { online: 0, max: 20 };
  const uptimeSeconds = serverStatus?.uptime || 0;
  const memory = serverStatus?.memory || { used: 0, max: 0 };

  const formatMemory = (bytes) => {
    if (!bytes) return '0 MB';
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  };

  const formatUptime = (seconds) => {
    if (!seconds || seconds === 0) return '0m';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

    return parts.join(' ');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Estado del Servidor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Circle
              className={`w-3 h-3 fill-current ${
                isRunning ? 'text-green-500' : 'text-red-500'
              }`}
            />
            <span className={`text-sm font-medium ${
              isRunning ? 'text-green-700' : 'text-red-700'
            }`}>
              {isRunning ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {isRunning && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-primary-50 rounded-lg">
              <p className="text-xs text-text-secondary">Jugadores</p>
              <p className="text-lg font-bold text-primary-700">
                {players.online} / {players.max}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-text-secondary">Uptime</p>
              <p className="text-lg font-bold text-blue-700">{formatUptime(uptimeSeconds)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg col-span-2">
              <p className="text-xs text-text-secondary">Memoria RAM</p>
              <p className="text-lg font-bold text-purple-700">
                {formatMemory(memory.used)} / {formatMemory(memory.max)}
              </p>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${memory.max > 0 ? (memory.used / memory.max) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isRunning ? (
            <button
              onClick={onStop}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Detener
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Iniciar
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
