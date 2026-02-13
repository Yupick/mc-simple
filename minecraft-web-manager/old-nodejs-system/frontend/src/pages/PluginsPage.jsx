import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Plug, AlertCircle, Package } from 'lucide-react';
import api from '../services/api.js';
import PluginCard from '../components/plugins/PluginCard';
import PluginUploader from '../components/plugins/PluginUploader';
import PluginConfigModal from '../components/plugins/PluginConfigModal';
import { Card, CardContent } from '../components/common';

export default function PluginsPage() {
  const queryClient = useQueryClient();
  const [configModal, setConfigModal] = useState({ open: false, plugin: null, files: [] });
  const [notification, setNotification] = useState(null);
  const [showUploader, setShowUploader] = useState(false);

  // Query para listar plugins
  const { data: plugins, isLoading } = useQuery({
    queryKey: ['plugins'],
    queryFn: async () => {
      const response = await api.get('/plugins');
      return response.data.data;
    },
    refetchInterval: 5000,
  });

  // Mutation para toggle enable/disable
  const toggleMutation = useMutation({
    mutationFn: (pluginName) => api.put(`/plugins/${pluginName}/toggle`),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['plugins']);
      setNotification({
        type: 'success',
        message: data.data.data.enabled
          ? 'Plugin habilitado correctamente'
          : 'Plugin deshabilitado correctamente',
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al cambiar estado del plugin',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Mutation para eliminar plugin
  const deleteMutation = useMutation({
    mutationFn: (pluginName) => api.delete(`/plugins/${pluginName}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['plugins']);
      setNotification({ type: 'success', message: 'Plugin eliminado correctamente' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al eliminar plugin',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Mutation para guardar configuración
  const saveConfigMutation = useMutation({
    mutationFn: ({ pluginName, configFile, content }) =>
      api.put(`/plugins/${pluginName}/config`, { configFile, content }),
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Configuración guardada correctamente' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      throw new Error(error.response?.data?.message || 'Error al guardar configuración');
    },
  });

  // Handlers
  const handleToggle = async (plugin) => {
    await toggleMutation.mutateAsync(plugin.name);
  };

  const handleDelete = async (plugin) => {
    if (
      confirm(
        `¿Eliminar plugin "${plugin.name}"?\n\nEsto eliminará el archivo .jar y toda su configuración.`
      )
    ) {
      await deleteMutation.mutateAsync(plugin.name);
    }
  };

  const handleConfigure = async (plugin) => {
    try {
      // Cargar lista de archivos de configuración
      const response = await api.get(`/plugins/${plugin.name}/config/files`);
      const files = response.data.data;

      setConfigModal({
        open: true,
        plugin,
        files,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error al cargar archivos de configuración',
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleLoadConfig = async (pluginName, configFile) => {
    const response = await api.get(`/plugins/${pluginName}/config/${configFile}`);
    return response.data.data;
  };

  const handleSaveConfig = async (pluginName, configFile, content) => {
    await saveConfigMutation.mutateAsync({ pluginName, configFile, content });
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('plugin', file);

    try {
      await api.post('/plugins/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      queryClient.invalidateQueries(['plugins']);
      setNotification({ type: 'success', message: 'Plugin subido correctamente' });
      setTimeout(() => {
        setNotification(null);
        setShowUploader(false);
      }, 2000);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al subir plugin');
    }
  };

  const enabledPlugins = plugins?.filter((p) => p.enabled) || [];
  const disabledPlugins = plugins?.filter((p) => !p.enabled) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Cargando plugins...</div>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestión de Plugins</h1>
          <p className="text-text-secondary mt-2">
            Administra los plugins instalados en el servidor
          </p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {showUploader ? 'Ocultar Uploader' : 'Subir Plugin'}
        </button>
      </div>

      {/* Uploader */}
      {showUploader && <PluginUploader onUpload={handleUpload} />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-100">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Plugins</p>
              <p className="text-2xl font-bold text-text-primary">{plugins?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100">
              <Plug className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Habilitados</p>
              <p className="text-2xl font-bold text-text-primary">{enabledPlugins.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gray-100">
              <Plug className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Deshabilitados</p>
              <p className="text-2xl font-bold text-text-primary">{disabledPlugins.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de plugins habilitados */}
      {enabledPlugins.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Plugins Habilitados ({enabledPlugins.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enabledPlugins.map((plugin) => (
              <PluginCard
                key={plugin.filename}
                plugin={plugin}
                onToggle={handleToggle}
                onConfigure={handleConfigure}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista de plugins deshabilitados */}
      {disabledPlugins.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Plugins Deshabilitados ({disabledPlugins.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disabledPlugins.map((plugin) => (
              <PluginCard
                key={plugin.filename}
                plugin={plugin}
                onToggle={handleToggle}
                onConfigure={handleConfigure}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {plugins && plugins.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Plug className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No hay plugins instalados
            </h3>
            <p className="text-text-secondary mb-4">
              Sube tu primer plugin para empezar a extender las funcionalidades del servidor
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Subir Primer Plugin
            </button>
          </CardContent>
        </Card>
      )}

      {/* Modal de configuración */}
      <PluginConfigModal
        plugin={configModal.plugin}
        isOpen={configModal.open}
        onClose={() => setConfigModal({ open: false, plugin: null, files: [] })}
        onSave={handleSaveConfig}
        configFiles={configModal.files}
        onLoadConfig={handleLoadConfig}
      />
    </div>
  );
}
