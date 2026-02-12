import { Download, Trash2, RotateCcw, Calendar, HardDrive, FileArchive } from 'lucide-react';

const BACKUP_TYPES = {
  full: { label: 'Completo', icon: HardDrive, color: 'blue' },
  world: { label: 'Mundo', icon: FileArchive, color: 'green' },
  plugins: { label: 'Plugins', icon: FileArchive, color: 'purple' },
  config: { label: 'Configuración', icon: FileArchive, color: 'orange' }
};

export default function BackupCard({ backup, onRestore, onDelete, onDownload }) {
  const typeInfo = BACKUP_TYPES[backup.type] || BACKUP_TYPES.full;
  const TypeIcon = typeInfo.icon;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${typeInfo.color}-50`}>
            <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-600`} />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{backup.filename}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
              {typeInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(backup.created_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <HardDrive className="w-4 h-4" />
          <span>{formatSize(backup.size_bytes)}</span>
        </div>
        {backup.status && (
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              backup.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {backup.status === 'completed' ? 'Completado' : 'En progreso'}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={() => onRestore(backup)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar
        </button>
        <button
          onClick={() => onDownload(backup)}
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
          title="Descargar"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(backup)}
          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
