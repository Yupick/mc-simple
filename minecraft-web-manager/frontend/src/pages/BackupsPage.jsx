import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, HardDrive, Download, AlertTriangle, RotateCcw } from 'lucide-react';
import api from '../services/api';
import BackupCard from '../components/backups/BackupCard';
import BackupCreator from '../components/backups/BackupCreator';
import BackupScheduler from '../components/backups/BackupScheduler';
import { Card, CardContent } from '../components/common';

export default function BackupsPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [filter, setFilter] = useState('all'); // all, full, world, plugins, config

  // Queries
  const { data: backups, isLoading: backupsLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await api.get('/backups');
      return response.data.data;
    },
    refetchInterval: 5000
  });

  const { data: scheduledBackups, isLoading: schedulesLoading } = useQuery({
    queryKey: ['scheduled-backups'],
    queryFn: async () => {
      const response = await api.get('/backups/scheduled');
      return response.data.data;
    }
  });

  // Mutations
  const createBackupMutation = useMutation({
    mutationFn: (data) => api.post('/backups', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['backups']);
      setNotification({ type: 'success', message: 'Backup creado correctamente' });
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al crear backup'
      });
    }
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (id) => api.delete(`/backups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['backups']);
      setNotification({ type: 'success', message: 'Backup eliminado correctamente' });
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al eliminar backup'
      });
    }
  });

  const restoreBackupMutation = useMutation({
    mutationFn: (id) => api.post(`/backups/${id}/restore`),
    onSuccess: () => {
      setNotification({
        type: 'success',
        message: 'Backup restaurado correctamente. Reinicia el servidor para aplicar cambios.'
      });
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al restaurar backup'
      });
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data) => api.post('/backups/scheduled', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-backups']);
      setNotification({ type: 'success', message: 'Tarea programada creada correctamente' });
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al crear tarea programada'
      });
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => api.delete(`/backups/scheduled/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-backups']);
      setNotification({ type: 'success', message: 'Tarea eliminada correctamente' });
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al eliminar tarea'
      });
    }
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: ({ id, enabled }) => api.patch(`/backups/scheduled/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-backups']);
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al actualizar tarea'
      });
    }
  });

  // Handlers
  const handleCreateBackup = async (data) => {
    await createBackupMutation.mutateAsync(data);
  };

  const handleRestoreBackup = async (backup) => {
    const confirmed = window.confirm(
      `¿Estás seguro de restaurar el backup "${backup.filename}"?\n\n` +
      'Esta acción sobrescribirá los archivos actuales. Se creará un backup automático antes de restaurar.'
    );
    if (confirmed) {
      await restoreBackupMutation.mutateAsync(backup.id);
    }
  };

  const handleDeleteBackup = async (backup) => {
    const confirmed = window.confirm(
      `¿Eliminar el backup "${backup.filename}"?\n\nEsta acción no se puede deshacer.`
    );
    if (confirmed) {
      await deleteBackupMutation.mutateAsync(backup.id);
    }
  };

  const handleDownloadBackup = (backup) => {
    window.open(`${api.defaults.baseURL}/backups/${backup.id}/download`, '_blank');
  };

  const handleCreateSchedule = async (data) => {
    await createScheduleMutation.mutateAsync(data);
  };

  const handleDeleteSchedule = async (id) => {
    const confirmed = window.confirm('¿Eliminar esta tarea programada?');
    if (confirmed) {
      await deleteScheduleMutation.mutateAsync(id);
    }
  };

  const handleToggleSchedule = async (id, enabled) => {
    await toggleScheduleMutation.mutateAsync({ id, enabled });
  };

  // Filtrar backups
  const filteredBackups = backups?.filter(backup =>
    filter === 'all' || backup.type === filter
  ) || [];

  // Calcular estadísticas
  const totalSize = backups?.reduce((acc, backup) => acc + (backup.size_bytes || 0), 0) || 0;
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Auto-dismiss notifications
  if (notification) {
    setTimeout(() => setNotification(null), 5000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestión de Backups</h1>
          <p className="text-text-secondary mt-2">
            Crea, restaura y programa backups automáticos de tu servidor
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Crear Backup
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total de Backups</p>
                <p className="text-2xl font-bold text-text-primary">{backups?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Espacio Usado</p>
                <p className="text-2xl font-bold text-text-primary">{formatSize(totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <RotateCcw className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Tareas Programadas</p>
                <p className="text-2xl font-bold text-text-primary">
                  {scheduledBackups?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduler */}
      <BackupScheduler
        schedules={scheduledBackups}
        onCreate={handleCreateSchedule}
        onDelete={handleDeleteSchedule}
        onToggle={handleToggleSchedule}
      />

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">Filtrar:</span>
        {['all', 'full', 'world', 'plugins', 'config'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type === 'all' ? 'Todos' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de backups */}
      {backupsLoading ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">Cargando backups...</p>
        </div>
      ) : filteredBackups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBackups.map((backup) => (
            <BackupCard
              key={backup.id}
              backup={backup}
              onRestore={handleRestoreBackup}
              onDelete={handleDeleteBackup}
              onDownload={handleDownloadBackup}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <HardDrive className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-text-secondary">No hay backups disponibles</p>
          <p className="text-sm text-text-secondary mt-1">
            {filter !== 'all'
              ? `No hay backups de tipo "${filter}"`
              : 'Crea tu primer backup para comenzar'}
          </p>
        </div>
      )}

      {/* Advertencia */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">Importante</p>
              <ul className="text-yellow-700 mt-2 space-y-1">
                <li>• Antes de restaurar un backup, se creará un backup automático del estado actual</li>
                <li>• Detén el servidor antes de restaurar para evitar problemas</li>
                <li>• Reinicia el servidor después de restaurar para aplicar los cambios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <BackupCreator
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateBackup}
      />
    </div>
  );
}
