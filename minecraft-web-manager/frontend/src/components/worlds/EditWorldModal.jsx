import { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const WORLD_TYPES = [
  { value: 'survival', label: 'Survival', icon: '🌍' },
  { value: 'creative', label: 'Creative', icon: '🎨' },
  { value: 'rpg', label: 'RPG', icon: '⚔️' },
  { value: 'minigames', label: 'Minigames', icon: '🎮' },
  { value: 'adventure', label: 'Adventure', icon: '🗺️' },
  { value: 'custom', label: 'Custom', icon: '🔧' }
];

const DIFFICULTIES = ['peaceful', 'easy', 'normal', 'hard'];
const GAMEMODES = ['survival', 'creative', 'adventure', 'spectator'];

export default function EditWorldModal({ world, isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'survival',
    icon: '🌍',
    settings: {
      gamemode: 'survival',
      difficulty: 'normal',
      pvp: true,
      motd: 'Un servidor de Minecraft',
      maxPlayers: 20,
      viewDistance: 10,
      spawnProtection: 16,
      allowFlight: false,
      allowNether: true,
      onlineMode: true
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (world) {
      setFormData({
        name: world.name || '',
        description: world.description || '',
        type: world.type || 'survival',
        icon: world.icon || '🌍',
        settings: {
          gamemode: world.settings?.gamemode || 'survival',
          difficulty: world.settings?.difficulty || 'normal',
          pvp: world.settings?.pvp !== undefined ? world.settings.pvp : true,
          motd: world.settings?.motd || 'Un servidor de Minecraft',
          maxPlayers: world.settings?.maxPlayers || 20,
          viewDistance: world.settings?.viewDistance || 10,
          spawnProtection: world.settings?.spawnProtection || 16,
          allowFlight: world.settings?.allowFlight || false,
          allowNether: world.settings?.allowNether !== undefined ? world.settings.allowNether : true,
          onlineMode: world.settings?.onlineMode !== undefined ? world.settings.onlineMode : true
        }
      });
    }
  }, [world]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(world.id, formData);
      onClose();
    } catch (error) {
      console.error('Error al actualizar mundo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    const selectedType = WORLD_TYPES.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      icon: selectedType?.icon || '🌍'
    });
  };

  const tabs = [
    { id: 'info', label: 'Información' },
    { id: 'gameplay', label: 'Gameplay' },
    { id: 'server', label: 'Servidor' }
  ];

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Editar Mundo"
      description="Actualiza la configuración del mundo"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Información */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nombre del Mundo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Mi Mundo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Descripción del mundo..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tipo de Mundo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {WORLD_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                      formData.type === type.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Gameplay */}
        {activeTab === 'gameplay' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Modo de Juego
                </label>
                <select
                  value={formData.settings.gamemode}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, gamemode: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {GAMEMODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Dificultad
                </label>
                <select
                  value={formData.settings.difficulty}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, difficulty: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {DIFFICULTIES.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.settings.pvp}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, pvp: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <div className="text-sm font-medium text-text-primary">PvP</div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.settings.allowFlight}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowFlight: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <div className="text-sm font-medium text-text-primary">Permitir Volar</div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.settings.allowNether}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowNether: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <div className="text-sm font-medium text-text-primary">Nether</div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.settings.onlineMode}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, onlineMode: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <div className="text-sm font-medium text-text-primary">Modo Online</div>
              </label>
            </div>
          </div>
        )}

        {/* Tab: Servidor */}
        {activeTab === 'server' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                MOTD (Mensaje del Día)
              </label>
              <input
                type="text"
                value={formData.settings.motd}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, motd: e.target.value }
                })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Un servidor de Minecraft"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Jugadores Máximos
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.settings.maxPlayers}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, maxPlayers: parseInt(e.target.value) || 20 }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Distancia de Visión
                </label>
                <input
                  type="number"
                  min="3"
                  max="32"
                  value={formData.settings.viewDistance}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, viewDistance: parseInt(e.target.value) || 10 }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Protección Spawn
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.settings.spawnProtection}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, spawnProtection: parseInt(e.target.value) || 16 }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
