import { Cpu, HardDrive, MemoryStick, Monitor } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../common';

export default function SystemInfoWidget({ systemInfo }) {
  if (!systemInfo) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary text-sm">Cargando información del sistema...</p>
        </CardContent>
      </Card>
    );
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 GB';
    const gb = bytes / 1024 / 1024 / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const getUsagePercentage = (used, total) => {
    if (!total || total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const memory = systemInfo?.memory || { used: 0, total: 0, usagePercent: 0 };
  const disk = systemInfo?.disk || { used: 0, total: 0, usagePercent: 0 };
  const cpu = systemInfo?.cpu || { usage: 0, cores: 0 };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPU */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">CPU</span>
            </div>
            <span className="text-sm font-semibold text-primary-700">
              {cpu.usage || 0}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${cpu.usage || 0}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {cpu.cores || 'N/A'} núcleos
          </p>
        </div>

        {/* RAM */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-4 h-4 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">RAM</span>
            </div>
            <span className="text-sm font-semibold text-blue-700">
              {memory.usagePercent ? Math.round(memory.usagePercent) : getUsagePercentage(memory.used, memory.total)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${memory.usagePercent ? Math.round(memory.usagePercent) : getUsagePercentage(memory.used, memory.total)}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {formatBytes(memory.used)} / {formatBytes(memory.total)}
          </p>
        </div>

        {/* Disco */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">Disco</span>
            </div>
            <span className="text-sm font-semibold text-purple-700">
              {disk.usagePercent ? Math.round(disk.usagePercent) : getUsagePercentage(disk.used, disk.total)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${disk.usagePercent ? Math.round(disk.usagePercent) : getUsagePercentage(disk.used, disk.total)}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {formatBytes(disk.used)} / {formatBytes(disk.total)}
          </p>
        </div>

        {/* Info adicional */}
        <div className="pt-3 border-t border-slate-200 text-xs text-text-secondary space-y-1">
          {systemInfo?.os?.platform && <p>OS: {systemInfo.os.platform}</p>}
          {systemInfo?.javaVersion && <p>Java: {systemInfo.javaVersion}</p>}
          {systemInfo?.uptime && <p>Uptime: {Math.floor(systemInfo.uptime / 3600)}h {Math.floor((systemInfo.uptime % 3600) / 60)}m</p>}
        </div>
      </CardContent>
    </Card>
  );
}
