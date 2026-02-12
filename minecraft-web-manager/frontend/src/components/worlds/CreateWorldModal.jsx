import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../common/Modal';

const WORLD_TYPES = [
  { value: 'survival', label: 'Survival', icon: '🌍', desc: 'Modo supervivencia clásico' },
  { value: 'creative', label: 'Creative', icon: '🎨', desc: 'Modo creativo sin límites' },
  { value: 'rpg', label: 'RPG', icon: '⚔️', desc: 'Aventura y rol' },
  { value: 'minigames', label: 'Minigames', icon: '🎮', desc: 'Minijuegos y desafíos' },
  { value: 'adventure', label: 'Adventure', icon: '🗺️', desc: 'Exploración y aventura' },
  { value: 'custom', label: 'Custom', icon: '🔧', desc: 'Personalizado' }
];

const DIFFICULTIES = ['peaceful', 'easy', 'normal', 'hard'];
const GAMEMODES = ['survival', 'creative', 'adventure', 'spectator'];

export default function CreateWorldModal({ isOpen, onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'survival',
    icon: '🌍',
    settings: {
      // Gameplay
      gamemode: 'survival',
      difficulty: 'normal',
      pvp: true,
      // Server
      motd: 'Un servidor de Minecraft',
      maxPlayers: 20,
      viewDistance: 10,
      spawnProtection: 16,
      seed: '',
      // Features
      allowFlight: false,
      allowNether: true,
      onlineMode: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTypeSelect = (type) => {
    const selectedType = WORLD_TYPES.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      icon: selectedType?.icon || '🌍'
    });
  };

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (step === 1 && !/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      setError('El nombre solo puede contener letras, números, guiones y guiones bajos');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await onCreate(formData);
      onClose();
      // Reset form
      setFormData({
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
          seed: '',
          allowFlight: false,
          allowNether: true,
          onlineMode: true
        }
      });
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear mundo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Crear Nuevo Mundo"
      description={`Paso ${step} de 3`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Progress bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-primary-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Información básica */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nombre del Mundo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="mundo-survival"
                required
              />
              <p className="text-xs text-text-secondary mt-1">
                Solo letras, números, guiones (-) y guiones bajos (_)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe tu mundo..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 2: Tipo de mundo */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Selecciona el tipo de mundo
              </label>
              <div className="grid grid-cols-2 gap-3">
                {WORLD_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                      formData.type === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-3xl">{type.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">{type.label}</div>
                      <div className="text-xs text-text-secondary mt-1">{type.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Configuración */}
        {step === 3 && (
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {/* Sección: Gameplay */}
            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary border-b pb-2">Gameplay</h3>

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
              </div>
            </div>

            {/* Sección: Server */}
            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary border-b pb-2">Servidor</h3>

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

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Semilla (Seed) - Opcional
                </label>
                <input
                  type="text"
                  value={formData.settings.seed}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, seed: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ej: 123456789 o minecraftworld"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Deja vacío para generar un mundo aleatorio. Puede ser numérico o texto.
                </p>
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

            {/* Sección: Dimensiones */}
            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary border-b pb-2">Dimensiones</h3>

              <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <div className="text-sm font-medium text-text-primary">Habilitar Nether</div>
                    <div className="text-xs text-text-secondary">Dimensión del inframundo</div>
                  </div>
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
                  <div>
                    <div className="text-sm font-medium text-text-primary">Modo Online</div>
                    <div className="text-xs text-text-secondary">Verificación de cuentas</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <h4 className="font-semibold text-text-primary mb-2">Vista previa</h4>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{formData.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-text-primary">{formData.name || 'Sin nombre'}</div>
                  <div className="text-sm text-text-secondary">{formData.description || 'Sin descripción'}</div>
                  <div className="text-xs text-text-secondary mt-1 italic">{formData.settings.motd}</div>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-0.5 bg-primary-200 text-primary-800 rounded">{formData.type}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded">{formData.settings.gamemode}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded">{formData.settings.difficulty}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded">{formData.settings.maxPlayers} jugadores</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Mundo'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
