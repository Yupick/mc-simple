import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    // Solicitar inicio de stream
    socket.emit('start-logs');

    // Escuchar logs
    socket.on('log', (logData) => {
      setLogs((prev) => [...prev.slice(-99), logData]); // Mantener últimos 100 logs
    });

    socket.on('logs-started', (data) => {
      console.log(data.message);
    });

    socket.on('log-error', (data) => {
      console.error('Error en logs:', data.message);
    });

    return () => {
      socket.emit('stop-logs');
      socket.off('log');
      socket.off('logs-started');
      socket.off('log-error');
    };
  }, [socket]);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLogLevel = (message) => {
    if (message.includes('[WARN]')) return 'warn';
    if (message.includes('[ERROR]')) return 'error';
    if (message.includes('[SEVERE]')) return 'error';
    if (message.includes('[INFO]')) return 'info';
    return 'info';
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    const level = getLogLevel(log.message);
    return level === filter;
  });

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Logs del Servidor</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <span className="text-sm text-gray-400">
            {isConnected ? 'En vivo' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'info'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            INFO
          </button>
          <button
            onClick={() => setFilter('warn')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'warn'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            WARN
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ERROR
          </button>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              autoScroll
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {autoScroll ? '📜 Auto-scroll ON' : '📜 Auto-scroll OFF'}
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 h-[600px] overflow-y-auto font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {logs.length === 0 ? 'Esperando logs...' : 'No hay logs para mostrar con este filtro'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => {
              const level = getLogLevel(log.message);
              const colorClass =
                level === 'error'
                  ? 'text-red-400'
                  : level === 'warn'
                  ? 'text-yellow-400'
                  : 'text-gray-300';

              return (
                <div key={index} className={`${colorClass} whitespace-pre-wrap break-all`}>
                  {log.message}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Mostrando {filteredLogs.length} de {logs.length} logs
      </div>
    </div>
  );
}
