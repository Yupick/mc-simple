import { useState } from 'react';
import { HardDrive, FileArchive, Package, Settings, Plus } from 'lucide-react';
import Modal from '../common/Modal';

const BACKUP_TYPES = [
  {
    value: 'full',
    label: 'Backup Completo',
    icon: HardDrive,
    color: 'blue',
    description: 'Incluye mundos, plugins y configuración'
  },
  {
    value: 'world',
    label: 'Solo Mundos',
    icon: FileArchive,
    color: 'green',
    description: 'Respalda todos los mundos del servidor'
  },
  {
    value: 'plugins',
    label: 'Solo Plugins',
    icon: Package,
    color: 'purple',
    description: 'Respalda plugins y sus configuraciones'
  },
  {
    value: 'config',
    label: 'Solo Configuración',
    icon: Settings,
    color: 'orange',
    description: 'Respalda archivos de configuración'
  }
];

export default function BackupCreator({ isOpen, onClose, onCreate }) {
  const [selectedType, setSelectedType] = useState('full');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await onCreate({
        type: selectedType,
        customName: customName.trim() || undefined
      });
      setCustomName('');
      setSelectedType('full');
      onClose();
    } catch (error) {
      console.error('Error al crear backup:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Crear Nuevo Backup"
      description="Selecciona el tipo de backup que deseas crear"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Selector de tipo */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Tipo de Backup
          </label>
          <div className="grid grid-cols-2 gap-3">
            {BACKUP_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                    selectedType === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-${type.color}-100`}>
                    <Icon className={`w-5 h-5 text-${type.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">{type.label}</div>
                    <div className="text-xs text-text-secondary mt-1">{type.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nombre personalizado */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Nombre Personalizado (Opcional)
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ej: antes-de-actualizar"
          />
          <p className="text-xs text-text-secondary mt-1">
            Si no especificas un nombre, se generará automáticamente con la fecha
          </p>
        </div>

        {/* Información */}
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h4 className="font-semibold text-text-primary mb-2">Información</h4>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• El servidor puede seguir corriendo durante el backup</li>
            <li>• El proceso puede tardar varios minutos dependiendo del tamaño</li>
            <li>• Los backups se guardan en formato .tar.gz comprimido</li>
          </ul>
        </div>

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
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              'Creando...'
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Crear Backup
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
