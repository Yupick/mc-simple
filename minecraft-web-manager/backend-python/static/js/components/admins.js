function adminsComponent() {
    return {
        admins: [],
        loading: true,
        showModal: false,
        modalMode: 'create', // 'create' or 'edit'
        formData: {
            name: '',
            uuid: '',
            level: 4,
            bypassesPlayerLimit: false
        },
        editingAdmin: null,

        init() {
            this.loadAdmins();
        },

        async loadAdmins() {
            this.loading = true;
            try {
                const response = await fetch('/api/admins');
                if (response.ok) {
                    const data = await response.json();
                    this.admins = data.admins || [];
                } else {
                    console.error('Error al cargar administradores');
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                this.loading = false;
                // Re-inicializar iconos de Lucide después de actualizar el DOM
                this.$nextTick(() => lucide.createIcons());
            }
        },

        openModal(mode, admin = null) {
            this.modalMode = mode;
            
            if (mode === 'edit' && admin) {
                this.editingAdmin = admin;
                this.formData = {
                    name: admin.name,
                    uuid: admin.uuid || '',
                    level: admin.level,
                    bypassesPlayerLimit: admin.bypassesPlayerLimit || false
                };
            } else {
                this.editingAdmin = null;
                this.formData = {
                    name: '',
                    uuid: '',
                    level: 4,
                    bypassesPlayerLimit: false
                };
            }
            
            this.showModal = true;
            this.$nextTick(() => lucide.createIcons());
        },

        closeModal() {
            this.showModal = false;
            this.editingAdmin = null;
        },

        async saveAdmin() {
            try {
                let response;
                
                if (this.modalMode === 'create') {
                    response = await fetch('/api/admins', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(this.formData)
                    });
                } else {
                    response = await fetch(`/api/admins/${encodeURIComponent(this.editingAdmin.name)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(this.formData)
                    });
                }

                if (response.ok) {
                    this.closeModal();
                    await this.loadAdmins();
                    this.showNotification(
                        this.modalMode === 'create' ? 'Administrador agregado exitosamente' : 'Administrador actualizado exitosamente',
                        'success'
                    );
                } else {
                    const error = await response.json();
                    this.showNotification(error.detail || 'Error al guardar administrador', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error de conexión', 'error');
            }
        },

        async deleteAdmin(name) {
            if (!confirm(`¿Estás seguro de eliminar al administrador "${name}"?`)) {
                return;
            }

            try {
                const response = await fetch(`/api/admins/${encodeURIComponent(name)}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await this.loadAdmins();
                    this.showNotification('Administrador eliminado exitosamente', 'success');
                } else {
                    const error = await response.json();
                    this.showNotification(error.detail || 'Error al eliminar administrador', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error de conexión', 'error');
            }
        },

        getColorForName(name) {
            const colors = [
                '#667eea, #764ba2',
                '#f093fb, #f5576c',
                '#4facfe, #00f2fe',
                '#43e97b, #38f9d7',
                '#fa709a, #fee140',
                '#30cfd0, #330867',
                '#a8edea, #fed6e3',
                '#ff9a9e, #fecfef'
            ];
            
            const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return colors[hash % colors.length];
        },

        getLevelDescription(level) {
            const descriptions = {
                1: 'Bypass spawn protection',
                2: 'Comandos básicos',
                3: 'Gestión de jugadores',
                4: 'Control total del servidor'
            };
            return descriptions[level] || 'Desconocido';
        },

        showNotification(message, type = 'info') {
            // Simple notification using browser alert
            // En producción, usar una librería de notificaciones como Toastify
            if (type === 'error') {
                alert('❌ ' + message);
            } else if (type === 'success') {
                alert('✅ ' + message);
            } else {
                alert('ℹ️ ' + message);
            }
        }
    }
}
