import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldPlus, Trash2, Search } from 'lucide-react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../common';

export default function Operators() {
  const queryClient = useQueryClient();
  const [newOp, setNewOp] = useState({ username: '', level: 4 });
  const [searchTerm, setSearchTerm] = useState('');

  // Query: Obtener operadores
  const { data: operators, isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const response = await api.get('/config/ops');
      return response.data.data;
    }
  });

  // Mutation: Añadir operador
  const addMutation = useMutation({
    mutationFn: (data) => api.post('/config/ops', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['operators']);
      setNewOp({ username: '', level: 4 });
    }
  });

  // Mutation: Eliminar operador
  const removeMutation = useMutation({
    mutationFn: (username) => api.delete(`/config/ops/${username}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['operators']);
    }
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newOp.username.trim()) return;

    // Validar username
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(newOp.username)) {
      alert('Nombre de usuario inválido. Debe tener 3-16 caracteres (letras, números y guiones bajos)');
      return;
    }

    try {
      await addMutation.mutateAsync(newOp);
    } catch (error) {
      console.error('Error al añadir operador:', error);
    }
  };

  const handleRemove = async (username) => {
    if (!confirm(`¿Eliminar a ${username} de los operadores?`)) return;

    try {
      await removeMutation.mutateAsync(username);
    } catch (error) {
      console.error('Error al eliminar operador:', error);
    }
  };

  const filteredOperators = operators?.filter(op =>
    op.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getLevelInfo = (level) => {
    const levels = {
      1: { label: 'Moderador', desc: 'Puede ignorar protección de spawn', color: 'green' },
      2: { label: 'Game Master', desc: 'Puede usar comandos: /clear, /difficulty, /effect, /gamemode, /gamerule, /give, /tp', color: 'blue' },
      3: { label: 'Admin', desc: 'Puede usar comandos: /ban, /kick, /op, /deop', color: 'purple' },
      4: { label: 'Owner', desc: 'Puede usar todos los comandos incluidos /stop', color: 'red' }
    };
    return levels[level] || levels[4];
  };

  const getLevelBadgeClass = (level) => {
    const info = getLevelInfo(level);
    return `px-2 py-1 text-xs font-semibold rounded bg-${info.color}-100 text-${info.color}-700`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Cargando operadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Operadores</h2>
        <p className="text-text-secondary mt-1">
          Gestiona los operadores del servidor y sus niveles de permisos
        </p>
      </div>

      {/* Información de niveles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Niveles de Operador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((level) => {
              const info = getLevelInfo(level);
              return (
                <div key={level} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={getLevelBadgeClass(level)}>Nivel {level}</span>
                    <span className="font-semibold text-text-primary">{info.label}</span>
                  </div>
                  <p className="text-xs text-text-secondary">{info.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Formulario para añadir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldPlus className="w-5 h-5" />
            Añadir Operador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={newOp.username}
                  onChange={(e) => setNewOp({ ...newOp, username: e.target.value })}
                  placeholder="Nombre de usuario de Minecraft"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nivel de Permisos
                </label>
                <select
                  value={newOp.level}
                  onChange={(e) => setNewOp({ ...newOp, level: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>Nivel 1 - Moderador</option>
                  <option value={2}>Nivel 2 - Game Master</option>
                  <option value={3}>Nivel 3 - Admin</option>
                  <option value={4}>Nivel 4 - Owner</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={addMutation.isPending || !newOp.username.trim()}
              className="w-full px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {addMutation.isPending ? 'Añadiendo...' : 'Añadir Operador'}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de operadores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Operadores Activos ({operators?.length || 0})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOperators.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">
                {searchTerm ? 'No se encontraron operadores' : 'No hay operadores configurados'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOperators.map((op) => {
                const levelInfo = getLevelInfo(op.level);
                return (
                  <div
                    key={op.uuid || op.name}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary-700" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{op.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={getLevelBadgeClass(op.level)}>
                            Nivel {op.level}
                          </span>
                          <span className="text-sm text-text-secondary">
                            {levelInfo.label}
                          </span>
                        </div>
                        {op.uuid && (
                          <p className="text-xs text-text-secondary mt-1">{op.uuid}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(op.name)}
                      disabled={removeMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar operador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advertencia */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Advertencia:</strong> Los operadores tienen acceso privilegiado al servidor. Otorga permisos con cuidado.
        </p>
      </div>
    </div>
  );
}
