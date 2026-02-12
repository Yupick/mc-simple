import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api.js';
import { useServerStatus } from '../../hooks/useServerStatus';

export default function ServerControl() {
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const { status } = useServerStatus();
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: () => api.post('/server/start'),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Servidor iniciado correctamente' });
      queryClient.invalidateQueries(['server-status']);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al iniciar servidor' });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => api.post('/server/stop'),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Servidor detenido correctamente' });
      queryClient.invalidateQueries(['server-status']);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al detener servidor' });
    },
  });

  const restartMutation = useMutation({
    mutationFn: () => api.post('/server/restart'),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Servidor reiniciado correctamente' });
      queryClient.invalidateQueries(['server-status']);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al reiniciar servidor' });
    },
  });

  const handleStart = async () => {
    setLoading('start');
    setMessage(null);
    await startMutation.mutateAsync();
    setLoading(null);
  };

  const handleStop = async () => {
    setLoading('stop');
    setMessage(null);
    await stopMutation.mutateAsync();
    setLoading(null);
  };

  const handleRestart = async () => {
    setLoading('restart');
    setMessage(null);
    await restartMutation.mutateAsync();
    setLoading(null);
  };

  const isRunning = status?.running;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Control del Servidor</h2>
        <p className="text-gray-400">
          Inicia, detiene o reinicia el servidor Minecraft
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-900/50 border border-green-700 text-green-300'
              : 'bg-red-900/50 border border-red-700 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleStart}
          disabled={isRunning || loading}
          className="p-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <div className="text-4xl mb-2">▶️</div>
          <div className="text-white font-semibold text-lg">
            {loading === 'start' ? 'Iniciando...' : 'Iniciar Servidor'}
          </div>
          <div className="text-green-200 text-sm mt-1">
            {isRunning ? 'Servidor ya está corriendo' : 'Iniciar el servidor'}
          </div>
        </button>

        <button
          onClick={handleStop}
          disabled={!isRunning || loading}
          className="p-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <div className="text-4xl mb-2">⏹️</div>
          <div className="text-white font-semibold text-lg">
            {loading === 'stop' ? 'Deteniendo...' : 'Detener Servidor'}
          </div>
          <div className="text-red-200 text-sm mt-1">
            {!isRunning ? 'Servidor no está corriendo' : 'Detener el servidor'}
          </div>
        </button>

        <button
          onClick={handleRestart}
          disabled={!isRunning || loading}
          className="p-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <div className="text-4xl mb-2">🔄</div>
          <div className="text-white font-semibold text-lg">
            {loading === 'restart' ? 'Reiniciando...' : 'Reiniciar Servidor'}
          </div>
          <div className="text-blue-200 text-sm mt-1">
            {!isRunning ? 'Servidor no está corriendo' : 'Reiniciar el servidor'}
          </div>
        </button>
      </div>
    </div>
  );
}
