import { useServerStatus } from '../../hooks/useServerStatus';

export default function ServerStatus() {
  const { status, isLoading, isConnected } = useServerStatus();

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-gray-400">Cargando estado del servidor...</div>
      </div>
    );
  }

  const formatUptime = (milliseconds) => {
    if (!milliseconds) return 'N/A';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const isRunning = status?.running;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Estado del Servidor</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">{isRunning ? '✅' : '⭕'}</div>
            <div>
              <div className="text-sm text-gray-400">Estado</div>
              <div className={`text-lg font-semibold ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
                {isRunning ? 'En Línea' : 'Detenido'}
              </div>
            </div>
          </div>
          {isRunning && status.pid && (
            <div className="text-xs text-gray-500">PID: {status.pid}</div>
          )}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">💾</div>
            <div>
              <div className="text-sm text-gray-400">Memoria RAM</div>
              <div className="text-lg font-semibold text-white">
                {isRunning && status.memory?.rss
                  ? `${status.memory.rss} MB`
                  : 'N/A'}
              </div>
            </div>
          </div>
          {isRunning && status.cpu && (
            <div className="text-xs text-gray-500">CPU: {status.cpu}%</div>
          )}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">⏱️</div>
            <div>
              <div className="text-sm text-gray-400">Uptime</div>
              <div className="text-lg font-semibold text-white">
                {isRunning ? formatUptime(status.uptime) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">👥</div>
            <div>
              <div className="text-sm text-gray-400">Jugadores</div>
              <div className="text-lg font-semibold text-white">
                {isRunning && status.players
                  ? `${status.players.online}/${status.players.max}`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
