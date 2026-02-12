import { useEffect, useState } from 'react';
import { Server, Users, Clock, Activity } from 'lucide-react';
import { useServerStatus } from '../../hooks/useServerStatus';

export default function ServerStatusWidget() {
  const { data: status, isLoading } = useServerStatus();

  const formatUptime = (uptime) => {
    if (!uptime) return '0m';
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  const isOnline = status?.running || false;
  const playerCount = status?.players?.online || 0;
  const maxPlayers = status?.players?.max || 20;
  const uptime = status?.uptime || 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Estado
        </span>
        <div className={`flex items-center gap-1.5 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} ${isOnline ? 'animate-pulse-slow' : ''}`}></div>
          <span className="text-xs font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Server Info Card */}
      <div className={`p-3 rounded-lg border ${
        isOnline
          ? 'bg-green-50 border-green-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="space-y-2">
          {/* Server Status */}
          <div className="flex items-center gap-2">
            <Server className={`w-4 h-4 ${isOnline ? 'text-green-600' : 'text-slate-400'}`} />
            <span className="text-sm font-medium text-slate-700">
              Servidor {isOnline ? 'Corriendo' : 'Detenido'}
            </span>
          </div>

          {isOnline && (
            <>
              {/* Players Count */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-slate-600">
                  {playerCount} / {maxPlayers} jugadores
                </span>
              </div>

              {/* Uptime */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {formatUptime(uptime)}
                </span>
              </div>

              {/* RAM Usage (if available) */}
              {status?.memory && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>RAM</span>
                    <span>{status.memory.used_gb} / {status.memory.max_gb} GB</span>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(status.memory.used_gb / status.memory.max_gb) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* World Info (if available) */}
      {status?.world && (
        <div className="flex items-center gap-2 px-2">
          <Activity className="w-3.5 h-3.5 text-primary-500" />
          <span className="text-xs text-slate-600 truncate">
            {status.world}
          </span>
        </div>
      )}
    </div>
  );
}
