import { useAuth } from '../hooks/useAuth.jsx';
import { Server, Globe, Plug, Database } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/common';

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          ¡Bienvenido, {user?.username}!
        </h1>
        <p className="text-text-secondary mt-2">
          Panel de administración de servidor Minecraft Paper - Diseño Azure Clean
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover className="animate-slide-in" style={{ animationDelay: '0ms' }}>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary-100">
                <Server className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Servidor</p>
                <p className="text-lg font-semibold text-text-primary">Panel Listo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="animate-slide-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Mundos</p>
                <p className="text-lg font-semibold text-text-primary">Gestión Lista</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="animate-slide-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Plug className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Plugins</p>
                <p className="text-lg font-semibold text-text-primary">Disponible</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="animate-slide-in" style={{ animationDelay: '300ms' }}>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Backups</p>
                <p className="text-lg font-semibold text-text-primary">Configurado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-text-secondary">
                ✨ <strong className="text-text-primary">Diseño Azure Clean:</strong> Implementado correctamente
              </p>
              <p className="text-text-secondary">
                ✅ Panel web funcionando con colores blanco y celeste
              </p>
              <p className="text-text-secondary">
                🎨 Sidebar con categorías expandibles y colores modernos
              </p>
              <p className="text-text-secondary">
                📍 Header con diseño limpio
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-primary-300 text-primary-600 hover:bg-primary-50 transition-colors"
                onClick={() => window.location.href = '/servidor'}
              >
                <Server className="w-5 h-5" />
                <span className="font-medium">Servidor</span>
              </button>
              <button
                className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={() => window.location.href = '/mundos'}
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">Mundos</span>
              </button>
              <button
                className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-green-300 text-green-600 hover:bg-green-50 transition-colors"
                onClick={() => window.location.href = '/plugins'}
              >
                <Plug className="w-5 h-5" />
                <span className="font-medium">Plugins</span>
              </button>
              <button
                className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 transition-colors"
                onClick={() => window.location.href = '/backups'}
              >
                <Database className="w-5 h-5" />
                <span className="font-medium">Backups</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
