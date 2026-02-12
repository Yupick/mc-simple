import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Globe, AlertCircle } from 'lucide-react';
import api from '../services/api.js';
import WorldCard from '../components/worlds/WorldCard';
import ActivateWorldModal from '../components/worlds/ActivateWorldModal';
import EditWorldModal from '../components/worlds/EditWorldModal';
import CreateWorldModal from '../components/worlds/CreateWorldModal';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/common';

export default function WorldsPage() {
  const queryClient = useQueryClient();
  const [activateModal, setActivateModal] = useState({ open: false, world: null });
  const [editModal, setEditModal] = useState({ open: false, world: null });
  const [createModal, setCreateModal] = useState({ open: false });
  const [notification, setNotification] = useState(null);

  // Query para listar mundos
  const { data: worlds, isLoading } = useQuery({
    queryKey: ['worlds'],
    queryFn: async () => {
      const response = await api.get('/worlds');
      return response.data.data;
    },
    refetchInterval: 5000,
  });

  // Query para obtener estado del servidor
  const { data: serverStatus } = useQuery({
    queryKey: ['server-status'],
    queryFn: async () => {
      const response = await api.get('/server/status');
      return response.data.data;
    },
    refetchInterval: 3000,
  });

  // Mutation para activar mundo
  const activateMutation = useMutation({
    mutationFn: (worldId) => api.post(`/worlds/${worldId}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries(['worlds']);
      setNotification({ type: 'success', message: 'Mundo activado correctamente' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al activar mundo',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Mutation para editar mundo
  const editMutation = useMutation({
    mutationFn: ({ worldId, data }) => api.put(`/worlds/${worldId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['worlds']);
      setNotification({ type: 'success', message: 'Mundo actualizado correctamente' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al actualizar mundo',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Mutation para crear mundo
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/worlds', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['worlds']);
      setNotification({ type: 'success', message: 'Mundo creado correctamente' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al crear mundo',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Mutation para eliminar mundo
  const deleteMutation = useMutation({
    mutationFn: (worldId) => api.delete(`/worlds/${worldId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['worlds']);
      setNotification({ type: 'success', message: 'Mundo eliminado correctamente' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al eliminar mundo',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Handlers
  const handleActivateWorld = async (worldId) => {
    await activateMutation.mutateAsync(worldId);
    setActivateModal({ open: false, world: null });
  };

  const handleEditWorld = async (worldId, data) => {
    await editMutation.mutateAsync({ worldId, data });
    setEditModal({ open: false, world: null });
  };

  const handleCreateWorld = async (data) => {
    await createMutation.mutateAsync(data);
    setCreateModal({ open: false });
  };

  const handleDeleteWorld = async (world) => {
    if (world.active) {
      setNotification({
        type: 'error',
        message: 'No se puede eliminar el mundo activo. Activa otro mundo primero.',
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    if (confirm(`¿Eliminar mundo "${world.name}"? Esta acción no se puede deshacer.`)) {
      await deleteMutation.mutateAsync(world.id);
    }
  };

  const activeWorld = worlds?.find((w) => w.active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Cargando mundos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* Header con botón crear */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestión de Mundos</h1>
          <p className="text-text-secondary mt-2">
            Administra los mundos del servidor (multi-mundo con symlinks)
          </p>
        </div>
        <button
          onClick={() => setCreateModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Crear Nuevo Mundo
        </button>
      </div>

      {/* Card destacado del mundo activo */}
      {activeWorld && (
        <Card className="border-2 border-primary-500 bg-primary-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{activeWorld.icon || '🌍'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-text-primary">{activeWorld.name}</h2>
                  <Badge variant="success" dot>
                    MUNDO ACTIVO
                  </Badge>
                </div>
                <p className="text-text-secondary mb-3">
                  {activeWorld.description || 'Sin descripción'}
                </p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-text-secondary">Tipo: </span>
                    <span className="text-text-primary font-medium">{activeWorld.type}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Tamaño: </span>
                    <span className="text-text-primary font-medium">{activeWorld.size_mb} MB</span>
                  </div>
                  {activeWorld.last_played && (
                    <div>
                      <span className="text-text-secondary">Última vez jugado: </span>
                      <span className="text-text-primary font-medium">
                        {new Date(activeWorld.last_played).toLocaleString('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de mundos */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Todos los Mundos</h2>
        {worlds && worlds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {worlds.map((world) => (
              <WorldCard
                key={world.id}
                world={world}
                onActivate={(w) => setActivateModal({ open: true, world: w })}
                onEdit={(w) => setEditModal({ open: true, world: w })}
                onDelete={handleDeleteWorld}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No hay mundos creados
              </h3>
              <p className="text-text-secondary mb-4">
                Crea tu primer mundo para empezar a jugar
              </p>
              <button
                onClick={() => setCreateModal({ open: true })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Primer Mundo
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer info */}
      {worlds && worlds.length > 0 && (
        <div className="text-center text-text-secondary text-sm">
          {worlds.length} mundo(s) encontrado(s)
        </div>
      )}

      {/* Modals */}
      <ActivateWorldModal
        world={activateModal.world}
        isOpen={activateModal.open}
        onClose={() => setActivateModal({ open: false, world: null })}
        onConfirm={handleActivateWorld}
        serverStatus={serverStatus}
      />

      <EditWorldModal
        world={editModal.world}
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, world: null })}
        onSave={handleEditWorld}
      />

      <CreateWorldModal
        isOpen={createModal.open}
        onClose={() => setCreateModal({ open: false })}
        onCreate={handleCreateWorld}
      />
    </div>
  );
}
