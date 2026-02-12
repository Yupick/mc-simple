import { useState, useEffect } from 'react';
import { Save, AlertCircle, FileText } from 'lucide-react';
import Modal from '../common/Modal';

export default function PluginConfigModal({ plugin, isOpen, onClose, onSave, configFiles, onLoadConfig }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && configFiles && configFiles.length > 0 && !selectedFile) {
      // Seleccionar el primer archivo por defecto (usualmente config.yml)
      const defaultFile = configFiles.find(f => f === 'config.yml') || configFiles[0];
      setSelectedFile(defaultFile);
    }
  }, [isOpen, configFiles, selectedFile]);

  useEffect(() => {
    if (selectedFile && isOpen) {
      loadConfigContent();
    }
  }, [selectedFile, isOpen]);

  const loadConfigContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const fileContent = await onLoadConfig(plugin.name, selectedFile);
      setContent(typeof fileContent === 'string' ? fileContent : JSON.stringify(fileContent, null, 2));
    } catch (err) {
      setError('Error al cargar configuración: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(plugin.name, selectedFile, content);
      onClose();
    } catch (err) {
      setError('Error al guardar: ' + (err.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setContent('');
    setError(null);
    onClose();
  };

  if (!plugin) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={handleClose}
      title={`Configurar ${plugin.name}`}
      description="Edita los archivos de configuración del plugin"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Selector de archivo */}
        {configFiles && configFiles.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Archivo de Configuración
            </label>
            <div className="flex gap-2 flex-wrap">
              {configFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedFile === file
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {file}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Este plugin no tiene archivos de configuración
          </div>
        )}

        {/* Editor de texto */}
        {selectedFile && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Contenido de {selectedFile}
            </label>
            {loading ? (
              <div className="flex items-center justify-center p-12 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-text-secondary">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <span>Cargando configuración...</span>
                </div>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="# Configuración del plugin..."
                spellCheck={false}
              />
            )}
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Advertencia */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Importante:</strong> Debes reiniciar el servidor para aplicar los cambios en la configuración.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          {selectedFile && (
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
