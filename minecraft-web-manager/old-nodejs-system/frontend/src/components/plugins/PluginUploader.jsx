import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../common';

export default function PluginUploader({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jarFile = files.find(f => f.name.endsWith('.jar'));

    if (jarFile) {
      validateAndSetFile(jarFile);
    } else {
      setError('Por favor selecciona un archivo .jar');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);
    setSuccess(false);

    // Validar extensión
    if (!file.name.endsWith('.jar')) {
      setError('Solo se permiten archivos .jar');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validar tamaño (máximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 100MB');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile);
      setSuccess(true);
      setSelectedFile(null);

      // Reset después de 2 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al subir el plugin');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Subir Nuevo Plugin
        </h3>

        {/* Zona de drag & drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            }
            ${selectedFile ? 'border-green-500 bg-green-50' : ''}
          `}
        >
          {!selectedFile ? (
            <>
              <Upload className={`w-12 h-12 mx-auto mb-4 ${
                isDragging ? 'text-primary-600' : 'text-slate-400'
              }`} />
              <p className="text-text-primary font-medium mb-2">
                Arrastra un archivo .jar aquí
              </p>
              <p className="text-sm text-text-secondary mb-4">
                o haz click para seleccionar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jar"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Seleccionar Archivo
              </button>
              <p className="text-xs text-text-secondary mt-4">
                Máximo 100MB - Solo archivos .jar
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <File className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-text-primary">{selectedFile.name}</p>
                  <p className="text-sm text-text-secondary">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={handleRemoveFile}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                )}
              </div>

              {!uploading && !success && (
                <button
                  onClick={handleUpload}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Subir Plugin
                </button>
              )}

              {uploading && (
                <div className="flex items-center justify-center gap-2 text-primary-600">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Subiendo...</span>
                </div>
              )}

              {success && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">¡Plugin subido correctamente!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Advertencia */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Debes reiniciar el servidor para que el plugin se cargue.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
