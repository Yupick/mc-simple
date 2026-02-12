import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import { useWebSocket } from './useWebSocket';

export const useServerStatus = () => {
  const [status, setStatus] = useState(null);
  const { socket, isConnected } = useWebSocket();

  // Query inicial
  const { data, isLoading, error } = useQuery({
    queryKey: ['server-status'],
    queryFn: async () => {
      const response = await api.get('/server/status');
      return response.data.data;
    },
    refetchInterval: 10000, // Refetch cada 10 segundos como fallback
  });

  // Escuchar actualizaciones en tiempo real via WebSocket
  useEffect(() => {
    if (!socket) return;

    socket.on('server-status-update', (newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      socket.off('server-status-update');
    };
  }, [socket]);

  // Usar dato de WebSocket si está disponible, sino usar de query
  const currentStatus = status || data;

  return {
    status: currentStatus,
    isLoading,
    error,
    isConnected,
  };
};
