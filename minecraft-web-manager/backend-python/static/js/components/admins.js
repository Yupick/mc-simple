function adminsComponent() {
    return {
        admins: [],
        loading: true,
        showModal: false,
        modalMode: 'create', // 'create' or 'edit'
        formData: {
            username: '',
            password: '',
            role: 'admin'
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
                    console.error('Error al cargar usuarios');
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
                    username: admin.username,
                    password: '', // No mostrar password existente
                    role: admin.role
                };
            } else {
                this.editingAdmin = null;
                this.formData = {
                    username: '',
                    password: '',
                    role: 'admin'
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
                    response = await fetch(`/api/admins/${this.editingAdmin.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(this.formData)
                    });
                }

                if (response.ok) {
                    this.closeModal();
                    await this.loadAdmins();
                    this.showNotification(
                        this.modalMode === 'create' ? 'Usuario creado exitosamente' : 'Usuario actualizado exitosamente',
                        'success'
                    );
                } else {
                    const error = await response.json();
                    this.showNotification(error.detail || 'Error al guardar usuario', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error de conexión', 'error');
            }
        },

        async deleteAdmin(id, username) {
            if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"?\n\nEsta acción no se puede deshacer.`)) {
                return;
            }

            try {
                const response = await fetch(`/api/admins/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await this.loadAdmins();
                    this.showNotification('Usuario eliminado exitosamente', 'success');
                } else {
                    const error = await response.json();
                    this.showNotification(error.detail || 'Error al eliminar usuario', 'error');
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

        getRoleLabel(role) {
            const labels = {
                'admin': 'Administrador',
                'moderator': 'Moderador',
                'viewer': 'Visor'
            };
            return labels[role] || role;
        },

        getRoleDescription(role) {
            const descriptions = {
                'admin': 'Control total del sistema',
                'moderator': 'Gestión limitada del servidor',
                'viewer': 'Solo lectura'
            };
            return descriptions[role] || 'Sin descripción';
        },

        formatDate(dateString) {
            if (!dateString) return 'Nunca';
            
            const date = new Date(dateString);
            const now = new Date();
            const diff = now - date;
            
            // Menos de 1 minuto
            if (diff < 60000) {
                return 'Hace un momento';
            }
            
            // Menos de 1 hora
            if (diff < 3600000) {
                const mins = Math.floor(diff / 60000);
                return `Hace ${mins} min${mins > 1 ? 's' : ''}`;
            }
            
            // Menos de 1 día
            if (diff < 86400000) {
                const hours = Math.floor(diff / 3600000);
                return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
            }
            
            // Menos de 7 días
            if (diff < 604800000) {
                const days = Math.floor(diff / 86400000);
                return `Hace ${days} día${days > 1 ? 's' : ''}`;
            }
            
            // Formato fecha completa
            return date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
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
