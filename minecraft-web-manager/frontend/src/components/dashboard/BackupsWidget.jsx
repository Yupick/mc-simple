import { HardDrive, Plus, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../common';

export default function BackupsWidget({ backups, onCreateBackup, onViewAll }) {
  const latestBackup = backups && backups.length > 0 ? backups[0] : null;
  const totalSize = backups?.reduce((acc, b) => acc + (b.size_bytes || 0), 0) || 0;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Backups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-text-secondary">Total</p>
            <p className="text-lg font-bold text-green-700">{backups?.length || 0}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-text-secondary">Espacio</p>
            <p className="text-lg font-bold text-blue-700">{formatSize(totalSize)}</p>
          </div>
        </div>

        {/* Latest Backup */}
        {latestBackup ? (
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-text-secondary mb-1">Último Backup</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary truncate">
                  {latestBackup.filename}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3 h-3 text-text-secondary" />
                  <p className="text-xs text-text-secondary">
                    {formatDate(latestBackup.created_at)}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                {latestBackup.type}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-lg text-center">
            <p className="text-sm text-text-secondary">No hay backups disponibles</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCreateBackup}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear
          </button>
          <button
            onClick={onViewAll}
            className="flex-1 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Ver Todos
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
