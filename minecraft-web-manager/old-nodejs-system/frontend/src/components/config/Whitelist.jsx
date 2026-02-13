import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Search } from 'lucide-react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../common';

export default function Whitelist() {
  const queryClient = useQueryClient();
  const [newPlayer, setNewPlayer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Query: Obtener whitelist
  const { data: whitelist, isLoading } = useQuery({
    queryKey: ['whitelist'],
    queryFn: async () => {
      const response = await api.get('/config/whitelist');
      return response.data.data;
    }
  });

  // Mutation: Añadir jugador
  const addMutation = useMutation({
    mutationFn: (username) => api.post('/config/whitelist', { username }),
    onSuccess: () => {
      queryClient.invalidateQueries(['whitelist']);
      setNewPlayer('');
    }
  });

  // Mutation: Eliminar jugador
  const removeMutation = useMutation({
    mutationFn: (username) => api.delete(`/config/whitelist/${username}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['whitelist']);
    }
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPlayer.trim()) return;

    // Validar username (solo letras, números y guiones bajos, 3-16 caracteres)
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(newPlayer)) {
      alert('Nombre de usuario inválido. Debe tener 3-16 caracteres (letras, números y guiones bajos)');
      return;
    }

    try {
      await addMutation.mutateAsync(newPlayer);
    } catch (error) {
      console.error('Error al añadir jugador:', error);
    }
  };

  const handleRemove = async (username) => {
    if (!confirm(`¿Eliminar a ${username} de la whitelist?`)) return;

    try {
      await removeMutation.mutateAsync(username);
    } catch (error) {
      console.error('Error al eliminar jugador:', error);
    }
  };

  const filteredPlayers = whitelist?.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Cargando whitelist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Whitelist</h2>
        <p className="text-text-secondary mt-1">
          Gestiona los jugadores permitidos en el servidor
        </p>
      </div>

      {/* Formulario para añadir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Añadir Jugador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="text"
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              placeholder="Nombre de usuario de Minecraft"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={addMutation.isPending || !newPlayer.trim()}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {addMutation.isPending ? 'Añadiendo...' : 'Añadir'}
            </button>
          </form>
          <p className="text-xs text-text-secondary mt-2">
            El nombre debe tener 3-16 caracteres (letras, números y guiones bajos)
          </p>
        </CardContent>
      </Card>

      {/* Lista de jugadores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Jugadores en Whitelist ({whitelist?.length || 0})
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
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">
                {searchTerm ? 'No se encontraron jugadores' : 'No hay jugadores en la whitelist'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlayers.map((player) => (
                <div
                  key={player.uuid || player.name}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-700">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{player.name}</p>
                      {player.uuid && (
                        <p className="text-xs text-text-secondary">{player.uuid}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(player.name)}
                    disabled={removeMutation.isPending}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar de la whitelist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Recuerda habilitar la whitelist en Server Properties (white-list=true) para que tenga efecto.
        </p>
      </div>
    </div>
  );
}
