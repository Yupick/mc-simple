// Component para gestión de mundos
function worldsManager() {
    return {
        worlds: [],
        activeWorld: null,
        loading: false,
        
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
        }
    }
}
