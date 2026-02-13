// Component para gestión de mundos
function worldsManager() {
    return {
        worlds: [],
        activeWorld: null,
        loading: false,
        createModal: {
            open: false,
            step: 1,
            loading: false,
            error: '',
            form: {
                id: '',
                name: '',
                description: '',
                type: 'survival',
                icon: '🌍',
                tags: [],
                settings: {
                    gamemode: 'survival',
                    difficulty: 'normal',
                    pvp: true,
                    motd: 'Un servidor de Minecraft',
                    'max-players': 20,
                    'view-distance': 10,
                    'spawn-protection': 16,
                    'allow-flight': false,
                    'allow-nether': true,
                    'online-mode': true
                }
            }
        },
        worldTypes: [
            { value: 'survival', label: 'Survival', icon: '🌍', desc: 'Modo supervivencia clásico' },
            { value: 'creative', label: 'Creative', icon: '🎨', desc: 'Modo creativo sin límites' },
            { value: 'rpg', label: 'RPG', icon: '⚔️', desc: 'Aventura y rol' },
            { value: 'minigames', label: 'Minigames', icon: '🎮', desc: 'Minijuegos y desafíos' },
            { value: 'adventure', label: 'Adventure', icon: '🗺️', desc: 'Exploración y aventura' },
            { value: 'custom', label: 'Custom', icon: '🔧', desc: 'Personalizado' }
        ],
        
        async init() {
            await this.fetchWorlds();
            await this.fetchActiveWorld();
        },
        
        async fetchWorlds() {
            try {
                const res = await fetch('/api/worlds/');
                this.worlds = await res.json();
            } catch (e) {
                console.error('Error fetching worlds:', e);
            }
        },
        
        async fetchActiveWorld() {
            try {
                const res = await fetch('/api/worlds/active');
                this.activeWorld = await res.json();
            } catch (e) {
                console.error('Error fetching active world:', e);
            }
        },
        
        async activateWorld(worldId) {
            if (!confirm('¿Cambiar al mundo seleccionado? El servidor debe estar detenido.')) return;
            
            this.loading = true;
            try {
                const res = await fetch(`/api/worlds/${worldId}/activate`, { 
                    method: 'POST' 
                });
                const data = await res.json();
                
                if (data.success) {
                    alert('Mundo activado exitosamente');
                    await this.fetchWorlds();
                    await this.fetchActiveWorld();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al activar mundo');
            } finally {
                this.loading = false;
            }
        },
        
        async deleteWorld(worldId) {
            if (!confirm('¿Está seguro de eliminar este mundo? Esta acción no se puede deshacer.')) return;
            
            this.loading = true;
            try {
                const res = await fetch(`/api/worlds/${worldId}`, { 
                    method: 'DELETE' 
                });
                const data = await res.json();
                
                if (data.success) {
                    alert('Mundo eliminado exitosamente');
                    await this.fetchWorlds();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al eliminar mundo');
            } finally {
                this.loading = false;
            }
        },

        // Modal functions
        openCreateModal() {
            this.createModal.open = true;
            this.createModal.step = 1;
            this.createModal.error = '';
            this.resetForm();
        },

        closeCreateModal() {
            this.createModal.open = false;
            this.resetForm();
        },

        resetForm() {
            this.createModal.form = {
                id: '',
                name: '',
                description: '',
                type: 'survival',
                icon: '🌍',
                tags: [],
                settings: {
                    gamemode: 'survival',
                    difficulty: 'normal',
                    pvp: true,
                    motd: 'Un servidor de Minecraft',
                    'max-players': 20,
                    'view-distance': 10,
                    'spawn-protection': 16,
                    'allow-flight': false,
                    'allow-nether': true,
                    'online-mode': true
                }
            };
        },

        selectWorldType(type) {
            this.createModal.form.type = type.value;
            this.createModal.form.icon = type.icon;
        },

        nextStep() {
            this.createModal.error = '';
            
            if (this.createModal.step === 1) {
                if (!this.createModal.form.id.trim()) {
                    this.createModal.error = 'El nombre es obligatorio';
                    return;
                }
                if (!/^[a-zA-Z0-9_-]+$/.test(this.createModal.form.id)) {
                    this.createModal.error = 'El nombre solo puede contener letras, números, guiones y guiones bajos';
                    return;
                }
            }
            
            this.createModal.step++;
        },

        prevStep() {
            this.createModal.error = '';
            this.createModal.step--;
        },

        async createWorld() {
            this.createModal.loading = true;
            this.createModal.error = '';

            try {
                const res = await fetch('/api/worlds/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.createModal.form)
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    alert('Mundo creado exitosamente');
                    this.closeCreateModal();
                    await this.fetchWorlds();
                } else {
                    this.createModal.error = data.message || 'Error al crear mundo';
                }
            } catch (e) {
                this.createModal.error = 'Error al crear mundo: ' + e.message;
            } finally {
                this.createModal.loading = false;
            }
        }
    }
}
