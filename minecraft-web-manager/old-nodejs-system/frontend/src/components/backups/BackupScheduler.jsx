import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import Modal from '../common/Modal';

const FREQUENCIES = [
  { value: '0 3 * * *', label: 'Diario (3:00 AM)' },
  { value: '0 3 * * 0', label: 'Semanal (Domingo 3:00 AM)' },
  { value: '0 3 1 * *', label: 'Mensual (Día 1 a las 3:00 AM)' },
  { value: 'custom', label: 'Personalizado' }
];

const BACKUP_TYPES = [
  { value: 'full', label: 'Completo' },
  { value: 'world', label: 'Mundos' },
  { value: 'plugins', label: 'Plugins' },
  { value: 'config', label: 'Configuración' }
];

export default function BackupScheduler({ schedules, onCreate, onDelete, onToggle }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'full',
    frequency: '0 3 * * *',
    customCron: '',
    enabled: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cronExpression = formData.frequency === 'custom'
      ? formData.customCron
      : formData.frequency;

    await onCreate({
      name: formData.name,
      type: formData.type,
      cron_expression: cronExpression,
      enabled: formData.enabled
    });

    setFormData({
      name: '',
      type: 'full',
      frequency: '0 3 * * *',
      customCron: '',
      enabled: true
    });
    setShowModal(false);
  };

  const formatNextRun = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Backups Programados</h3>
          <p className="text-sm text-text-secondary mt-1">
            Automatiza tus backups con tareas programadas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Tarea
        </button>
      </div>

      {/* Lista de tareas programadas */}
      {schedules && schedules.length > 0 ? (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onToggle(schedule.id, !schedule.enabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    schedule.enabled
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {schedule.enabled ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
                <div>
                  <h4 className="font-semibold text-text-primary">{schedule.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                      {BACKUP_TYPES.find(t => t.value === schedule.type)?.label}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {schedule.cron_expression}
                    </span>
                    {schedule.next_run && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Próximo: {formatNextRun(schedule.next_run)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDelete(schedule.id)}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-text-secondary">No hay backups programados</p>
          <p className="text-sm text-text-secondary mt-1">
            Crea una tarea para automatizar tus backups
          </p>
        </div>
      )}

      {/* Modal para crear tarea */}
      <Modal
        open={showModal}
        onOpenChange={setShowModal}
        title="Programar Backup Automático"
        description="Configura una tarea de backup recurrente"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Nombre de la Tarea
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Backup Diario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tipo de Backup
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {BACKUP_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Frecuencia
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {FREQUENCIES.map(freq => (
                <option key={freq.value} value={freq.value}>{freq.label}</option>
              ))}
            </select>
          </div>

          {formData.frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Expresión Cron
              </label>
              <input
                type="text"
                value={formData.customCron}
                onChange={(e) => setFormData({ ...formData, customCron: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0 3 * * *"
                required={formData.frequency === 'custom'}
              />
              <p className="text-xs text-text-secondary mt-1">
                Formato: minuto hora día mes día_semana
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Crear Tarea
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
