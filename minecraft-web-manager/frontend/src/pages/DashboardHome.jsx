import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ServerStatusWidget from '../components/dashboard/ServerStatusWidget';
import ActiveWorldWidget from '../components/dashboard/ActiveWorldWidget';
import BackupsWidget from '../components/dashboard/BackupsWidget';
import RecentActivityWidget from '../components/dashboard/RecentActivityWidget';
import SystemInfoWidget from '../components/dashboard/SystemInfoWidget';

export default function DashboardHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query: Estado del servidor
  const { data: serverStatus, isLoading: serverLoading, error: serverError } = useQuery({
    queryKey: ['server-status'],
    queryFn: async () => {
      const response = await api.get('/server/status');
      return response.data.data;
    },
    refetchInterval: 5000,
    retry: 1,
    onError: (error) => {
      console.error('Error fetching server status:', error);
    }
  });

  // Query: Mundo activo
  const { data: activeWorld, isLoading: worldLoading, error: worldError } = useQuery({
    queryKey: ['active-world'],
    queryFn: async () => {
      const response = await api.get('/worlds/active');
      return response.data.data;
    },
    refetchInterval: 30000,
    retry: 1,
    onError: (error) => {
      console.error('Error fetching active world:', error);
    }
  });

  // Query: Backups recientes
  const { data: backups, isLoading: backupsLoading, error: backupsError } = useQuery({
    queryKey: ['backups-recent'],
    queryFn: async () => {
      const response = await api.get('/backups?limit=5');
      return response.data.data;
    },
    refetchInterval: 60000,
    retry: 1,
    onError: (error) => {
      console.error('Error fetching backups:', error);
    }
  });

  // Query: Actividad reciente
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      try {
        const response = await api.get('/system/logs?limit=5');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching activity:', error);
        return [];
      }
    },
    refetchInterval: 30000,
    retry: 1
  });

  // Query: Info del sistema
  const { data: systemInfo, isLoading: systemLoading, error: systemError } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => {
      try {
        const response = await api.get('/system/info');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching system info:', error);
        return {
          cpu: { usage: 0, cores: 0 },
          memory: { total: 0, used: 0, usagePercent: 0 },
          disk: { total: 0, used: 0, usagePercent: 0 },
          os: { platform: 'Unknown' },
          javaVersion: 'Unknown',
          uptime: 0
        };
      }
    },
    refetchInterval: 30000,
    retry: 1
  });

  // Mutation: Start servidor
  const startMutation = useMutation({
    mutationFn: () => api.post('/server/start'),
    onSuccess: () => {
      queryClient.invalidateQueries(['server-status']);
    }
  });

  // Mutation: Stop servidor
  const stopMutation = useMutation({
    mutationFn: () => api.post('/server/stop'),
    onSuccess: () => {
      queryClient.invalidateQueries(['server-status']);
    }
  });

  // Mutation: Crear backup
  const createBackupMutation = useMutation({
    mutationFn: (type) => api.post('/backups', { type }),
    onSuccess: () => {
      queryClient.invalidateQueries(['backups-recent']);
    }
  });

  const handleStartServer = async () => {
    try {
      await startMutation.mutateAsync();
    } catch (error) {
      console.error('Error al iniciar servidor:', error);
    }
  };

  const handleStopServer = async () => {
    try {
      await stopMutation.mutateAsync();
    } catch (error) {
      console.error('Error al detener servidor:', error);
    }
  };

  const handleChangeWorld = () => {
    navigate('/mundos');
  };

  const handleCreateBackup = async () => {
    try {
      await createBackupMutation.mutateAsync('full');
    } catch (error) {
      console.error('Error al crear backup:', error);
    }
  };

  const handleViewAllBackups = () => {
    navigate('/backups');
  };

  const handleViewHistory = () => {
    navigate('/sistema');
  };

  // Loading state - solo durante la carga inicial
  const isInitialLoading = (serverLoading || worldLoading || backupsLoading || activityLoading || systemLoading) &&
                           !serverStatus && !activeWorld && !backups && !recentActivity && !systemInfo;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-text-secondary">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-2">
          Resumen del servidor de Minecraft
        </p>
      </div>

      {/* Grid de widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Fila 1: Estado del servidor + Mundo activo */}
        <ServerStatusWidget
          serverStatus={serverStatus}
          onStart={handleStartServer}
          onStop={handleStopServer}
        />

        <ActiveWorldWidget
          activeWorld={activeWorld}
          onChangeWorld={handleChangeWorld}
        />

        {/* Fila 2: Sistema */}
        <SystemInfoWidget systemInfo={systemInfo} />

        {/* Fila 3: Backups + Actividad reciente */}
        <BackupsWidget
          backups={backups}
          onCreateBackup={handleCreateBackup}
          onViewAll={handleViewAllBackups}
        />

        <div className="lg:col-span-2 xl:col-span-2">
          <RecentActivityWidget
            activities={recentActivity}
            onViewHistory={handleViewHistory}
          />
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-8 p-6 bg-primary-50 border border-primary-200 rounded-lg">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/servidor')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-2">🎮</div>
            <div className="text-sm font-medium text-text-primary">Control del Servidor</div>
          </button>

          <button
            onClick={() => navigate('/mundos')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-2">🌍</div>
            <div className="text-sm font-medium text-text-primary">Gestionar Mundos</div>
          </button>

          <button
            onClick={() => navigate('/plugins')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-2">🔌</div>
            <div className="text-sm font-medium text-text-primary">Plugins</div>
          </button>

          <button
            onClick={() => navigate('/backups')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-2">💾</div>
            <div className="text-sm font-medium text-text-primary">Backups</div>
          </button>
        </div>
      </div>
    </div>
  );
}
