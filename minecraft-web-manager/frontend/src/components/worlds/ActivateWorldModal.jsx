import { useState } from 'react';
import { AlertTriangle, Globe } from 'lucide-react';
import Modal from '../common/Modal';
import { Button } from '../common';

export default function ActivateWorldModal({ world, isOpen, onClose, onConfirm, serverStatus }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(world.id);
      onClose();
    } catch (error) {
      console.error('Error al activar mundo:', error);
    } finally {
      setLoading(false);
    }
  };

  const isServerRunning = serverStatus?.running;

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Activar Mundo"
      description="¿Estás seguro de que deseas cambiar el mundo activo?"
    >
      <div className="space-y-4">
        {/* Advertencia si servidor está corriendo */}
        {isServerRunning && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">El servidor está corriendo</p>
              <p className="text-yellow-700 mt-1">
                Debes detener el servidor antes de cambiar de mundo.
              </p>
            </div>
          </div>
        )}

        {/* Info del mundo */}
        <div className="flex items-center gap-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="text-4xl">{world?.icon || '🌍'}</div>
          <div>
            <h3 className="font-semibold text-text-primary">{world?.name}</h3>
            <p className="text-sm text-text-secondary">{world?.description || 'Sin descripción'}</p>
            <div className="flex gap-3 mt-2 text-xs text-text-secondary">
              <span>Tipo: {world?.type}</span>
              <span>Tamaño: {world?.size_mb} MB</span>
            </div>
          </div>
        </div>

        {/* Explicación */}
        {!isServerRunning && (
          <div className="text-sm text-text-secondary">
            <p>
              Al activar este mundo, el enlace simbólico <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">worlds/active</code> apuntará a este mundo.
              La próxima vez que inicies el servidor, se cargará este mundo.
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || isServerRunning}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Activando...' : 'Activar Mundo'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
