/**
 * Resource Packs Manager - Alpine.js Component
 */

function resourcePacksManager() {
    return {
        // Estado
        loading: false,
        activeTab: 'config',
        status: {
            installed: false,
            version: null,
            supportsMultiworld: false
        },
        config: {
            autoHost: false,
            forceResourcePack: false,
            resourcePackPrompt: ''
        },
        priority: [],
        packs: [],
        compatiblePlugins: [],
        collisionLog: '',
        output: {
            exists: false,
            size: 0,
            modified: 0,
            sha1: ''
        },
        uploadModal: {
            open: false,
            file: null,
            uploading: false,
            progress: 0
        },

        // Inicialización
        async init() {
            await this.loadStatus();
            if (this.status.installed) {
                await Promise.all([
                    this.loadConfig(),
                    this.loadPacks(),
                    this.loadCompatiblePlugins(),
                    this.loadOutput()
                ]);
            }
            // Re-inicializar iconos de Lucide
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        },

        // Cargar estado del plugin
        async loadStatus() {
            try {
                this.loading = true;
                const response = await fetch('/api/resourcepacks/status', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (!response.ok) throw new Error('Error al cargar estado');
                
                const data = await response.json();
                this.status = {
                    installed: data.installed,
                    version: data.version || null,
                    supportsMultiworld: false // Plugin no soporta multimundo
                };
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al cargar estado del plugin', 'error');
            } finally {
                this.loading = false;
            }
        },

        // Cargar configuración
        async loadConfig() {
            try {
                const response = await fetch('/api/resourcepacks/config', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (!response.ok) throw new Error('Error al cargar configuración');
                
                const data = await response.json();
                this.config = {
                    autoHost: data.config.autoHost || false,
                    forceResourcePack: data.config.forceResourcePack || false,
                    resourcePackPrompt: data.config.resourcePackPrompt || ''
                };
                this.priority = data.config.priorityOrder || [];
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al cargar configuración', 'error');
            }
        },

        // Guardar configuración
        async saveConfig() {
            try {
                const response = await fetch('/api/resourcepacks/config', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(this.config)
                });
                
                if (!response.ok) throw new Error('Error al guardar');
                
                this.showNotification('Configuración guardada', 'success');
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al guardar configuración', 'error');
            }
        },

        // Mover prioridad
        async movePriority(index, direction) {
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= this.priority.length) return;
            
            // Intercambiar
            const temp = this.priority[index];
            this.priority[index] = this.priority[newIndex];
            this.priority[newIndex] = temp;
            
            // Guardar
            try {
                const response = await fetch('/api/resourcepacks/priority', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ priorityOrder: this.priority })
                });
                
                if (!response.ok) throw new Error('Error al actualizar prioridad');
                
                this.showNotification('Prioridad actualizada', 'success');
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al actualizar prioridad', 'error');
                // Revertir cambio
                await this.loadConfig();
            }
        },

        // Cargar packs
        async loadPacks() {
            try {
                const response = await fetch('/api/resourcepacks/packs', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (!response.ok) throw new Error('Error al cargar packs');
                
                const data = await response.json();
                this.packs = data.packs || [];
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al cargar packs', 'error');
            }
        },

        // Abrir modal de subida
        openUploadModal() {
            this.uploadModal = {
                open: true,
                file: null,
                uploading: false,
                progress: 0
            };
            setTimeout(() => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 100);
        },

        // Cerrar modal
        closeUploadModal() {
            if (!this.uploadModal.uploading) {
                this.uploadModal.open = false;
            }
        },

        // Seleccionar archivo
        handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Validar extensión
            if (!file.name.endsWith('.zip')) {
                this.showNotification('Solo se permiten archivos .zip', 'error');
                return;
            }
            
            // Validar tamaño (100MB)
            if (file.size > 100 * 1024 * 1024) {
                this.showNotification('Archivo demasiado grande (máx 100MB)', 'error');
                return;
            }
            
            this.uploadModal.file = file;
        },

        // Subir pack
        async uploadPack() {
            if (!this.uploadModal.file) return;
            
            this.uploadModal.uploading = true;
            this.uploadModal.progress = 0;
            
            try {
                const formData = new FormData();
                formData.append('file', this.uploadModal.file);
                
                const response = await fetch('/api/resourcepacks/packs', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });
                
                this.uploadModal.progress = 100;
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || 'Error al subir pack');
                }
                
                this.showNotification('Pack subido exitosamente', 'success');
                await this.loadPacks();
                await this.loadConfig(); // Recargar prioridades
                this.closeUploadModal();
            } catch (error) {
                console.error('Error:', error);
                this.showNotification(error.message, 'error');
            } finally {
                this.uploadModal.uploading = false;
            }
        },

        // Eliminar pack
        async deletePack(filename) {
            if (!confirm(`¿Eliminar pack "${filename}"?`)) return;
            
            try {
                const response = await fetch(`/api/resourcepacks/packs/${encodeURIComponent(filename)}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (!response.ok) throw new Error('Error al eliminar pack');
                
                this.showNotification('Pack eliminado', 'success');
                await this.loadPacks();
                await this.loadConfig(); // Recargar prioridades
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al eliminar pack', 'error');
            }
        },

        // Cargar plugins compatibles
        async loadCompatiblePlugins() {
            try {
                const response = await fetch('/api/resourcepacks/plugins', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (!response.ok) throw new Error('Error al cargar plugins');
                
                const data = await response.json();
                this.compatiblePlugins = data.plugins || [];
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al cargar plugins compatibles', 'error');
            }
        },

        // Toggle plugin compatible
        async toggleCompatiblePlugin(pluginName, enabled) {
            try {
                const response = await fetch(`/api/resourcepacks/plugins/${encodeURIComponent(pluginName)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ enabled })
                });
                
                if (!response.ok) throw new Error('Error al cambiar estado del plugin');
                
                this.showNotification(`Plugin ${enabled ? 'habilitado' : 'deshabilitado'}`, 'success');
                await this.loadCompatiblePlugins();
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al cambiar estado del plugin', 'error');
            }
        },

        // Cargar colisiones
        async loadCollisions() {
            try {
                const response = await fetch('/api/resourcepacks/collisions', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (!response.ok) throw new Error('Error al cargar colisiones');
                
                const data = await response.json();
                this.collisionLog = data.log || 'No hay colisiones registradas';
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al cargar colisiones', 'error');
            }
        },

        // Cargar output
        async loadOutput() {
            try {
                const response = await fetch('/api/resourcepacks/output', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (!response.ok) throw new Error('Error al cargar pack final');
                
                const data = await response.json();
                this.output = {
                    exists: data.exists || false,
                    size: data.size || 0,
                    modified: data.modified || 0,
                    sha1: data.sha1 || ''
                };
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al cargar pack final', 'error');
            }
        },

        // Recargar plugin
        async reloadPlugin() {
            if (!confirm('¿Recargar plugin? Esto regenerará el pack final.')) return;
            
            try {
                this.loading = true;
                const response = await fetch('/api/resourcepacks/reload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (!response.ok) throw new Error('Error al recargar plugin');
                
                this.showNotification('Plugin recargado exitosamente', 'success');
                
                // Recargar datos
                await this.loadOutput();
                await this.loadCollisions();
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al recargar plugin. Verifica RCON.', 'error');
            } finally {
                this.loading = false;
            }
        },

        // Notificaciones
        showNotification(message, type = 'info') {
            // Usar sistema de notificaciones existente si está disponible
            if (typeof showToast === 'function') {
                showToast(message, type);
            } else {
                alert(message);
            }
        }
    };
}

// Registrar componente globalmente para Alpine.js
window.resourcePacksManager = resourcePacksManager;

// Log cuando Alpine se inicialice
document.addEventListener('alpine:init', () => {
    console.log('Alpine initialized, resourcePacksManager available');
});
