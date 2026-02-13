// Component para gestión de plugins
function pluginsManager() {
    return {
        plugins: [],
        loading: false,
        uploadModal: {
            open: false,
            uploading: false,
            dragActive: false,
            file: null,
            progress: 0,
            error: '',
            success: ''
        },
        
        async init() {
            await this.fetchPlugins();
        },
        
        async fetchPlugins() {
            try {
                const res = await fetch('/api/plugins/');
                this.plugins = await res.json();
            } catch (e) {
                console.error('Error fetching plugins:', e);
            }
        },
        
        async togglePlugin(pluginName) {
            this.loading = true;
            try {
                const res = await fetch(`/api/plugins/${pluginName}/toggle`, { 
                    method: 'PUT' 
                });
                const data = await res.json();
                
                if (data.success) {
                    alert(data.message);
                    await this.fetchPlugins();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al cambiar estado del plugin');
            } finally {
                this.loading = false;
            }
        },
        
        async deletePlugin(pluginName) {
            if (!confirm('¿Está seguro de eliminar este plugin?')) return;
            
            this.loading = true;
            try {
                const res = await fetch(`/api/plugins/${pluginName}`, { 
                    method: 'DELETE' 
                });
                const data = await res.json();
                
                if (data.success) {
                    alert('Plugin eliminado exitosamente');
                    await this.fetchPlugins();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al eliminar plugin');
            } finally {
                this.loading = false;
            }
        },

        // Upload Modal functions
        openUploadModal() {
            this.uploadModal.open = true;
            this.uploadModal.error = '';
            this.uploadModal.success = '';
            this.clearFile();
        },

        closeUploadModal() {
            this.uploadModal.open = false;
            this.clearFile();
        },

        handleFileDrop(event) {
            this.uploadModal.dragActive = false;
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                this.selectFile(files[0]);
            }
        },

        handleFileSelect(event) {
            const files = event.target.files;
            if (files.length > 0) {
                this.selectFile(files[0]);
            }
        },

        selectFile(file) {
            this.uploadModal.error = '';
            this.uploadModal.success = '';

            // Validar extensión
            if (!file.name.endsWith('.jar')) {
                this.uploadModal.error = 'Solo se permiten archivos .jar';
                return;
            }

            // Validar tamaño (máx 100MB)
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
                this.uploadModal.error = 'El archivo es demasiado grande (máximo 100MB)';
                return;
            }

            this.uploadModal.file = file;
        },

        clearFile() {
            this.uploadModal.file = null;
            this.uploadModal.progress = 0;
            this.uploadModal.error = '';
            this.uploadModal.success = '';
            // Reset file input
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },

        async uploadPlugin() {
            if (!this.uploadModal.file) return;

            this.uploadModal.uploading = true;
            this.uploadModal.error = '';
            this.uploadModal.success = '';
            this.uploadModal.progress = 0;

            try {
                const formData = new FormData();
                formData.append('file', this.uploadModal.file);

                // Simular progreso (ajustar según implementación real)
                const progressInterval = setInterval(() => {
                    if (this.uploadModal.progress < 90) {
                        this.uploadModal.progress += 10;
                    }
                }, 200);

                const res = await fetch('/api/plugins/upload', {
                    method: 'POST',
                    body: formData
                });

                clearInterval(progressInterval);
                this.uploadModal.progress = 100;

                const data = await res.json();

                if (res.ok && data.success) {
                    this.uploadModal.success = 'Plugin subido exitosamente';
                    setTimeout(async () => {
                        await this.fetchPlugins();
                        this.closeUploadModal();
                    }, 1500);
                } else {
                    this.uploadModal.error = data.message || 'Error al subir plugin';
                }
            } catch (e) {
                this.uploadModal.error = 'Error al subir plugin: ' + e.message;
            } finally {
                this.uploadModal.uploading = false;
            }
        },

        formatFileSize(bytes) {
            if (!bytes) return '0 KB';
            const kb = bytes / 1024;
            if (kb < 1024) {
                return `${kb.toFixed(2)} KB`;
            }
            const mb = kb / 1024;
            return `${mb.toFixed(2)} MB`;
        }
    }
}
